# StudySpace — Study Planner

A responsive study planner built with React and Vite.

## Features
- Manage courses, assignments, tasks, notes, and class routines.
- Track deadlines and progress.
- Separate student profiles with local storage.
- Export and restore JSON backups.

## State Management
Uses React Context API for shared state. Tasks, Notes, and Routine access data directly without prop-drilling.

## Loading and Empty States
- Startup skeleton and backup-import spinner.
- Helpful messages and actions when no data exists.

## Run Locally
Requires Node.js 22.12+.

npm ci
npm run dev

## Checks
npm test
npm run build

All 28 existing tests and the production build pass.

## Storage
Data is saved in browser localStorage. No backend API is required.

##live link:: https://study-planner-001.netlify.app/
