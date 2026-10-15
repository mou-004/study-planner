import { validStudentData, studentReducer } from "./studentModel.js";
export const STORAGE_KEY = "study-planner:v1";
export const STATUSES = ["todo", "in-progress", "done"];
export const PRIORITIES = ["low", "medium", "high"];
export const STATUS_LABELS = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Completed",
};
export const COLORS = [
  "#477c69",
  "#7875b5",
  "#bd8254",
  "#5b8dac",
  "#b46f87",
  "#86964c",
];
export function localDate(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDate(date);
}
export const newId = () => globalThis.crypto.randomUUID();
export function seedData() {
  return {
    version: 1,
    courses: [
      { id: "c1", name: "Computer Science", code: "CS 201", color: COLORS[0] },
      {
        id: "c2",
        name: "Design Principles",
        code: "DES 110",
        color: COLORS[1],
      },
      {
        id: "c3",
        name: "Applied Mathematics",
        code: "MATH 204",
        color: COLORS[2],
      },
    ],
    assignments: [
      {
        id: "a1",
        courseId: "c1",
        title: "Build a binary search tree",
        dueDate: offsetDate(0),
        priority: "high",
        status: "in-progress",
        notes: "Implement insert, search, and delete. Add complexity notes.",
      },
      {
        id: "a2",
        courseId: "c2",
        title: "Visual hierarchy exploration",
        dueDate: offsetDate(1),
        priority: "medium",
        status: "todo",
        notes: "Create three poster compositions using one typeface.",
      },
      {
        id: "a3",
        courseId: "c3",
        title: "Problem set: integrals",
        dueDate: offsetDate(3),
        priority: "high",
        status: "todo",
        notes: "Chapter 6, exercises 1–12.",
      },
      {
        id: "a4",
        courseId: "c1",
        title: "Algorithm analysis notes",
        dueDate: offsetDate(-1),
        priority: "low",
        status: "done",
        notes: "",
      },
      {
        id: "a5",
        courseId: "c2",
        title: "Typography reading response",
        dueDate: offsetDate(-2),
        priority: "medium",
        status: "done",
        notes: "",
      },
      {
        id: "a6",
        courseId: "c3",
        title: "Review differential equations",
        dueDate: offsetDate(-1),
        priority: "medium",
        status: "todo",
        notes: "Review lecture examples before the next class.",
      },
    ],
  };
}
export function isValidData(data) {
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.courses) ||
    !Array.isArray(data.assignments)
  )
    return false;
  const ids = new Set();
  for (const c of data.courses) {
    if (
      !c ||
      typeof c.id !== "string" ||
      ids.has(c.id) ||
      typeof c.name !== "string" ||
      !c.name.trim() ||
      typeof c.code !== "string" ||
      !/^#[\da-f]{6}$/i.test(c.color)
    )
      return false;
    ids.add(c.id);
  }
  const assignmentIds = new Set();
  return (
    validStudentData(data, ids) &&
    data.assignments.every((a) => {
      if (
        !a ||
        typeof a.id !== "string" ||
        assignmentIds.has(a.id) ||
        !ids.has(a.courseId) ||
        typeof a.title !== "string" ||
        !a.title.trim() ||
        typeof a.notes !== "string" ||
        !STATUSES.includes(a.status) ||
        !PRIORITIES.includes(a.priority) ||
        !isValidDate(a.dueDate)
      )
        return false;
      assignmentIds.add(a.id);
      return true;
    })
  );
}
export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}
export function loadPlanner(storage, key = STORAGE_KEY, fresh = seedData) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { data: fresh(), error: "" };
    const data = JSON.parse(raw);
    if (!isValidData(data)) throw new Error("Invalid data");
    return { data, error: "" };
  } catch {
    return {
      data: { version: 1, courses: [], assignments: [] },
      error:
        "Saved data could not be loaded. Changes will stay in memory until you choose to enable saving. Your previous saved data has not been overwritten.",
    };
  }
}
// Pure transitions are intentionally independent of React and persistence.
export function plannerReducer(state, action) {
  switch (action.type) {
    case "workspace/restore":
      return isValidData(action.data) ? action.data : state;
    case "course/save":
      return { ...state, courses: upsert(state.courses, action.course) };
    case "course/delete":
      return {
        ...state,
        courses: state.courses.filter((c) => c.id !== action.id),
        assignments: state.assignments.filter((a) => a.courseId !== action.id),
        routine: (state.routine || []).filter((c) => c.courseId !== action.id),
        notes: (state.notes || []).map((n) =>
          n.courseId === action.id ? { ...n, courseId: "" } : n,
        ),
      };
    case "assignment/save":
      return state.courses.some((c) => c.id === action.assignment.courseId)
        ? {
            ...state,
            assignments: upsert(state.assignments, action.assignment),
          }
        : state;
    case "assignment/delete":
      return {
        ...state,
        assignments: state.assignments.filter((a) => a.id !== action.id),
      };
    case "assignment/status":
      return STATUSES.includes(action.status)
        ? {
            ...state,
            assignments: state.assignments.map((a) =>
              a.id === action.id ? { ...a, status: action.status } : a,
            ),
          }
        : state;
    default:
      return studentReducer(state, action);
  }
}
function upsert(items, item) {
  return items.some((i) => i.id === item.id)
    ? items.map((i) => (i.id === item.id ? item : i))
    : [...items, item];
}
export function progress(assignments) {
  const completed = assignments.filter((a) => a.status === "done").length;
  return {
    completed,
    total: assignments.length,
    percent: assignments.length
      ? Math.round((completed / assignments.length) * 100)
      : 0,
  };
}
export function selectAssignments(assignments, filters, today = localDate()) {
  const result = assignments.filter(
    (a) =>
      (!filters.course || a.courseId === filters.course) &&
      (!filters.priority || a.priority === filters.priority) &&
      (!filters.dueDate || a.dueDate === filters.dueDate) &&
      (!filters.status ||
        (filters.status === "overdue"
          ? a.status !== "done" && a.dueDate < today
          : filters.status === "open"
            ? a.status !== "done"
            : a.status === filters.status)) &&
      (!filters.query ||
        `${a.title} ${a.notes}`
          .toLowerCase()
          .includes(filters.query.trim().toLowerCase())),
  );
  const rank = { high: 0, medium: 1, low: 2 };
  return [...result].sort(
    (a, b) =>
      (filters.sort === "priority"
        ? rank[a.priority] - rank[b.priority]
        : filters.sort === "title"
          ? a.title.localeCompare(b.title)
          : a.dueDate.localeCompare(b.dueDate)) ||
      a.title.localeCompare(b.title),
  );
}

export function parseBackup(text) {
  if (text.length > 2_000_000)
    throw new Error(
      "This backup is too large. Choose a planner JSON file under 2 MB.",
    );
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON. Choose a Studyspace backup.");
  }
  if (!isValidData(data))
    throw new Error(
      "This backup is incompatible or contains invalid data. Your current planner has not changed.",
    );
  return data;
}

export function nextSevenDays(today = localDate()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() + index);
    return localDate(date);
  });
}
