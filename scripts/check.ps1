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
Push-Location $frontendPath
npm run build
if ($LASTEXITCODE -ne 0) {
  Pop-Location
  Write-Host "Frontend build failed. Retry manually with: Set-Location '$frontendPath'; npm run build" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host "Running frontend logic tests..."
npm run test:logic
if ($LASTEXITCODE -ne 0) {
  Pop-Location
  Write-Host "Frontend logic tests failed. Retry manually with: Set-Location '$frontendPath'; npm run test:logic" -ForegroundColor Yellow
  exit $LASTEXITCODE
}
Pop-Location

Write-Host "Running backend unit tests..."
Push-Location (Join-Path $root "backend")
& $python -m unittest discover -s tests -v
if ($LASTEXITCODE -ne 0) {
  Pop-Location
  exit $LASTEXITCODE
}
Pop-Location

Write-Host "Checks completed."
