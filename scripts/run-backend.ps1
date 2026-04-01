$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $root ".venv\Scripts\python.exe"

if (Test-Path $venvPython) {
  $python = $venvPython
} else {
  $python = "python"
}

Push-Location (Join-Path $root "backend")
& $python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
Pop-Location

