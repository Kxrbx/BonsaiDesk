$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$venvDir = Join-Path $root ".venv"
$venvPython = Join-Path $root ".venv\Scripts\python.exe"
$tempDir = Join-Path $root ".tmp"
$npmCacheDir = Join-Path $root ".npm-cache"

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
New-Item -ItemType Directory -Force -Path $npmCacheDir | Out-Null

$env:TEMP = $tempDir
$env:TMP = $tempDir
$env:npm_config_cache = $npmCacheDir

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
  }
}

if (-not (Test-Path $venvPython)) {
  Invoke-CheckedCommand python -m venv $venvDir
}

Invoke-CheckedCommand $venvPython -m ensurepip --upgrade
Invoke-CheckedCommand $venvPython -m pip install --upgrade pip
Invoke-CheckedCommand $venvPython -m pip install -r (Join-Path $root "backend\requirements.txt")

Push-Location (Join-Path $root "frontend")
try {
  Invoke-CheckedCommand npm install
} finally {
  Pop-Location
}

Write-Host "Bootstrap complete."

