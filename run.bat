@echo off
setlocal enableextensions

cd /d "%~dp0"

echo ==========================================
echo   SankatSahay Windows Launcher
echo ==========================================

if not exist "server\.env" (
  echo [WARN] server\.env is missing.
  echo        Copy server\.env.example to server\.env and fill in your values.
)

if not exist "client\node_modules" (
  echo [INFO] client\node_modules is missing. Installing client dependencies...
  pushd client
  call npm install -D vite @vitejs/plugin-react --workspaces=false
  if errorlevel 1 (
    popd
    echo [ERROR] Failed to install Vite core dependencies for client.
    goto :fail
  )
  call npm install --workspaces=false
  if errorlevel 1 (
    popd
    echo [ERROR] Full client install failed. Trying minimum runtime dependencies...
    call npm install react react-dom --workspaces=false
    if errorlevel 1 goto :fail
  )
  popd
)

if not exist "server\node_modules" (
  echo [INFO] server\node_modules is missing. Installing server dependencies...
  pushd server
  call npm install --workspaces=false
  if errorlevel 1 (
    popd
    echo [ERROR] Failed to install server dependencies.
    goto :fail
  )
  popd
)

echo [INFO] Starting app...
start "SankatSahay Server" cmd /k "cd /d ""%~dp0server"" && npm run dev"
start "SankatSahay Client" cmd /k "cd /d ""%~dp0client"" && npm run dev"
goto :eof

:fail
echo.
echo [ERROR] Startup failed. Fix the dependency issue above and rerun run.bat.
exit /b 1