import { useRef, useState } from "react";
import { Users, Plus, X } from "lucide-react";
import {
  ACTIVE_PROFILE_KEY,
  DEFAULT_PROFILE,
  readProfiles,
  writeProfiles,
} from "../state/profiles.js";
import { newId } from "../state/model.js";
export function useProfiles() {
  const [initial] = useState(() => {
    try {
      return { ...readProfiles(window.localStorage), error: "" };
    } catch (error) {
      return {
        profiles: [DEFAULT_PROFILE],
        active: "default",
        error: error.message,
      };
    }
  });
  const [profiles, setProfiles] = useState(initial.profiles);
  const [active, setActive] = useState(initial.active);
  const [error, setError] = useState(initial.error);
  function switchProfile(id) {
    if (!profiles.some((p) => p.id === id)) return;
    try {
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
      setActive(id);
      setError("");
    } catch {
      setError(
        "Could not switch profiles. Allow browser storage and try again.",
      );
    }
  }
  function saveProfile(name, id) {
    if (initial.error) {
      setError(
        "The saved profile list is unreadable or storage is unavailable. Reload after resolving browser storage. Existing profile data has not been overwritten.",
      );
      return false;
    }
    name = name.trim();
    if (!name || name.length > 40) return false;
    if (
      profiles.some(
        (p) => p.name.toLowerCase() === name.toLowerCase() && p.id !== id,
      )
    ) {
      setError("Choose a different name for this profile.");
      return false;
    }
    const nextId = id || newId();
    const next = id
      ? profiles.map((p) => (p.id === id ? { ...p, name } : p))
      : [...profiles, { id: nextId, name }];
    try {
      writeProfiles(window.localStorage, next);
      setProfiles(next);
      setError("");
      if (!id) switchToNew(nextId);
      return true;
    } catch {
      setError(
        "The profile could not be saved. Allow browser storage and try again.",
      );
      return false;
    }
  }
  function switchToNew(id) {
    try {
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } catch {
      /* The list is already saved. */
    }
    setActive(id);
  }
  return { profiles, active, error, switchProfile, saveProfile };
}
export function ProfileSwitcher({ manager }) {
  const dialog = useRef(null);
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const current = manager.profiles.find((p) => p.id === manager.active);
  function open(rename) {
    setRenaming(rename);
    setName(rename ? current.name : "");
    dialog.current.showModal();
  }
  return (
    <div className="profile-switcher">
      <Users size={17} />
      <select
        aria-label="Active student profile"
        value={manager.active}
        onChange={(e) => manager.switchProfile(e.target.value)}
      >
        {manager.profiles.map((p) => (
          <option value={p.id} key={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        className="icon-button"
        aria-label="Add student profile"
        onClick={() => open(false)}
      >
        <Plus size={17} />
      </button>
      <button className="profile-rename" onClick={() => open(true)}>
        Rename
      </button>
      <dialog className="editor" ref={dialog} aria-labelledby="profile-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">A WORKSPACE OF YOUR OWN</span>
            <h2 id="profile-title">
              {renaming ? "Rename profile" : "Add a student"}
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close profile editor"
            onClick={() => dialog.current.close()}
          >
            <X size={20} />
          </button>
        </div>
        <p className="profile-help">
          Each student gets separate courses, assignments, routines, tasks, and
          notes. These are local profiles without passwords; anyone on this
          browser can switch profiles.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              manager.saveProfile(name, renaming ? manager.active : undefined)
            )
              dialog.current.close();
          }}
        >
          <label>
            Student name
            <input
              required
              maxLength={40}
              pattern=".*\S.*"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Taylor"
            />
          </label>
          {manager.error && (
            <p role="alert" className="form-error">
              {manager.error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => dialog.current.close()}
            >
              Cancel
            </button>
            <button className="button primary">
              {renaming ? "Save name" : "Create profile"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
