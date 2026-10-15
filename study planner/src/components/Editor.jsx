import { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, Trash2 } from "lucide-react";
import {
  COLORS,
  localDate,
  newId,
  PRIORITIES,
  STATUSES,
  STATUS_LABELS,
} from "../state/model.js";

import { draftKey, readDraft, writeDraft } from "../state/drafts.js";

export function Editor({ editor, courses, onClose, onSave, profileId }) {
  const dialog = useRef(null);
  const isCourse = editor.kind === "course";
  const item = editor.item;
  const key = draftKey(editor.kind, item?.id, profileId);
  const [draft] = useState(() => {
    const defaults = isCourse
      ? {
          name: item?.name || "",
          code: item?.code || "",
          color: item?.color || COLORS[0],
        }
      : {
          title: item?.title || "",
          courseId: item?.courseId || editor.courseId || courses[0]?.id || "",
          dueDate: item?.dueDate || localDate(),
          priority: item?.priority || "medium",
          status: item?.status || "todo",
          notes: item?.notes || "",
        };
    let restored = null;
    try {
      restored = readDraft(window.localStorage, key, defaults);
    } catch {
      /* Storage can be unavailable. */
    }
    const values = restored || defaults;
    if (isCourse && !COLORS.includes(values.color))
      values.color = defaults.color;
    if (!isCourse && !courses.some((c) => c.id === values.courseId))
      values.courseId = courses[0]?.id || "";
    return { values, restored: !!restored };
  });
  const [draftStatus, setDraftStatus] = useState(
    draft.restored
      ? "Your saved draft has been restored."
      : "Drafts save automatically as you type.",
  );
  function autosave(event) {
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      writeDraft(window.localStorage, key, values);
      setDraftStatus(
        "Draft saved on this device. Save below to update your planner.",
      );
    } catch {
      setDraftStatus(
        "Draft could not be saved. Keep this editor open and save your item.",
      );
    }
  }
  function discardDraft() {
    if (
      !window.confirm(
        "Discard this unfinished draft? Your saved planner item will stay unchanged.",
      )
    )
      return;
    try {
      window.localStorage.removeItem(key);
      onClose();
    } catch {
      setDraftStatus(
        "Draft could not be removed. Browser storage is unavailable.",
      );
    }
  }
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (isCourse) {
      if (!values.name.trim()) return;
      onSave({
        id: item?.id || newId(),
        name: values.name.trim(),
        code: values.code.trim(),
        color: values.color,
      });
    } else {
      if (!values.title.trim() || !values.courseId) return;
      onSave({
        id: item?.id || newId(),
        title: values.title.trim(),
        courseId: values.courseId,
        dueDate: values.dueDate,
        priority: values.priority,
        status: values.status,
        notes: values.notes.trim(),
      });
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* The main planner reports storage errors. */
    }
    onClose();
  }
  return (
    <dialog
      ref={dialog}
      className="editor"
      aria-labelledby="editor-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">MAKE A LITTLE PROGRESS</span>
          <h2 id="editor-title">
            {item ? "Edit" : "New"} {isCourse ? "course" : "assignment"}
          </h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close editor"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="draft-status" role="status">
        <CheckCircle2 size={15} />
        <span>{draftStatus}</span>
      </div>
      <form onSubmit={submit} onChange={autosave}>
        {isCourse ? (
          <>
            <label>
              Course name
              <input
                name="name"
                autoFocus
                required
                pattern=".*\S.*"
                title="Enter a course name containing text"
                maxLength={80}
                placeholder="e.g. Computer Science"
                defaultValue={draft.values.name}
              />
            </label>
            <label>
              Course code <span className="optional">(optional)</span>
              <input
                name="code"
                maxLength={24}
                placeholder="e.g. CS 201"
                defaultValue={draft.values.code}
              />
            </label>
            <fieldset className="color-picker">
              <legend>Course color</legend>
              {COLORS.map((color, i) => (
                <label key={color} style={{ "--course-color": color }}>
                  <input
                    type="radio"
                    aria-label={`Color ${i + 1}`}
                    name="color"
                    value={color}
                    defaultChecked={color === draft.values.color}
                  />
                  <span aria-label={`Color ${i + 1}`} />
                </label>
              ))}
            </fieldset>
          </>
        ) : (
          <>
            <label>
              Assignment title
              <input
                name="title"
                autoFocus
                required
                pattern=".*\S.*"
                title="Enter an assignment title containing text"
                maxLength={140}
                placeholder="What are you working on?"
                defaultValue={draft.values.title}
              />
            </label>
            <div className="form-grid">
              <label>
                Course
                <select
                  name="courseId"
                  required
                  defaultValue={draft.values.courseId}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Due date
                <input
                  type="date"
                  name="dueDate"
                  required
                  min="0001-01-01"
                  max="9999-12-31"
                  defaultValue={draft.values.dueDate}
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                Priority
                <select name="priority" defaultValue={draft.values.priority}>
                  {PRIORITIES.map((p) => (
                    <option value={p} key={p}>
                      {p[0].toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={draft.values.status}>
                  {STATUSES.map((s) => (
                    <option value={s} key={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Notes <span className="optional">(optional)</span>
              <textarea
                name="notes"
                rows={4}
                maxLength={4000}
                placeholder="Reading, links, or a small next step…"
                defaultValue={draft.values.notes}
              />
            </label>
          </>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button discard-button"
            onClick={discardDraft}
          >
            <Trash2 size={14} />
            Discard draft
          </button>
          <button type="button" className="button secondary" onClick={onClose}>
            Close
          </button>
          <button className="button primary" type="submit">
            {item
              ? "Save changes"
              : `Create ${isCourse ? "course" : "assignment"}`}
          </button>
        </div>
      </form>
    </dialog>
  );
}
