import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { progress } from "../state/model.js";
export function CourseCard({
  course,
  assignments,
  onSelect,
  onEdit,
  onDelete,
}) {
  const stats = progress(assignments);
  return (
    <article className="course-card" style={{ "--course-color": course.color }}>
      <div className="course-card-top">
        <span className="course-code">{course.code || "COURSE"}</span>
        <div className="course-actions">
          <button
            className="icon-button"
            aria-label={`Edit ${course.name}`}
            onClick={onEdit}
          >
            <Pencil size={14} />
          </button>
          <button
            className="icon-button danger"
            aria-label={`Delete ${course.name}`}
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <button className="course-title" onClick={onSelect}>
        {course.name}
        <ArrowUpRight size={19} />
      </button>
      <p>{assignments.length - stats.completed} assignments remaining</p>
      <div className="course-progress">
        <span>
          {stats.completed} of {stats.total} completed
        </span>
        <strong>{stats.percent}%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={`${course.name} completion`}
        aria-valuenow={stats.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${stats.percent}%` }} />
      </div>
    </article>
  );
}
