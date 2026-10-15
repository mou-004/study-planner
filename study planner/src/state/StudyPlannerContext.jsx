import { createContext, useContext, useEffect, useState } from "react";
import { usePlannerStore } from "./useStudyPlanner.js";

const PlannerContext = createContext(null);

export function PlannerSkeleton() {
  return <main className="planner-loading" role="status" aria-live="polite" aria-busy="true">
    <h1>Opening your study planner</h1>
    <p>Loading your courses, tasks, and notes…</p>
    <div className="loading-bar" />
    <div className="loading-cards">{[0, 1, 2].map(i => <div className="loading-card" key={i} />)}</div>
    <div className="loading-bar" /><div className="loading-bar" />
  </main>;
}

// Remounting this boundary on profile changes prevents data crossing profiles.
export function StudyPlannerProvider({ profileId, children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Yield a frame so the loading shell can paint before reading browser storage.
    let frame2;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => setReady(true));
    });
    return () => { cancelAnimationFrame(frame1); cancelAnimationFrame(frame2); };
  }, []);
  return ready ? <LoadedPlanner profileId={profileId}>{children}</LoadedPlanner> : <PlannerSkeleton />;
}

function LoadedPlanner({ profileId, children }) {
  const planner = usePlannerStore(profileId);
  return <PlannerContext.Provider value={planner}>{children}</PlannerContext.Provider>;
}

export function useStudyPlanner() {
  const planner = useContext(PlannerContext);
  if (!planner) throw new Error("useStudyPlanner must be used inside StudyPlannerProvider");
  return planner;
}
