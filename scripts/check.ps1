$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $root ".venv\Scripts\python.exe"

if (Test-Path $venvPython) {
  $python = $venvPython
} else {
  $python = "python"
}

Write-Host "Building frontend..."
$frontendPath = Join-Path $root "frontend"
& powershell.exe -NoProfile -Command "Set-Location '$frontendPath'; npm run build"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Frontend build failed in script mode. Retry manually with: Set-Location '$frontendPath'; npm run build" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host "Running backend unit tests..."
Push-Location (Join-Path $root "backend")
& $python -m unittest discover -s tests -v
if ($LASTEXITCODE -ne 0) {
  Pop-Location
  exit $LASTEXITCODE
}
Pop-Location

Write-Host "Checks completed."
