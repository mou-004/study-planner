export const PROFILES_KEY = "study-planner:profiles:v1";
export const ACTIVE_PROFILE_KEY = "study-planner:active-profile";
export const DEFAULT_PROFILE = { id: "default", name: "My planner" };
export function profileStorageKey(id) {
  return id === "default"
    ? "study-planner:v1"
    : `study-planner:profile:${id}:v1`;
}
export function readProfiles(storage) {
  const raw = storage.getItem(PROFILES_KEY);
  const profiles = raw === null ? [DEFAULT_PROFILE] : JSON.parse(raw);
  const ids = new Set();
  if (
    !Array.isArray(profiles) ||
    !profiles.length ||
    !profiles.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        /^[a-zA-Z0-9-]+$/.test(p.id) &&
        !ids.has(p.id) &&
        (ids.add(p.id), true) &&
        typeof p.name === "string" &&
        p.name.trim() &&
        p.name.length <= 40,
    )
  )
    throw new Error(
      "Saved profiles could not be read. Their stored data has not been changed.",
    );
  const saved = storage.getItem(ACTIVE_PROFILE_KEY);
  return {
    profiles,
    active: profiles.some((p) => p.id === saved) ? saved : profiles[0].id,
  };
}
export function writeProfiles(storage, profiles) {
  storage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}
