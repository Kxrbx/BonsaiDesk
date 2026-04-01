@echo off
setlocal

set "ROOT=%~dp0"
set "PS=C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe"

start "Bonsai Desk Backend" "%PS%" -NoExit -ExecutionPolicy Bypass -File "%ROOT%scripts\run-backend.ps1"
start "Bonsai Desk Frontend" "%PS%" -NoExit -ExecutionPolicy Bypass -File "%ROOT%scripts\run-frontend.ps1"

%PS% -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline=(Get-Date).AddSeconds(30);" ^
  "while((Get-Date) -lt $deadline){" ^
  "  try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5173/ | Out-Null; exit 0 } catch { Start-Sleep -Milliseconds 800 }" ^
  "}" ^
  "exit 0"

start "" "http://127.0.0.1:5173"

endlocal
