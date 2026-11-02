@echo off
setlocal DisableDelayedExpansion
set "PROJECT_ROOT=%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is missing. Install Node.js, then run this file again.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo npm is missing. Install Node.js, then run this file again.
  pause
  exit /b 1
)

if not exist "%PROJECT_ROOT%backend\package.json" (
  echo Backend folder not found beside start.bat.
  pause
  exit /b 1
)
if not exist "%PROJECT_ROOT%frontend\package.json" (
  echo Frontend folder not found beside start.bat.
  pause
  exit /b 1
)

rem The backend has no .env in this clone. Reuse the same Supabase project
rem already configured for the frontend, without writing credentials to disk.
if not exist "%PROJECT_ROOT%backend\.env" (
  if not exist "%PROJECT_ROOT%frontend\.env" (
    echo Missing frontend\.env. Add your Supabase settings before starting.
    pause
    exit /b 1
  )
  for /f "usebackq tokens=1,* delims==" %%A in ("%PROJECT_ROOT%frontend\.env") do (
    if /I "%%A"=="VITE_SUPABASE_URL" set "SUPABASE_URL=%%~B"
    if /I "%%A"=="VITE_SUPABASE_ANON_KEY" set "SUPABASE_ANON_KEY=%%~B"
  )
  if not defined SUPABASE_URL (
    echo VITE_SUPABASE_URL is missing from frontend\.env.
    pause
    exit /b 1
  )
  if not defined SUPABASE_ANON_KEY (
    echo VITE_SUPABASE_ANON_KEY is missing from frontend\.env.
    pause
    exit /b 1
  )
)

if not exist "%PROJECT_ROOT%backend\node_modules" (
  echo Installing backend dependencies...
  pushd "%PROJECT_ROOT%backend"
  call npm ci
  if errorlevel 1 (popd & pause & exit /b 1)
  popd
)
if not exist "%PROJECT_ROOT%frontend\node_modules" (
  echo Installing frontend dependencies...
  pushd "%PROJECT_ROOT%frontend"
  call npm ci
  if errorlevel 1 (popd & pause & exit /b 1)
  popd
)

if /I "%~1"=="--check" (
  echo Ready: dependencies and Supabase configuration found.
  exit /b 0
)

echo Starting Smart Leetcode backend and frontend...
start "Smart Leetcode Backend" /D "%PROJECT_ROOT%backend" cmd /k "npm run dev"
start "Smart Leetcode Frontend" /D "%PROJECT_ROOT%frontend" cmd /k "npm run dev -- --host 127.0.0.1"

powershell -NoProfile -Command "Start-Sleep -Seconds 3"
start "" "http://127.0.0.1:5173/"
echo Smart Leetcode is opening at http://127.0.0.1:5173/
echo Close the two server windows to stop the project.
exit /b 0
