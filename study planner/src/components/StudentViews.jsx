import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  User,
  Plus,
  Pencil,
  Trash2,
  Pin,
  Search,
  ArrowUpRight,
  StickyNote,
  X,
  AlertTriangle,
} from "lucide-react";
import { localDate, newId } from "../state/model.js";
import { conflictsFor, DAYS, nextClass } from "../state/studentModel.js";
import { draftKey, readDraft, writeDraft } from "../state/drafts.js";

export function NextClassCard({ data, onRoutine }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const upcoming = nextClass(data.routine, now);
  const course = data.courses.find((c) => c.id === upcoming?.courseId);
  return (
    <section className="campus-banner">
      <span className="campus-icon">
        <CalendarDays size={24} />
      </span>
      <div>
        <span className="eyebrow">
          {upcoming?.isNow ? "HAPPENING NOW" : "CAMPUS COMPANION"}
        </span>
        <h3>
          {upcoming
            ? `${course?.name} · ${upcoming.start}–${upcoming.end}`
            : "Your campus day, organized"}
        </h3>
        <p>
          {upcoming
            ? `${upcoming.startsAt.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} · Room ${upcoming.room} · ${upcoming.teacher}`
            : "Add your weekly routine to see your next class, teacher, and room here."}
        </p>
      </div>
      <button className="button secondary" onClick={onRoutine}>
        View routine
        <ArrowUpRight size={16} />
      </button>
    </section>
  );
}

export function RoutineView({ data, onEdit, onDelete, onAdd }) {
  const [day, setDay] = useState(() => new Date().getDay());
  const classes = data.routine
    .filter((c) => c.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));
  const clashes = data.routine.filter(
    (c) => conflictsFor(c, data.routine).length,
  );
  return (
    <section className="student-section">
      <div className="routine-summary">
        <span>
          <strong>{data.routine.length}</strong> classes each week
        </span>
        <span>
          <strong>{new Set(data.routine.map((c) => c.day)).size}</strong> campus
          days
        </span>
        <span className={clashes.length ? "late-text" : ""}>
          <strong>{clashes.length}</strong> classes with a time clash
        </span>
      </div>
      <div className="day-tabs" aria-label="Routine day">
        {DAYS.map((label, i) => (
          <button
            key={label}
            aria-pressed={day === i}
            className={day === i ? "selected" : ""}
            onClick={() => setDay(i)}
          >
            <span>{label.slice(0, 3)}</span>
            <strong>{data.routine.filter((c) => c.day === i).length}</strong>
            {i === new Date().getDay() && <small>Today</small>}
          </button>
        ))}
      </div>
      <div className="section-title">
        <h2>
          {DAYS[day]} classes<span>{classes.length}</span>
        </h2>
        <button className="text-button" onClick={() => onAdd(day)}>
          <Plus size={16} />
          Add class
        </button>
      </div>
      <div className="routine-list">
        {classes.map((c) => {
          const course = data.courses.find((item) => item.id === c.courseId);
          const conflicts = conflictsFor(c, data.routine);
          return (
            <article
              className="routine-card"
              key={c.id}
              style={{ "--course-color": course?.color }}
            >
              <div className="class-time">
                <Clock3 size={17} />
                <strong>{c.start}</strong>
                <span>{c.end}</span>
              </div>
              <div className="class-details">
                <span className="eyebrow">
                  {course?.code || "UNIVERSITY CLASS"}
                </span>
                <h3>{course?.name}</h3>
                <p>
                  <span>
                    <MapPin size={14} />
                    Room {c.room}
                  </span>
                  <span>
                    <User size={14} />
                    {c.teacher}
                  </span>
                </p>
                {conflicts.length > 0 && (
                  <div className="clash-warning">
                    <AlertTriangle size={13} />
                    Overlaps{" "}
                    {conflicts
                      .map(
                        (other) =>
                          `${data.courses.find((course) => course.id === other.courseId)?.name} (${other.start}–${other.end})`,
                      )
                      .join(", ")}
                  </div>
                )}
              </div>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={`Edit ${course?.name} class`}
                  onClick={() => onEdit(c)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`Delete ${course?.name} class`}
                  onClick={() => onDelete(c)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
        {!classes.length && (
          <div className="empty-state">
            <CalendarDays size={32} />
            <h3>No classes on {DAYS[day]}</h3>
            <p>Add your routine or keep this day for independent study.</p>
            <button className="button secondary" onClick={() => onAdd(day)}>
              Add a class
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function TasksView({ data, planner, onEdit, onAdd }) {
  const [filter, setFilter] = useState("open");
  const today = localDate();
  const tasks = data.tasks
    .filter(
      (t) =>
        filter === "all" ||
        (filter === "done" && t.done) ||
        (filter === "open" && !t.done) ||
        (filter === "today" && !t.done && t.dueDate === today),
    )
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
    );
  return (
    <section className="student-section">
      <div className="assignment-tabs">
        {[
          ["open", "Open"],
          ["today", "Today"],
          ["done", "Completed"],
          ["all", "All tasks"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={value === filter ? "selected" : ""}
            aria-pressed={value === filter}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="personal-task-list">
        {tasks.map((t) => (
          <article
            className={`personal-task ${t.done ? "is-done" : ""}`}
            key={t.id}
          >
            <button
              className={`check-button ${t.done ? "checked" : ""}`}
              aria-label={`${t.done ? "Reopen" : "Complete"} task ${t.title}`}
              onClick={() => planner.toggleTask(t.id)}
            >
              {t.done && <Check size={14} />}
            </button>
            <div>
              <h3>{t.title}</h3>
              <p>
                {t.dueDate ? (
                  <span
                    className={!t.done && t.dueDate < today ? "late-text" : ""}
                  >
                    <CalendarDays size={13} />
                    {t.dueDate === today
                      ? "Today"
                      : new Date(t.dueDate + "T12:00:00").toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                    {!t.done && t.dueDate < today ? " · Overdue" : ""}
                  </span>
                ) : (
                  <span>No deadline</span>
                )}
                <span className={`priority priority-${t.priority}`}>
                  {t.priority} priority
                </span>
              </p>
            </div>
            <div className="row-actions">
              <button
                className="icon-button"
                aria-label={`Edit task ${t.title}`}
                onClick={() => onEdit(t)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button danger"
                aria-label={`Delete task ${t.title}`}
                onClick={() => {
                  if (window.confirm(`Delete “${t.title}”?`))
                    planner.deleteTask(t.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {!tasks.length && (
          <div className="empty-state">
            <Check size={32} />
            <h3>
              {filter === "done"
                ? "Your completed tasks will appear here"
                : "Room for your own goals"}
            </h3>
            <p>
              Plan revision, errands, applications, or anything outside a
              course.
            </p>
            <button className="button secondary" onClick={onAdd}>
              Add personal task
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function NotesView({ data, planner, onTaskCreated, newNoteId }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(data.notes[0]?.id || null);
  useEffect(() => {
    if (newNoteId && data.notes.some((n) => n.id === newNoteId))
      setSelected(newNoteId);
  }, [newNoteId]);
  const notes = data.notes
    .filter((n) =>
      `${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
  const note = data.notes.find((n) => n.id === selected);
  function add() {
    const next = {
      id: newId(),
      title: "",
      body: "",
      courseId: "",
      pinned: false,
      updatedAt: new Date().toISOString(),
    };
    planner.saveNote(next);
    setSelected(next.id);
  }
  function update(changes) {
    planner.saveNote({
      ...note,
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  }
  return (
    <section className="notes-workspace">
      <aside className="notes-library">
        <div className="notes-library-heading">
          <h2>
            Notebook<span>{data.notes.length}</span>
          </h2>
          <button
            className="icon-button"
            aria-label="Create note"
            onClick={add}
          >
            <Plus size={19} />
          </button>
        </div>
        <label className="note-search">
          <Search size={16} />
          <input
            aria-label="Search notes"
            placeholder="Find a note…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="notes-list">
          {notes.map((n) => (
            <button
              key={n.id}
              className={selected === n.id ? "selected" : ""}
              onClick={() => setSelected(n.id)}
            >
              <strong>
                {n.pinned && <Pin size={12} />}{" "}
                {n.title.trim() || "Untitled note"}
              </strong>
              <p>{n.body.slice(0, 95) || "Start writing your ideas…"}</p>
              <small>
                {data.courses.find((c) => c.id === n.courseId)?.name ||
                  "Personal note"}{" "}
                ·{" "}
                {new Date(n.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </small>
            </button>
          ))}
          {!notes.length && (
            <p className="notes-no-results">
              {query ? "No matching notes." : "Your notes will appear here."}
            </p>
          )}
        </div>
      </aside>
      <div className="note-page">
        {note ? (
          <>
            <div className="note-toolbar">
              <select
                aria-label="Note course"
                value={note.courseId}
                onChange={(e) => update({ courseId: e.target.value })}
              >
                <option value="">Personal note</option>
                {data.courses.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div>
                <button
                  className={`icon-button ${note.pinned ? "pinned" : ""}`}
                  aria-label={note.pinned ? "Unpin note" : "Pin note"}
                  onClick={() => update({ pinned: !note.pinned })}
                >
                  <Pin size={17} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label="Delete current note"
                  onClick={() => {
                    if (window.confirm("Delete this note permanently?")) {
                      planner.deleteNote(note.id);
                      setSelected(
                        data.notes.find((n) => n.id !== note.id)?.id || null,
                      );
                    }
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <input
              className="note-title-input"
              aria-label="Note title"
              placeholder="Untitled note"
              value={note.title}
              maxLength={120}
              onChange={(e) => update({ title: e.target.value })}
            />
            <textarea
              className="note-body"
              aria-label="Note content"
              placeholder="Capture lecture notes, ideas, and things to revisit…"
              value={note.body}
              maxLength={40000}
              onChange={(e) => update({ body: e.target.value })}
            />
            <div className="note-footer">
              <span>
                {note.body.trim() ? note.body.trim().split(/\s+/).length : 0}{" "}
                words ·{" "}
                {planner.storageError
                  ? "Not saved — see the warning above"
                  : "Saved automatically"}
              </span>
              <button
                className="text-button"
                onClick={() => {
                  planner.saveTask({
                    id: newId(),
                    title: `Review: ${note.title.trim() || "Untitled note"}`,
                    dueDate: localDate(),
                    priority: "medium",
                    done: false,
                  });
                  onTaskCreated();
                }}
              >
                Turn into review task
                <ArrowUpRight size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <StickyNote size={36} />
            <h3>Your ideas deserve a place</h3>
            <p>
              Write lecture notes, pin important ideas, and turn notes into
              review tasks.
            </p>
            <button className="button primary" onClick={add}>
              Create your first note
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function StudentEditor({ editor, data, profileId, onSave, onClose }) {
  const routine = editor.kind === "routine";
  const item = editor.item;
  const dialog = useRef(null);
  const key = draftKey(editor.kind, item?.id, profileId);
  const [initial] = useState(() => {
    const defaults = routine
      ? {
          courseId: item?.courseId || data.courses[0]?.id || "",
          day: String(item?.day ?? editor.day ?? new Date().getDay()),
          start: item?.start || "09:00",
          end: item?.end || "10:00",
          room: item?.room || "",
          teacher: item?.teacher || "",
        }
      : {
          title: item?.title || "",
          dueDate: item?.dueDate || "",
          priority: item?.priority || "medium",
        };
    try {
      return readDraft(window.localStorage, key, defaults) || defaults;
    } catch {
      return defaults;
    }
  });
  const [message, setMessage] = useState(
    "Unfinished changes save as a draft on this profile.",
  );
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  function submit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (routine && values.end <= values.start) {
      setMessage(
        "End time must be later than start time. Split overnight classes into two entries.",
      );
      return;
    }
    const result = routine
      ? { ...values, id: item?.id || newId(), day: Number(values.day) }
      : {
          ...values,
          title: values.title.trim(),
          id: item?.id || newId(),
          done: item?.done || false,
        };
    onSave(result);
    try {
      window.localStorage.removeItem(key);
    } catch {}
    onClose();
  }
  return (
    <dialog
      className="editor"
      ref={dialog}
      aria-labelledby="student-editor-title"
      onCancel={onClose}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">MAKE YOUR WEEK WORK</span>
          <h2 id="student-editor-title">
            {item ? "Edit" : "New"} {routine ? "class" : "personal task"}
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
        {message}
      </div>
      <form
        onSubmit={submit}
        onChange={(e) => {
          try {
            writeDraft(
              window.localStorage,
              key,
              Object.fromEntries(new FormData(e.currentTarget)),
            );
            setMessage("Draft saved on this profile.");
          } catch {
            setMessage("Draft saving is unavailable. Keep this editor open.");
          }
        }}
      >
        {routine ? (
          <>
            <label>
              Course
              <select
                name="courseId"
                required
                defaultValue={
                  data.courses.some((c) => c.id === initial.courseId)
                    ? initial.courseId
                    : data.courses[0]?.id
                }
              >
                {data.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                Day
                <select name="day" defaultValue={initial.day}>
                  {DAYS.map((d, i) => (
                    <option value={i} key={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Room
                <input
                  name="room"
                  required
                  maxLength={60}
                  defaultValue={initial.room}
                  placeholder="e.g. B-304"
                  pattern=".*\S.*"
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                Start time
                <input
                  type="time"
                  name="start"
                  required
                  defaultValue={initial.start}
                />
              </label>
              <label>
                End time
                <input
                  type="time"
                  name="end"
                  required
                  defaultValue={initial.end}
                />
              </label>
            </div>
            <label>
              Teacher
              <input
                name="teacher"
                required
                maxLength={100}
                defaultValue={initial.teacher}
                placeholder="e.g. Dr. Taylor"
                pattern=".*\S.*"
              />
            </label>
            <p className="profile-help">
              Classes repeat every week. Overlapping times are flagged in your
              routine.
            </p>
          </>
        ) : (
          <>
            <label>
              Task title
              <input
                name="title"
                required
                pattern=".*\S.*"
                maxLength={160}
                defaultValue={initial.title}
                placeholder="e.g. Revise lecture 3"
                autoFocus
              />
            </label>
            <div className="form-grid">
              <label>
                Due date (optional)
                <input
                  type="date"
                  name="dueDate"
                  min="0001-01-01"
                  max="9999-12-31"
                  defaultValue={initial.dueDate}
                />
              </label>
              <label>
                Priority
                <select name="priority" defaultValue={initial.priority}>
                  {["low", "medium", "high"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Close
          </button>
          <button className="button primary">
            Save {routine ? "class" : "task"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
