import { useEffect, useReducer, useState } from "react";
import { loadPlanner, plannerReducer, isValidData } from "./model.js";
import { profileStorageKey } from "./profiles.js";
import { emptyStudentData } from "./studentModel.js";
// Private state owner: called once per profile by StudyPlannerProvider.
export function usePlannerStore(profileId = "default") {
  const storageKey = profileStorageKey(profileId);
  const fresh = () => ({
    version: 1,
    courses: [],
    assignments: [],
    routine: [],
    tasks: [],
    notes: [],
  });
  const [initial] = useState(() => {
    try {
      return loadPlanner(
        window.localStorage,
        storageKey,
        profileId === "default" ? undefined : fresh,
      );
    } catch {
      return loadPlanner({
        getItem() {
          throw new Error("Storage unavailable");
        },
      });
    }
  });
  const [data, dispatch] = useReducer(
    plannerReducer,
    emptyStudentData(initial.data),
  );
  const [storageError, setStorageError] = useState(initial.error);
  const [savingEnabled, setSavingEnabled] = useState(!initial.error);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  useEffect(() => {
    if (!savingEnabled) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
      setStorageError("");
      setLastSavedAt(new Date());
    } catch {
      setStorageError(
        "Your browser could not save these changes. Your planner is still available in this tab. Free up browser storage or allow site storage, then retry.",
      );
    }
  }, [data, savingEnabled, storageKey]);
  function retrySaving() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
      setStorageError("");
      setSavingEnabled(true);
      setLastSavedAt(new Date());
    } catch {
      setStorageError(
        "Saving is still unavailable. Your changes remain in this tab.",
      );
    }
  }
  return {
    data,
    storageError,
    savingEnabled,
    lastSavedAt,
    retrySaving,
    restoreData: (restored) => {
      if (!isValidData(restored)) throw new Error("Invalid workspace backup");
      dispatch({ type: "workspace/restore", data: emptyStudentData(restored) });
      setSavingEnabled(true);
    },
    saveRoutine: (item) => dispatch({ type: "routine/save", item }),
    deleteRoutine: (id) => dispatch({ type: "routine/delete", id }),
    saveTask: (item) => dispatch({ type: "task/save", item }),
    deleteTask: (id) => dispatch({ type: "task/delete", id }),
    toggleTask: (id) => dispatch({ type: "task/toggle", id }),
    saveNote: (item) => dispatch({ type: "note/save", item }),
    deleteNote: (id) => dispatch({ type: "note/delete", id }),
    saveCourse: (course) => dispatch({ type: "course/save", course }),
    deleteCourse: (id) => dispatch({ type: "course/delete", id }),
    saveAssignment: (assignment) =>
      dispatch({ type: "assignment/save", assignment }),
    deleteAssignment: (id) => dispatch({ type: "assignment/delete", id }),
    setStatus: (id, status) =>
      dispatch({ type: "assignment/status", id, status }),
  };
}
