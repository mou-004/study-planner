import { ArrowUpRight, CalendarDays, Check, Clock3 } from "lucide-react";
import { nextSevenDays, selectAssignments } from "../state/model.js";

export function WeekAhead({ assignments, courses, today, onDay, onEdit }) {
  const days = nextSevenDays(today);
  const next = selectAssignments(assignments, {
    status: "open",
    sort: "due",
  }).slice(0, 3);
  const weekTotal = assignments.filter(
    (a) => a.status !== "done" && days.includes(a.dueDate),
  ).length;
  return (
    <section className="planning-grid" aria-label="Study planning">
      <article className="week-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PLAN YOUR TIME</span>
            <h2>The next seven days</h2>
          </div>
          <CalendarDays size={20} />
        </div>
        <p className="panel-caption">
          {weekTotal} open assignment{weekTotal === 1 ? "" : "s"} due this week.
          Select a day to plan your work.
        </p>
        <div className="week-days">
          {days.map((day, i) => {
            const tasks = assignments.filter(
              (a) => a.dueDate === day && a.status !== "done",
            );
            const date = new Date(`${day}T12:00:00`);
            return (
              <button
                key={day}
                className={`week-day ${i === 0 ? "is-today" : ""}`}
                onClick={() => onDay(day)}
                aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}, ${tasks.length} open assignments`}
              >
                <span>
                  {date.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <strong>{date.getDate()}</strong>
                <div className="day-dots">
                  {tasks.slice(0, 3).map((a) => (
                    <i
                      key={a.id}
                      style={{
                        background: courses.find((c) => c.id === a.courseId)
                          ?.color,
                      }}
                    />
                  ))}
                </div>
                <small>{tasks.length || "—"}</small>
              </button>
            );
          })}
        </div>
        <div className="week-legend">
          <span className="course-dot" /> Assignment due{" "}
          <span>Today is highlighted</span>
        </div>
      </article>
      <article className="next-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR NEXT STEP</span>
            <h2>Focus on what’s next</h2>
          </div>
          <Clock3 size={20} />
        </div>
        {next.length ? (
          <div className="next-items">
            {next.map((a) => (
              <button key={a.id} onClick={() => onEdit(a)}>
                <span
                  className="next-course"
                  style={{
                    background: courses.find((c) => c.id === a.courseId)?.color,
                  }}
                />
                <span>
                  <strong>{a.title}</strong>
                  <small>
                    {courses.find((c) => c.id === a.courseId)?.name} ·{" "}
                    <em className={a.dueDate < today ? "late-text" : ""}>
                      {a.dueDate < today
                        ? "Overdue"
                        : a.dueDate === today
                          ? "Due today"
                          : new Date(
                              `${a.dueDate}T12:00:00`,
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                    </em>
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <div className="next-empty">
            <Check size={24} />
            <strong>You’re all caught up</strong>
            <p>Add a new assignment when you’re ready.</p>
          </div>
        )}
      </article>
    </section>
  );
}
