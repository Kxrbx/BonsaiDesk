@echo off
setlocal

set "ROOT=%~dp0"
set "PS=C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe"

echo [Bonsai Desk] Checking required tools...

python --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python was not found. Install Python from https://www.python.org/downloads/ and enable "Add Python to PATH".
  pause
  exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install the LTS version from https://nodejs.org/ and restart this terminal.
  pause
  exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Reinstall Node.js LTS from https://nodejs.org/.
  pause
  exit /b 1
)

echo [Bonsai Desk] Installing dependencies...
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\bootstrap.ps1"
if errorlevel 1 (
  echo [ERROR] Installation failed. Please check the error output above.
  pause
  exit /b 1
)

echo.
echo [Bonsai Desk] Installation complete!
echo To start the app, double-click launch-app.bat or run:
echo   .\launch-app.bat
echo.

pause
endlocal
