import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidData,
  loadPlanner,
  parseBackup,
  plannerReducer,
  seedData,
} from "../src/state/model.js";
import {
  conflictsFor,
  emptyStudentData,
  nextClass,
} from "../src/state/studentModel.js";
import {
  ACTIVE_PROFILE_KEY,
  PROFILES_KEY,
  profileStorageKey,
  readProfiles,
  writeProfiles,
} from "../src/state/profiles.js";
import { draftKey, writeDraft, readDraft } from "../src/state/drafts.js";
const blank = () => ({
  version: 1,
  courses: [],
  assignments: [],
  routine: [],
  tasks: [],
  notes: [],
});
const course = {
  id: "c1",
  name: "Algorithms",
  code: "CS201",
  color: "#477c69",
};
const base = () => ({ ...blank(), courses: [course] });
const session = {
  id: "r1",
  courseId: "c1",
  day: 1,
  start: "09:00",
  end: "10:00",
  room: "B-304",
  teacher: "Dr. Taylor",
};
const task = {
  id: "t1",
  title: "Revise lecture 3",
  dueDate: "2026-10-15",
  priority: "high",
  done: false,
};
const note = {
  id: "n1",
  title: "Lecture ideas",
  body: "Recall binary trees",
  courseId: "c1",
  pinned: true,
  updatedAt: "2026-10-15T10:00:00Z",
};
function memory() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  };
}

test("every student has isolated planner and draft storage", () => {
  const storage = memory();
  storage.setItem(
    profileStorageKey("student-a"),
    JSON.stringify({ ...base(), tasks: [task] }),
  );
  storage.setItem(profileStorageKey("student-b"), JSON.stringify(blank()));
  assert.equal(
    loadPlanner(storage, profileStorageKey("student-a"), blank).data.tasks
      .length,
    1,
  );
  assert.equal(
    loadPlanner(storage, profileStorageKey("student-b"), blank).data.tasks
      .length,
    0,
  );
  assert.equal(
    loadPlanner(storage, profileStorageKey("student-c"), blank).data.courses
      .length,
    0,
  );
  writeDraft(storage, draftKey("assignment", undefined, "student-a"), {
    title: "Only A",
  });
  assert.equal(
    readDraft(storage, draftKey("assignment", undefined, "student-b"), {
      title: "",
    }),
    null,
  );
});
test("the original workspace and drafts remain available in the default profile", () => {
  assert.equal(profileStorageKey("default"), "study-planner:v1");
  assert.equal(
    draftKey("assignment", undefined, "default"),
    "study-planner:draft:assignment:new",
  );
  const old = seedData();
  const upgraded = emptyStudentData(old);
  assert.deepEqual(upgraded.assignments, old.assignments);
  assert.deepEqual(upgraded.routine, []);
  assert.equal(isValidData(upgraded), true);
});
test("profile registry restores a valid selection and falls back for stale ids", () => {
  const storage = memory();
  assert.equal(readProfiles(storage).active, "default");
  writeProfiles(storage, [
    { id: "default", name: "Alex" },
    { id: "student-b", name: "Jordan" },
  ]);
  storage.setItem(ACTIVE_PROFILE_KEY, "student-b");
  assert.equal(readProfiles(storage).active, "student-b");
  storage.setItem(ACTIVE_PROFILE_KEY, "missing");
  assert.equal(readProfiles(storage).active, "default");
});
test("corrupt and duplicate profile registries are rejected", () => {
  const storage = memory();
  storage.setItem(PROFILES_KEY, "broken");
  assert.throws(() => readProfiles(storage));
  writeProfiles(storage, [
    { id: "same", name: "A" },
    { id: "same", name: "B" },
  ]);
  assert.throws(() => readProfiles(storage));
  assert.ok(storage.getItem(PROFILES_KEY).includes("same"));
});
test("routine CRUD and validation preserve course, day, and time integrity", () => {
  let state = plannerReducer(base(), { type: "routine/save", item: session });
  assert.equal(state.routine.length, 1);
  assert.equal(isValidData(state), true);
  const invalid = plannerReducer(state, {
    type: "routine/save",
    item: { ...session, end: "08:00" },
  });
  assert.equal(invalid, state);
  assert.equal(
    plannerReducer(state, {
      type: "routine/save",
      item: { ...session, day: 7 },
    }),
    state,
  );
  assert.equal(
    plannerReducer(state, {
      type: "routine/save",
      item: { ...session, start: "25:00" },
    }),
    state,
  );
  state = plannerReducer(state, {
    type: "routine/save",
    item: { ...session, room: "C-102" },
  });
  assert.equal(state.routine.length, 1);
  assert.equal(state.routine[0].room, "C-102");
  assert.equal(
    plannerReducer(state, { type: "routine/delete", id: "r1" }).routine.length,
    0,
  );
});
test("clash detection excludes adjacent, other-day, and same-id classes", () => {
  const classes = [
    session,
    { ...session, id: "r2", start: "09:30", end: "10:30" },
    { ...session, id: "r3", start: "10:00", end: "11:00" },
    { ...session, id: "r4", day: 2 },
  ];
  assert.deepEqual(
    conflictsFor(session, classes).map((c) => c.id),
    ["r2"],
  );
});
test("next class detects an ongoing session, then the next weekly occurrence", () => {
  const current = nextClass([session], new Date("2026-10-12T09:30:00"));
  assert.equal(current.isNow, true);
  assert.equal(current.startsAt.getDate(), 12);
  const after = nextClass([session], new Date("2026-10-12T10:00:00"));
  assert.equal(after.isNow, false);
  assert.equal(after.startsAt.getDate(), 19);
  assert.equal(nextClass([], new Date()), null);
});
test("personal tasks save, update, complete, reopen, and delete independently of courses", () => {
  let state = plannerReducer(blank(), { type: "task/save", item: task });
  assert.equal(state.tasks.length, 1);
  assert.equal(isValidData(state), true);
  state = plannerReducer(state, { type: "task/toggle", id: task.id });
  assert.equal(state.tasks[0].done, true);
  state = plannerReducer(state, { type: "task/toggle", id: task.id });
  assert.equal(state.tasks[0].done, false);
  state = plannerReducer(state, {
    type: "task/save",
    item: { ...task, title: "Updated" },
  });
  assert.equal(state.tasks.length, 1);
  assert.equal(
    plannerReducer(state, { type: "task/delete", id: task.id }).tasks.length,
    0,
  );
});
test("notes can be repeatedly autosaved without duplicating an item", () => {
  let state = plannerReducer(base(), { type: "note/save", item: note });
  const before = state;
  state = plannerReducer(state, {
    type: "note/save",
    item: { ...note, body: "New writing", pinned: false },
  });
  assert.equal(state.notes.length, 1);
  assert.equal(state.notes[0].body, "New writing");
  assert.equal(before.notes[0].body, "Recall binary trees");
  assert.equal(isValidData(state), true);
  assert.equal(
    plannerReducer(state, { type: "note/delete", id: note.id }).notes.length,
    0,
  );
});
test("course deletion removes its routine while retaining notes as personal notes", () => {
  const data = { ...base(), routine: [session], notes: [note], tasks: [task] };
  const result = plannerReducer(data, { type: "course/delete", id: "c1" });
  assert.equal(result.routine.length, 0);
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0].courseId, "");
  assert.equal(result.tasks.length, 1);
  assert.equal(isValidData(result), true);
});
test("backups preserve all student features and reject invalid extended data", () => {
  const data = { ...base(), routine: [session], notes: [note], tasks: [task] };
  assert.deepEqual(parseBackup(JSON.stringify(data)), data);
  assert.throws(() =>
    parseBackup(
      JSON.stringify({
        ...data,
        routine: [{ ...session, courseId: "missing" }],
      }),
    ),
  );
  assert.throws(() =>
    parseBackup(
      JSON.stringify({ ...data, notes: [{ ...note, updatedAt: "invalid" }] }),
    ),
  );
  assert.throws(() =>
    parseBackup(
      JSON.stringify({ ...data, tasks: [{ ...task, dueDate: "2026-02-30" }] }),
    ),
  );
});
