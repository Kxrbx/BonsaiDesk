$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$powershell = "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe"

Start-Process $powershell -ArgumentList @("-NoExit", "-File", (Join-Path $root "scripts\run-backend.ps1"))
Start-Process $powershell -ArgumentList @("-NoExit", "-File", (Join-Path $root "scripts\run-frontend.ps1"))

Write-Host "Backend and frontend launched in separate windows."

