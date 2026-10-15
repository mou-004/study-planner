import { useEffect, useRef, useState } from "react";
import {
  ArrowDownUp,
  StickyNote,
  UserCheck,
  Download,
  Upload,
  Save,
  ShieldCheck,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Circle,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useStudyPlanner } from "./state/useStudyPlanner.js";
import {
  localDate,
  newId,
  parseBackup,
  progress,
  selectAssignments,
  STATUS_LABELS,
} from "./state/model.js";
import { CourseCard } from "./components/CourseCard.jsx";
import { Editor } from "./components/Editor.jsx";
import { WeekAhead } from "./components/WeekAhead.jsx";

import { useProfiles, ProfileSwitcher } from "./components/Profiles.jsx";
import {
  NextClassCard,
  RoutineView,
  TasksView,
  NotesView,
  StudentEditor,
} from "./components/StudentViews.jsx";

const emptyFilters = {
  dueDate: "",
  query: "",
  course: "",
  status: "",
  priority: "",
  sort: "due",
};
function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
function dueLabel(value, today) {
  return value === today ? "Today" : formatDate(value);
}

export default function App() {
  const manager = useProfiles();
  return <PlannerApp key={manager.active} manager={manager} />;
}
function PlannerApp({ manager }) {
  const profileId = manager.active;
  const profile = manager.profiles.find((p) => p.id === profileId);
  const planner = useStudyPlanner(profileId);
  const { data } = planner;
  const backupInput = useRef(null);
  const [newNoteId, setNewNoteId] = useState(null);
  const [view, setView] = useState("overview");
  const [filters, setFilters] = useState(emptyFilters);
  const [editor, setEditor] = useState(null);
  const [today, setToday] = useState(localDate);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setToday(localDate()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const stats = progress(data.assignments);
  const overdue = data.assignments.filter(
    (a) => a.status !== "done" && a.dueDate < today,
  ).length;
  const dueToday = data.assignments.filter(
    (a) => a.status !== "done" && a.dueDate === today,
  ).length;
  const inProgress = data.assignments.filter(
    (a) => a.status === "in-progress",
  ).length;
  const shown = selectAssignments(data.assignments, filters, today);
  const filtered =
    filters.query ||
    filters.course ||
    filters.status ||
    filters.priority ||
    filters.dueDate;
  const filter = (name, value) =>
    setFilters((current) => ({ ...current, [name]: value }));
  function navigate(next) {
    setView(next);
    setFilters(emptyFilters);
  }
  function newAssignment() {
    if (!data.courses.length) {
      setNotice("Create a course first, then add your assignments.");
      setEditor({ kind: "course" });
    } else setEditor({ kind: "assignment", courseId: filters.course });
  }
  function addClass(day = new Date().getDay()) {
    if (!data.courses.length) {
      setNotice("Add a course first, then create your university routine.");
      setEditor({ kind: "course" });
      return;
    }
    setEditor({ kind: "routine", day });
  }
  function addNote() {
    const note = {
      id: newId(),
      title: "",
      body: "",
      courseId: "",
      pinned: false,
      updatedAt: new Date().toISOString(),
    };
    planner.saveNote(note);
    setNewNoteId(note.id);
    setView("notes");
  }
  function primaryAction() {
    if (view === "courses") setEditor({ kind: "course" });
    else if (view === "routine") addClass();
    else if (view === "tasks") setEditor({ kind: "task" });
    else if (view === "notes") addNote();
    else newAssignment();
  }
  function deleteCourse(course) {
    const count = data.assignments.filter(
      (a) => a.courseId === course.id,
    ).length;
    if (
      window.confirm(
        `Delete “${course.name}” and its ${count} assignment${count === 1 ? "" : "s"}, plus its routine entries? Linked notes will become personal notes. This cannot be undone.`,
      )
    ) {
      planner.deleteCourse(course.id);
      if (filters.course === course.id) filter("course", "");
      setNotice("Course deleted.");
    }
  }
  function deleteAssignment(assignment) {
    if (
      window.confirm(`Delete “${assignment.title}”? This cannot be undone.`)
    ) {
      planner.deleteAssignment(assignment.id);
      setNotice("Assignment deleted.");
    }
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `studyspace-${profileId}-backup-${today}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Backup downloaded. Keep it somewhere safe.");
  }
  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 2_000_000)
        throw new Error("Choose a planner backup smaller than 2 MB.");
      const restored = parseBackup(await file.text());
      if (
        !window.confirm(
          `Restore ${restored.courses.length} courses and ${restored.assignments.length} assignments? This replaces only the current student’s planner. Export a backup first if you want to keep it.`,
        )
      )
        return;
      planner.restoreData(restored);
      setFilters(emptyFilters);
      setEditor(null);
      setNotice("Backup restored. Your planner is ready.");
    } catch (error) {
      setNotice(error.message || "The backup could not be opened.");
    }
  }
  const courseCards = (
    <div className="course-grid">
      {data.courses.map((c) => (
        <CourseCard
          key={c.id}
          course={c}
          assignments={data.assignments.filter((a) => a.courseId === c.id)}
          onSelect={() => {
            setView("assignments");
            setFilters({ ...emptyFilters, course: c.id });
          }}
          onEdit={() => setEditor({ kind: "course", item: c })}
          onDelete={() => deleteCourse(c)}
        />
      ))}
      <button
        className="add-course-card"
        onClick={() => setEditor({ kind: "course" })}
      >
        <span>
          <Plus size={22} />
        </span>
        <strong>Add a course</strong>
        <small>A new space to grow</small>
      </button>
    </div>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
        >
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          <span>
            study<span className="brand-light">space</span>
            <small>STUDENT WORKSPACE · V4.1</small>
          </span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {[
            ["overview", LayoutDashboard, "Overview"],
            ["assignments", ListTodo, "Assignments"],
            ["courses", BookOpen, "My courses"],
            ["progress", Target, "My progress"],
            ["routine", CalendarDays, "Routine"],
            ["tasks", UserCheck, "Personal tasks"],
            ["notes", StickyNote, "Notes"],
          ].map(([key, Icon, label]) => (
            <button
              key={key}
              aria-label={label}
              className={`nav-link ${view === key ? "active" : ""}`}
              aria-current={view === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {key === "assignments" && (
                <span className="nav-count">
                  {data.assignments.filter((a) => a.status !== "done").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-course-heading">
          <span className="sidebar-label">YOUR COURSES</span>
          <button
            className="icon-button"
            onClick={() => setEditor({ kind: "course" })}
            aria-label="Add course"
          >
            <Plus size={17} />
          </button>
        </div>
        <div className="sidebar-courses">
          {data.courses.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setView("assignments");
                setFilters({ ...emptyFilters, course: c.id });
              }}
            >
              <span className="course-dot" style={{ background: c.color }} />
              <span>{c.name}</span>
            </button>
          ))}
          {!data.courses.length && (
            <small>Your next chapter starts here.</small>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="small-note">
            <Sparkles size={19} />
            <strong>Small steps. Big things.</strong>
            <p>
              A little progress every day
              <br />
              adds up to a lot.
            </p>
          </div>
          <div className="profile">
            <span>{profile.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{profile.name}</strong>
              <small>Local student profile</small>
            </div>
            <GraduationCap size={20} />
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {
                {
                  overview: "Overview",
                  assignments: "Assignments",
                  courses: "My courses",
                  progress: "My progress",
                  routine: "University routine",
                  tasks: "Personal tasks",
                  notes: "Notebook",
                }[view]
              }
            </strong>
          </div>
          <ProfileSwitcher manager={manager} />
          <div className="topbar-date">
            <CalendarDays size={16} />
            {new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </header>
        <div className="page-content" key={view}>
          {manager.error && (
            <div className="storage-warning" role="alert">
              {manager.error}
            </div>
          )}
          {planner.storageError && (
            <div className="storage-warning" role="alert">
              <span>{planner.storageError}</span>
              <button
                className="button secondary"
                onClick={() => {
                  if (
                    planner.savingEnabled ||
                    window.confirm(
                      "Enable saving and replace the previous saved planner with the data currently shown?",
                    )
                  )
                    planner.retrySaving();
                }}
              >
                {planner.savingEnabled ? "Retry saving" : "Enable saving"}
              </button>
            </div>
          )}
          {view === "overview" && (
            <section className="dashboard-welcome">
              <div className="welcome-copy">
                <span className="release-pill">
                  <span />
                  STUDYSPACE · WORKSPACE 4.1 · MOTION
                </span>
                <h2>
                  {profile.name === "My planner"
                    ? "Welcome back."
                    : `Welcome back, ${profile.name}.`}
                  <br />
                  <span>Let’s make space for learning.</span>
                </h2>
                <p>
                  Your classes, deadlines, and ideas — organized around you.
                </p>
                <div className="welcome-actions">
                  <button className="button primary" onClick={newAssignment}>
                    <Plus size={17} />
                    Plan an assignment
                  </button>
                  <button
                    className="button welcome-secondary"
                    onClick={() => navigate("routine")}
                  >
                    Open class routine
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
              <div className="today-snapshot">
                <div className="snapshot-label">
                  <CalendarDays size={17} />
                  <span>
                    {new Date(`${today}T12:00:00`).toLocaleDateString(
                      undefined,
                      { weekday: "long", month: "short", day: "numeric" },
                    )}
                  </span>
                </div>
                <strong>
                  {dueToday}
                  <span>assignments due today</span>
                </strong>
                <div className="snapshot-divider" />
                <p>
                  <span
                    className={overdue ? "snapshot-alert" : "snapshot-check"}
                  >
                    {overdue ? `${overdue} overdue` : "No overdue assignments"}
                  </span>
                  <span>
                    {data.tasks.filter((t) => !t.done).length} personal tasks
                    open
                  </span>
                </p>
                <button
                  onClick={() => {
                    setView("assignments");
                    setFilters({
                      ...emptyFilters,
                      dueDate: today,
                      status: "open",
                    });
                  }}
                >
                  See today’s assignments
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </section>
          )}
          {view !== "overview" && (
            <div className="section-kicker">
              YOUR STUDENT WORKSPACE <span>BLUEPRINT EDITION · 4.1</span>
            </div>
          )}
          <section className="page-heading">
            <div>
              <div className="eyebrow">A CLEAR PLAN FOR WHAT’S NEXT</div>
              <h1>
                {
                  {
                    overview: "Your workspace at a glance",
                    assignments: "Assignments & deadlines",
                    courses: "Your courses",
                    progress: "Your learning progress",
                    routine: "Your university routine",
                    tasks: "Your personal to-do list",
                    notes: "Your student notebook",
                  }[view]
                }
              </h1>
              <p>
                {
                  {
                    overview:
                      "Plan your week, meet your deadlines, and keep every course on track.",
                    assignments:
                      "Find your work, update its status, and pick up where you left off.",
                    courses:
                      "Keep your learning organized, one course at a time.",
                    progress: "Every completed assignment is a step forward.",
                    routine:
                      "Know your class, room, and teacher before you leave.",
                    tasks:
                      "Make room for revision, projects, and goals beyond your courses.",
                    notes:
                      "Capture ideas, connect them to a course, and revisit them anytime.",
                  }[view]
                }
              </p>
            </div>
            <button className="button primary" onClick={primaryAction}>
              <Plus size={18} />
              {{
                courses: "Add course",
                routine: "Add class",
                tasks: "New task",
                notes: "New note",
              }[view] || "New assignment"}
            </button>
          </section>
          <div className="workspace-tools">
            <div
              className={`save-indicator ${planner.storageError ? "save-error" : ""}`}
              role="status"
            >
              <ShieldCheck size={17} />
              <div>
                <strong>
                  {planner.storageError
                    ? "Saving needs attention"
                    : "All changes saved"}
                </strong>
                <small>
                  {planner.lastSavedAt && !planner.storageError
                    ? `On this device · ${planner.lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Your work stays available in this browser"}
                </small>
              </div>
            </div>
            <div className="backup-actions">
              <button
                className="button secondary"
                onClick={() => {
                  if (
                    planner.savingEnabled ||
                    window.confirm(
                      "Replace the unreadable saved planner with the workspace shown now?",
                    )
                  ) {
                    planner.retrySaving();
                  }
                }}
              >
                <Save size={15} />
                Save now
              </button>
              <button className="button secondary" onClick={exportBackup}>
                <Download size={15} />
                Export backup
              </button>
              <button
                className="button secondary"
                onClick={() => backupInput.current.click()}
              >
                <Upload size={15} />
                Restore
              </button>
              <input
                ref={backupInput}
                type="file"
                accept=".json,application/json"
                aria-label="Restore planner backup"
                onChange={importBackup}
                hidden
              />
            </div>
          </div>
          {view === "overview" && (
            <div className="quick-actions" aria-label="Quick actions">
              <button onClick={newAssignment}>
                <span className="quick-icon">
                  <ListTodo size={20} />
                </span>
                <span>
                  <strong>Assignment</strong>
                  <small>Plan your coursework</small>
                </span>
                <Plus size={16} />
              </button>
              <button onClick={() => addClass()}>
                <span className="quick-icon">
                  <CalendarDays size={20} />
                </span>
                <span>
                  <strong>Class routine</strong>
                  <small>Organize your week</small>
                </span>
                <Plus size={16} />
              </button>
              <button
                onClick={() => {
                  setView("tasks");
                  setEditor({ kind: "task" });
                }}
              >
                <span className="quick-icon">
                  <UserCheck size={20} />
                </span>
                <span>
                  <strong>Personal task</strong>
                  <small>Make a little progress</small>
                </span>
                <Plus size={16} />
              </button>
              <button onClick={addNote}>
                <span className="quick-icon">
                  <StickyNote size={20} />
                </span>
                <span>
                  <strong>Quick note</strong>
                  <small>Capture an idea</small>
                </span>
                <Plus size={16} />
              </button>
            </div>
          )}
          {view === "overview" && (
            <NextClassCard data={data} onRoutine={() => navigate("routine")} />
          )}
          {view === "routine" && (
            <RoutineView
              data={data}
              onEdit={(item) => setEditor({ kind: "routine", item })}
              onAdd={addClass}
              onDelete={(item) => {
                if (window.confirm("Delete this weekly class?"))
                  planner.deleteRoutine(item.id);
              }}
            />
          )}
          {view === "tasks" && (
            <TasksView
              data={data}
              planner={planner}
              onEdit={(item) => setEditor({ kind: "task", item })}
              onAdd={() => setEditor({ kind: "task" })}
            />
          )}
          {view === "notes" && (
            <NotesView
              data={data}
              planner={planner}
              newNoteId={newNoteId}
              onTaskCreated={() =>
                setNotice("Review task added to Personal tasks for today.")
              }
            />
          )}
          {(view === "overview" || view === "progress") && (
            <>
              <div className="stats-grid">
                <Stat
                  label="Active courses"
                  value={data.courses.length}
                  detail="Organized in one workspace"
                  icon={BookOpen}
                />
                <Stat
                  label="In progress"
                  value={inProgress}
                  detail="Assignments you have started"
                  icon={Clock3}
                />
                <Stat
                  label="Due today"
                  value={dueToday}
                  detail={
                    overdue
                      ? `${overdue} overdue · you can catch up`
                      : "Your focus for today"
                  }
                  icon={CalendarDays}
                />
                <Stat
                  label="Completed"
                  value={stats.completed}
                  detail={`${stats.percent}% of all assignments`}
                  icon={CheckCheck}
                />
              </div>
              <div className="momentum">
                <div className="momentum-icon">
                  <Target size={26} />
                </div>
                <div className="momentum-copy">
                  <h3>
                    {stats.percent === 100 && stats.total
                      ? "All caught up. Beautiful work."
                      : "Good things take a little consistency."}
                  </h3>
                  <p>
                    {stats.total
                      ? `You’ve completed ${stats.completed} of ${stats.total} assignments. Keep showing up for yourself.`
                      : "Add your first assignment and start building your momentum."}
                  </p>
                </div>
                <div className="momentum-progress">
                  <strong>
                    {stats.percent}
                    <span>% complete</span>
                  </strong>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label="Overall completion"
                    aria-valuenow={stats.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${stats.percent}%` }} />
                  </div>
                </div>
              </div>
            </>
          )}
          {view === "overview" && (
            <WeekAhead
              assignments={data.assignments}
              courses={data.courses}
              today={today}
              onDay={(day) => {
                setView("assignments");
                setFilters({ ...emptyFilters, dueDate: day });
              }}
              onEdit={(item) => setEditor({ kind: "assignment", item })}
            />
          )}
          {(view === "overview" ||
            view === "courses" ||
            view === "progress") && (
            <section className="courses-section">
              <div className="section-title">
                <h2>
                  {view === "progress" ? "Progress by course" : "Your courses"}
                  <span>{data.courses.length}</span>
                </h2>
                {view === "overview" && (
                  <button
                    className="text-button"
                    onClick={() => navigate("courses")}
                  >
                    View all courses <ArrowUpRight size={16} />
                  </button>
                )}
              </div>
              {courseCards}
            </section>
          )}
          {(view === "overview" || view === "assignments") && (
            <section className="assignments-section">
              <div className="section-title">
                <div>
                  <h2>
                    {view === "overview"
                      ? "Your assignments"
                      : "All assignments"}
                    <span>{data.assignments.length}</span>
                  </h2>
                  <p>A small plan for everything that’s next.</p>
                </div>
                {overdue > 0 && (
                  <button
                    className="overdue-summary"
                    onClick={() =>
                      filter(
                        "status",
                        filters.status === "overdue" ? "" : "overdue",
                      )
                    }
                  >
                    <span />
                    {overdue} overdue
                  </button>
                )}
              </div>
              <div
                className="assignment-tabs"
                aria-label="Assignment shortcuts"
              >
                {[
                  ["", "All assignments"],
                  ["open", "Open"],
                  ["in-progress", "In progress"],
                  ["done", "Completed"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={filters.status === value ? "selected" : ""}
                    aria-pressed={filters.status === value}
                    onClick={() => filter("status", value)}
                  >
                    {label}
                    <span>
                      {
                        data.assignments.filter(
                          (a) =>
                            !value ||
                            (value === "open"
                              ? a.status !== "done"
                              : a.status === value),
                        ).length
                      }
                    </span>
                  </button>
                ))}
              </div>
              <div className="filters">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    aria-label="Search assignments"
                    placeholder="Search assignments…"
                    value={filters.query}
                    onChange={(e) => filter("query", e.target.value)}
                  />
                </label>
                <div className="filter-selects">
                  <SlidersHorizontal size={16} className="filter-icon" />
                  <select
                    aria-label="Filter by course"
                    value={filters.course}
                    onChange={(e) => filter("course", e.target.value)}
                  >
                    <option value="">All courses</option>
                    {data.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by status"
                    value={filters.status}
                    onChange={(e) => filter("status", e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="open">Open assignments</option>
                    {Object.entries(STATUS_LABELS).map(([s, label]) => (
                      <option key={s} value={s}>
                        {label}
                      </option>
                    ))}
                    <option value="overdue">Overdue</option>
                  </select>
                  <select
                    aria-label="Filter by priority"
                    value={filters.priority}
                    onChange={(e) => filter("priority", e.target.value)}
                  >
                    <option value="">All priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <label className="sort-select">
                    <ArrowDownUp size={15} />
                    <select
                      aria-label="Sort assignments"
                      value={filters.sort}
                      onChange={(e) => filter("sort", e.target.value)}
                    >
                      <option value="due">Due date</option>
                      <option value="priority">Priority</option>
                      <option value="title">Title</option>
                    </select>
                  </label>
                </div>
              </div>
              {filtered && (
                <div className="filter-summary">
                  <span>
                    {filters.dueDate && `Due ${formatDate(filters.dueDate)} · `}
                    {shown.length} matching assignment
                    {shown.length === 1 ? "" : "s"}
                  </span>
                  <button onClick={() => setFilters(emptyFilters)}>
                    Clear filters
                    <X size={13} />
                  </button>
                </div>
              )}
              <div className="assignment-table">
                <div className="table-header">
                  <span>ASSIGNMENT</span>
                  <span>DUE DATE</span>
                  <span>PRIORITY</span>
                  <span>STATUS</span>
                  <span className="sr-only">Actions</span>
                </div>
                {shown.map((a) => {
                  const course = data.courses.find((c) => c.id === a.courseId);
                  const late = a.status !== "done" && a.dueDate < today;
                  return (
                    <article
                      key={a.id}
                      className={`assignment-row ${a.status === "done" ? "completed-row" : ""}`}
                    >
                      <div className="assignment-info">
                        <button
                          className={`check-button ${a.status === "done" ? "checked" : ""}`}
                          aria-label={`${a.status === "done" ? "Reopen" : "Complete"} ${a.title}`}
                          onClick={() =>
                            planner.setStatus(
                              a.id,
                              a.status === "done" ? "todo" : "done",
                            )
                          }
                        >
                          {a.status === "done" ? (
                            <Check size={14} />
                          ) : a.status === "in-progress" ? (
                            <span className="half-dot" />
                          ) : null}
                        </button>
                        <div>
                          <button
                            className="assignment-title"
                            onClick={() =>
                              setEditor({ kind: "assignment", item: a })
                            }
                          >
                            {a.title}
                          </button>
                          <div className="assignment-subtitle">
                            <span
                              className="course-dot"
                              style={{ background: course.color }}
                            />
                            {course.name}
                            {a.notes && (
                              <span className="has-notes"> · Notes</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`due-date ${late ? "late" : ""}`}>
                        <CalendarDays size={14} />
                        <span>
                          {dueLabel(a.dueDate, today)}
                          {late && <small>Overdue</small>}
                        </span>
                      </div>
                      <div>
                        <span className={`priority priority-${a.priority}`}>
                          <span />
                          {a.priority}
                        </span>
                      </div>
                      <select
                        className={`status-select status-${a.status}`}
                        aria-label={`Status for ${a.title}`}
                        value={a.status}
                        onChange={(e) =>
                          planner.setStatus(a.id, e.target.value)
                        }
                      >
                        {Object.entries(STATUS_LABELS).map(([s, label]) => (
                          <option key={s} value={s}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${a.title}`}
                          onClick={() =>
                            setEditor({ kind: "assignment", item: a })
                          }
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Delete ${a.title}`}
                          onClick={() => deleteAssignment(a)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
                {!shown.length && (
                  <div className="empty-state">
                    <ListTodo size={32} />
                    <h3>
                      {filtered
                        ? "A little too quiet here."
                        : "A fresh page for your plans."}
                    </h3>
                    <p>
                      {filtered
                        ? "Try another search or clear your filters."
                        : "Add an assignment to take your first step."}
                    </p>
                    <button
                      className="button secondary"
                      onClick={
                        filtered
                          ? () => setFilters(emptyFilters)
                          : newAssignment
                      }
                    >
                      {filtered ? "Clear filters" : "Add assignment"}
                    </button>
                  </div>
                )}
              </div>
              <div className="table-footer">
                <span>
                  Showing {shown.length} of {data.assignments.length}{" "}
                  assignments
                </span>
                <span>
                  <Circle size={7} fill="currentColor" />{" "}
                  {planner.storageError
                    ? "Changes in this tab only"
                    : "Saved on this device"}
                </span>
              </div>
            </section>
          )}
          <footer className="page-footer">
            <span>Studyspace · Blueprint Motion Edition 4.1</span>
            <span>
              Saved locally. Back up anytime. <Sparkles size={13} />
            </span>
          </footer>
        </div>
      </main>
      {editor && ["routine", "task"].includes(editor.kind) && (
        <StudentEditor
          key={`${editor.kind}-${editor.item?.id || "new"}`}
          editor={editor}
          data={data}
          profileId={profileId}
          onClose={() => setEditor(null)}
          onSave={(item) => {
            editor.kind === "routine"
              ? planner.saveRoutine(item)
              : planner.saveTask(item);
            setNotice("Your plan has been updated.");
          }}
        />
      )}
      {editor && !["routine", "task"].includes(editor.kind) && (
        <Editor
          key={`${editor.kind}-${editor.item?.id || "new"}`}
          editor={editor}
          profileId={profileId}
          courses={data.courses}
          onClose={() => setEditor(null)}
          onSave={(item) => {
            editor.kind === "course"
              ? planner.saveCourse(item)
              : planner.saveAssignment(item);
            setNotice("Your plan has been updated.");
          }}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function Stat({ label, value, detail, icon: Icon }) {
  return (
    <article className="stat-card">
      <div>
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <strong>{value.toString().padStart(2, "0")}</strong>
      <small>{detail}</small>
    </article>
  );
}
