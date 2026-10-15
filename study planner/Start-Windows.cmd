@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.12 or newer, then reopen this file.
  pause
  exit /b 1
)
echo Studyspace Blueprint Motion Edition 4.1
echo Checking and installing project dependencies, including lucide-react...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo Installation failed. Check your internet connection and Node version.
  pause
  exit /b 1
)
echo Starting the new workspace. Keep this window open.
call npm run dev -- --open
pause
