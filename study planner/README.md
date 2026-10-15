# Studyspace — Blueprint Motion Edition 4.1

A professional React workspace for any student: separate local profiles, university routines, personal tasks, searchable notes, courses, assignments, and progress. Local state comes first: React `useReducer` owns the data behind a single `useStudyPlanner` hook, ready for a future Zustand refactor.

## Identify this release

Blueprint Motion Edition 4.1 is a complete layout refresh: white horizontal navigation, a blue/cyan welcome dashboard, a today snapshot, and four quick-action cards. It has no left sidebar or bottom menu. The welcome panel shows **STUDYSPACE · WORKSPACE 4.1 · MOTION**. Routine, tasks, notes, profiles, and backup tools remain available.

Extract the new **studyspace-motion-4.1** folder and launch its Start-Windows.cmd. Stop any older running server with Ctrl+C first. If you still see the green or indigo sidebar, an older project is running. Use localhost:5173 in the same browser to retain saved data and refresh with Ctrl+F5 if necessary.

## Windows: easiest way to start

1. Extract the complete ZIP.
2. Open the extracted **studyspace-motion-4.1** folder.
3. Double-click **Start-Windows.cmd**. It checks/installs the project dependencies on each launch, including lucide-react, and opens the app. Keep its terminal open while studying.

Install Node.js **22.12 or newer** first. Internet is required for the initial dependency installation; later launches may also need access if packages are missing. The launcher has not been executed on Windows in the build environment.

Or open PowerShell **inside the extracted studyspace-motion-4.1 folder** and run:

```powershell
npm ci
npm run dev
```

Open **http://localhost:5173**. These commands must run in the folder containing this project's `package.json`. All required dependencies, including `lucide-react`, are declared there; do not copy only `src` into another project.

## UI animation

Page changes fade in, dashboard cards appear in a short sequence, and cards and buttons respond to hovering and pressing. Dialogs and notifications animate in, completion checkmarks pop into place, and progress bars transition smoothly as their values change. There are no continuous decorative animations and no added animation dependencies.

Animations respect the operating system/browser **Reduce motion** setting. When enabled, animations and transitions are removed and all content remains visible. Touch devices do not get hover lift effects. The first page and navigation changes replay entry motion; typing into notes does not restart the page animation.

## Student profiles — for anyone

Use **+** beside the profile selector at the top to add any student's name. Each profile starts with an empty planner and gets its own courses, assignments, routine, personal tasks, notes, and form drafts. Select a name to switch; Rename changes the displayed name. Your selected profile is remembered. The original planner remains under **My planner** and can be renamed.

These are **local profiles, not login accounts**. Anyone using this browser profile can switch to another student's workspace. There are no passwords, private accounts, server database, or cloud synchronization. On another computer or browser, create a local profile and restore that student's backup. Deploying the static app lets visitors use their own browser storage; it does not create a shared server database.

## New student features

- **University routine:** weekly classes with course name, teacher, room, day, and start/end time. Add a course first, then open Routine to create a class.
- **Clash detection:** overlapping classes on the same day show warnings. Back-to-back classes do not count as a clash. Overnight classes must be split into two entries.
- **Next-class companion:** the overview displays the next class, room, teacher, and date. During class it shows Happening now. The card updates every 30 seconds.
- **Personal tasks:** independent to-do items with optional due dates, priorities, completion, editing, and Today/Open/Completed filters.
- **Notebook:** create notes, write freely, search titles and content, link notes to courses, pin important notes, and see word counts. Note edits save automatically while typing.
- **Note-to-review:** turn any note into a personal review task due today. The task appears under Personal tasks; this intentionally creates a new task each time you press the button.
- **Profile backups:** Export backup includes the current student's courses, assignments, routine, tasks, and notes. Restore affects only the current profile. Profile names and unfinished drafts are not part of a planner backup; export each student's planner separately.

## What is included

- A responsive dashboard with a seven-day deadline calendar and an actionable next-up list.
- Course management, color coding, and per-course completion progress.
- Assignments with due dates, priority, status, and study notes.
- Combined search, course, priority, status, overdue, and exact-date filters.
- Quick tabs for open, in-progress, and completed work; sorting by due date, priority, or title.
- Automatic planner saving, visible saved status and time, and an explicit **Save now** button.
- Form drafts saved as you type and restored when you reopen the same editor.
- JSON backup export and validated restore, with confirmation before replacing the workspace.
- Keyboard accessible native modal editors, focus outlines, mobile layouts, and reduced-motion support.
- No backend, account, paid service, API key, or remote font dependency.

## How saving works

**Planner items:** Click Create or Save changes in an editor; routine and task editors use Save class or Save task. Notes save directly as you type. Course changes, assignment changes, and status updates then save automatically to localStorage. Save now writes the current planner again. The saved indicator reports successful writes; storage errors show a warning and retry action.

**Unfinished drafts:** Typing in a form immediately stores that form as a separate draft. Closing the editor or reloading does not discard it. Reopen New assignment, New course, New class, New task, or the same existing item's editor to restore its draft. A draft becomes a planner item only when you click Create or Save changes. Discard draft removes the unfinished form without changing an existing saved item. Drafts are separate from backup exports.

**Return later:** Start the app again and use the same browser, profile, and **http://localhost:5173** address. Your saved planner loads automatically, including completed items. The port is fixed to prevent accidentally opening an empty workspace on another port. If port 5173 is busy, stop the other development server first.

**Back up your work:** Export backup downloads your saved workspace as a JSON file. Keep it in a safe folder. Restore lets you select that file later, including on another device; it validates the contents before asking to replace your current workspace.

Storage is on this device and browser origin. Clearing browser data or using a private session can remove it. There is no cloud account or automatic cross-device sync. Multiple simultaneous editing tabs are not synchronized; the last write wins. Use one editing tab. Export a backup before changing browser, computer, or project address.

Malformed or unsupported saved data is not overwritten automatically. The planner opens an in-memory empty workspace and asks you to enable saving explicitly or restore a backup. A write failure keeps current items in the tab and reports that they are not saved.

## Development

```sh
npm test
npm run build
npm run preview
```

The ZIP includes source, dependency lockfile, automated tests, and the production `dist/` folder. It excludes `node_modules`; `npm ci` recreates it. Serve `dist/` over HTTP rather than opening its HTML directly from disk.

```text
src/
  App.jsx                      Views, filters, and backup actions
  components/
    CourseCard.jsx             Course progress summary
    Editor.jsx                 Forms, automatic drafts, and restoration
    WeekAhead.jsx              Seven-day deadline planner and next-up list
    Profiles.jsx               Student profile creation, rename, and switch
    StudentViews.jsx           Routine, tasks, notes, and next-class card
  state/
    model.js                   Pure transitions, selectors, and validation
    drafts.js                  Profile-scoped draft persistence
    profiles.js                Profile registry and storage key helpers
    studentModel.js            Student data validation and class selectors
    useStudyPlanner.js         Single owner of data and planner persistence
  styles.css                   Base component styling
  theme.css                    Blueprint top navigation and dashboard design
  motion.css                   Optional motion and reduced-motion behavior
tests/
  model.test.js                CRUD, filters, progress, and storage validation
  saving.test.js               Backup, restore, draft, and calendar behavior
  student.test.js              Profiles, routines, tasks, and notes
```

## Future Zustand migration

Keep the `useStudyPlanner` public API while replacing its internals with a Zustand store. Reuse the pure reducer and selectors from `model.js`. Move persistence to Zustand's persist middleware while keeping schema validation and explicit migrations. Filters and open editor state can stay local. Zustand is intentionally not installed.

The default profile retains the planner key `study-planner:v1`, so this update can read the earlier version's saved planner on the same browser origin. Additional profiles use `study-planner:profile:<id>:v1`. The profile registry and selected profile use separate keys. Optional routine/tasks/notes collections extend the validated version-1 format; old backups remain compatible. Default-profile draft keys start with `study-planner:draft:`; other students use profile-scoped draft keys. Backup files use the validated version-1 planner JSON format. Demo data appears only on the first launch; an intentionally empty saved workspace is not reseeded. Deleting a course also deletes its assignments and routine entries after confirmation. Notes linked to that course are kept as personal notes. Personal tasks are independent of courses.

## Verification

The Node tests cover CRUD, cascading course deletion, status integrity, combined filters, overdue boundaries, progress, invalid storage, backup validation, restoration, date boundaries, draft recovery, write failures, profile isolation, routine conflicts, next-class timing, personal tasks, notes, and legacy migration. The production build validates the React bundle and CSS. Browser visual checks are unavailable because Chromium cannot launch in this environment; check the desktop and mobile layouts in your browser after starting the app.
