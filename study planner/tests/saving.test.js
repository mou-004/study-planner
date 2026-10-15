import test from "node:test";
import assert from "node:assert/strict";
import {
  nextSevenDays,
  parseBackup,
  plannerReducer,
  seedData,
  selectAssignments,
} from "../src/state/model.js";
import { draftKey, readDraft, writeDraft } from "../src/state/drafts.js";

function memoryStorage() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  };
}
test("backup export and restore preserves all assignments and notes", () => {
  const data = seedData();
  data.assignments[0].notes = "Review lecture notes before Friday";
  const restored = parseBackup(JSON.stringify(data));
  assert.deepEqual(restored, data);
  assert.deepEqual(
    plannerReducer(seedData(), { type: "workspace/restore", data: restored }),
    data,
  );
});
test("invalid backups cannot replace the current workspace", () => {
  const current = seedData();
  assert.throws(() => parseBackup("{invalid"), /valid JSON/);
  assert.throws(
    () => parseBackup(JSON.stringify({ version: 2 })),
    /incompatible/,
  );
  assert.throws(() => parseBackup(" ".repeat(2_000_001)), /too large/);
  assert.equal(
    plannerReducer(current, {
      type: "workspace/restore",
      data: { version: 2 },
    }),
    current,
  );
});
test("seven-day planner handles month and year boundaries", () => {
  assert.deepEqual(nextSevenDays("2026-12-29"), [
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
    "2027-01-04",
  ]);
});
test("date and open filters combine without showing completed assignments", () => {
  const data = seedData().assignments;
  const dueDate = data[0].dueDate;
  const result = selectAssignments(data, { dueDate, status: "open" });
  assert.ok(result.every((a) => a.dueDate === dueDate && a.status !== "done"));
  assert.ok(result.length > 0);
});
test("unfinished forms survive closing and restoring a draft", () => {
  const storage = memoryStorage();
  const key = draftKey("assignment");
  const values = {
    title: "Partial draft",
    notes: "Read chapter 4",
    dueDate: "",
  };
  writeDraft(storage, key, values);
  assert.deepEqual(
    readDraft(storage, key, { title: "", notes: "", dueDate: "" }),
    values,
  );
  assert.notEqual(draftKey("course"), key);
  assert.notEqual(draftKey("assignment", "a1"), key);
});
test("draft restoration ignores unknown or non-string fields and corrupt data", () => {
  const storage = memoryStorage();
  storage.setItem(
    "draft",
    JSON.stringify({
      values: { title: 25, notes: "Keep this", injected: "discard" },
    }),
  );
  assert.deepEqual(
    readDraft(storage, "draft", { title: "Default", notes: "" }),
    { title: "Default", notes: "Keep this" },
  );
  storage.setItem("draft", "broken");
  assert.equal(readDraft(storage, "draft", { title: "" }), null);
});
test("failed draft writes surface to the editor instead of claiming to save", () => {
  const unavailable = {
    setItem() {
      throw new Error("quota exceeded");
    },
  };
  assert.throws(
    () => writeDraft(unavailable, "key", { title: "Work" }),
    /quota/,
  );
});
