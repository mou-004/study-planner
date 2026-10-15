export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const emptyStudentData = (data) => ({
  ...data,
  routine: data.routine || [],
  tasks: data.tasks || [],
  notes: data.notes || [],
});
const text = (v) => typeof v === "string";
const nonempty = (v) => text(v) && !!v.trim();
export const validTime = (v) => text(v) && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
function validDate(v) {
  if (!text(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T12:00:00");
  return (
    !isNaN(d) &&
    d.getFullYear() === +v.slice(0, 4) &&
    d.getMonth() + 1 === +v.slice(5, 7) &&
    d.getDate() === +v.slice(8, 10)
  );
}
function uniqueValid(items, valid) {
  if (!Array.isArray(items)) return false;
  const ids = new Set();
  return items.every((item) => {
    if (!item || !nonempty(item.id) || ids.has(item.id) || !valid(item))
      return false;
    ids.add(item.id);
    return true;
  });
}
export function validStudentData(data, courseIds) {
  return (
    (data.routine === undefined ||
      uniqueValid(
        data.routine,
        (c) =>
          courseIds.has(c.courseId) &&
          Number.isInteger(c.day) &&
          c.day >= 0 &&
          c.day <= 6 &&
          validTime(c.start) &&
          validTime(c.end) &&
          c.start < c.end &&
          nonempty(c.room) &&
          nonempty(c.teacher),
      )) &&
    (data.tasks === undefined ||
      uniqueValid(
        data.tasks,
        (t) =>
          nonempty(t.title) &&
          (t.dueDate === "" || validDate(t.dueDate)) &&
          ["low", "medium", "high"].includes(t.priority) &&
          typeof t.done === "boolean",
      )) &&
    (data.notes === undefined ||
      uniqueValid(
        data.notes,
        (n) =>
          text(n.title) &&
          text(n.body) &&
          (n.courseId === "" || courseIds.has(n.courseId)) &&
          typeof n.pinned === "boolean" &&
          text(n.updatedAt) &&
          !isNaN(Date.parse(n.updatedAt)),
      ))
  );
}
function upsert(items, item) {
  return items.some((i) => i.id === item.id)
    ? items.map((i) => (i.id === item.id ? item : i))
    : [...items, item];
}
export function studentReducer(state, action) {
  switch (action.type) {
    case "routine/save": {
      const next = {
        ...state,
        routine: upsert(state.routine || [], action.item),
      };
      return validStudentData(next, new Set(state.courses.map((c) => c.id)))
        ? next
        : state;
    }
    case "routine/delete":
      return {
        ...state,
        routine: (state.routine || []).filter((c) => c.id !== action.id),
      };
    case "task/save": {
      const next = { ...state, tasks: upsert(state.tasks || [], action.item) };
      return validStudentData(next, new Set(state.courses.map((c) => c.id)))
        ? next
        : state;
    }
    case "task/delete":
      return {
        ...state,
        tasks: (state.tasks || []).filter((t) => t.id !== action.id),
      };
    case "task/toggle":
      return {
        ...state,
        tasks: (state.tasks || []).map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      };
    case "note/save": {
      const next = { ...state, notes: upsert(state.notes || [], action.item) };
      return validStudentData(next, new Set(state.courses.map((c) => c.id)))
        ? next
        : state;
    }
    case "note/delete":
      return {
        ...state,
        notes: (state.notes || []).filter((n) => n.id !== action.id),
      };
    default:
      return state;
  }
}
export function conflictsFor(item, routine) {
  return routine.filter(
    (c) =>
      c.id !== item.id &&
      c.day === item.day &&
      c.start < item.end &&
      item.start < c.end,
  );
}
export function nextClass(routine, now = new Date()) {
  return (
    routine
      .map((c) => {
        const start = new Date(now);
        start.setHours(...c.start.split(":").map(Number), 0, 0);
        start.setDate(start.getDate() + ((c.day - now.getDay() + 7) % 7));
        const end = new Date(start);
        end.setHours(...c.end.split(":").map(Number), 0, 0);
        if (end <= now) {
          start.setDate(start.getDate() + 7);
          end.setDate(end.getDate() + 7);
        }
        return {
          ...c,
          startsAt: start,
          endsAt: end,
          isNow: start <= now && end > now,
        };
      })
      .sort((a, b) => a.startsAt - b.startsAt)[0] || null
  );
}
