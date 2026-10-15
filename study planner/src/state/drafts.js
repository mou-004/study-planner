export function draftKey(kind, id, profileId = "default") {
  if (profileId !== "default")
    return `study-planner:profile:${profileId}:draft:${kind}:${id || "new"}`;
  return `study-planner:draft:${kind}:${id || "new"}`;
}
export function readDraft(storage, key, defaults) {
  try {
    const saved = JSON.parse(storage.getItem(key));
    if (!saved || typeof saved !== "object" || !saved.values) return null;
    const values = { ...defaults };
    for (const name of Object.keys(defaults)) {
      if (typeof saved.values[name] === "string")
        values[name] = saved.values[name];
    }
    return values;
  } catch {
    return null;
  }
}
export function writeDraft(storage, key, values) {
  storage.setItem(
    key,
    JSON.stringify({ values, updatedAt: new Date().toISOString() }),
  );
}
