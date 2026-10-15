import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidData,
  loadPlanner,
  plannerReducer,
  progress,
  seedData,
  selectAssignments,
  STORAGE_KEY,
} from "../src/state/model.js";

test("demo data passes validation and remains relative to the current date", () => {
  assert.equal(isValidData(seedData()), true);
  assert.equal(progress(seedData().assignments).completed, 2);
});
test("course deletion removes only its associated assignments", () => {
  const before = seedData();
  const after = plannerReducer(before, { type: "course/delete", id: "c1" });
  assert.equal(after.courses.length, 2);
  assert.equal(after.assignments.length, 4);
  assert.ok(after.assignments.every((a) => a.courseId !== "c1"));
  assert.equal(before.assignments.length, 6);
});
test("assignments can be created, updated, completed, reopened and deleted", () => {
  const assignment = {
    id: "new",
    courseId: "c1",
    title: "Test assignment",
    dueDate: "2026-10-18",
    priority: "high",
    status: "todo",
    notes: "",
  };
  let state = plannerReducer(seedData(), {
    type: "assignment/save",
    assignment,
  });
  assert.equal(state.assignments.length, 7);
  state = plannerReducer(state, {
    type: "assignment/save",
    assignment: { ...assignment, title: "Updated title" },
  });
  assert.equal(state.assignments.length, 7);
  assert.equal(
    state.assignments.find((a) => a.id === "new").title,
    "Updated title",
  );
  state = plannerReducer(state, {
    type: "assignment/status",
    id: "new",
    status: "done",
  });
  assert.equal(progress(state.assignments).completed, 3);
  state = plannerReducer(state, {
    type: "assignment/status",
    id: "new",
    status: "todo",
  });
  assert.equal(progress(state.assignments).completed, 2);
  state = plannerReducer(state, { type: "assignment/delete", id: "new" });
  assert.equal(state.assignments.length, 6);
});
test("course save updates without duplication and supports a new course", () => {
  let state = plannerReducer(seedData(), {
    type: "course/save",
    course: { id: "c1", name: "New name", code: "", color: "#477c69" },
  });
  assert.equal(state.courses.length, 3);
  assert.equal(state.courses[0].name, "New name");
  state = plannerReducer(state, {
    type: "course/save",
    course: { id: "c4", name: "History", code: "H101", color: "#477c69" },
  });
  assert.equal(state.courses.length, 4);
});
test("invalid status and orphan assignments do not corrupt state", () => {
  const state = seedData();
  assert.equal(
    plannerReducer(state, {
      type: "assignment/status",
      id: "a1",
      status: "invalid",
    }),
    state,
  );
  assert.equal(
    plannerReducer(state, {
      type: "assignment/save",
      assignment: { ...state.assignments[0], courseId: "missing" },
    }),
    state,
  );
});
test("filters compose and overdue excludes completed work and today", () => {
  const assignments = [
    {
      id: "1",
      title: "Essay",
      notes: "Read Chapter One",
      courseId: "c1",
      status: "todo",
      dueDate: "2026-10-14",
      priority: "high",
    },
    {
      id: "2",
      title: "Quiz",
      notes: "",
      courseId: "c1",
      status: "done",
      dueDate: "2026-10-13",
      priority: "high",
    },
    {
      id: "3",
      title: "Review",
      notes: "",
      courseId: "c2",
      status: "todo",
      dueDate: "2026-10-15",
      priority: "low",
    },
  ];
  assert.deepEqual(
    selectAssignments(assignments, { status: "overdue" }, "2026-10-15").map(
      (a) => a.id,
    ),
    ["1"],
  );
  assert.deepEqual(
    selectAssignments(assignments, {
      query: "CHAPTER",
      course: "c1",
      priority: "high",
      status: "todo",
    }).map((a) => a.id),
    ["1"],
  );
  assert.equal(
    selectAssignments(assignments, { course: "c2", priority: "high" }).length,
    0,
  );
  assert.deepEqual(
    selectAssignments(assignments, { sort: "title" }).map((a) => a.id),
    ["1", "2", "3"],
  );
  assert.deepEqual(
    selectAssignments(assignments, { sort: "due" }).map((a) => a.id),
    ["2", "1", "3"],
  );
});
test("empty progress is zero and partial completion rounds predictably", () => {
  assert.deepEqual(progress([]), { completed: 0, total: 0, percent: 0 });
  assert.equal(
    progress([{ status: "done" }, { status: "todo" }, { status: "todo" }])
      .percent,
    33,
  );
});
test("storage roundtrip preserves changes and empty planners are not reseeded", () => {
  const data = { version: 1, courses: [], assignments: [] };
  const storage = {
    getItem(key) {
      assert.equal(key, STORAGE_KEY);
      return JSON.stringify(data);
    },
  };
  assert.deepEqual(loadPlanner(storage), { data, error: "" });
  assert.equal(loadPlanner({ getItem: () => null }).data.courses.length, 3);
});
test("unreadable, invalid, or denied storage is not silently treated as fresh demo data", () => {
  for (const storage of [
    { getItem: () => "{broken" },
    { getItem: () => '{"version":2}' },
    {
      getItem() {
        throw new Error("denied");
      },
    },
  ]) {
    const result = loadPlanner(storage);
    assert.ok(result.error);
    assert.deepEqual(result.data.assignments, []);
  }
});
test("validation rejects duplicate ids, bad dates and dangling course references", () => {
  const state = seedData();
  assert.equal(
    isValidData({ ...state, courses: [...state.courses, state.courses[0]] }),
    false,
  );
  assert.equal(
    isValidData({
      ...state,
      assignments: [...state.assignments, state.assignments[0]],
    }),
    false,
  );
  assert.equal(
    isValidData({
      ...state,
      assignments: [{ ...state.assignments[0], dueDate: "2026-02-30" }],
    }),
    false,
  );
  assert.equal(
    isValidData({
      ...state,
      assignments: [{ ...state.assignments[0], courseId: "none" }],
    }),
    false,
  );
});
