Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$python = Join-Path $root '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) {
  $python = 'C:/Python314/python.exe'
}

Write-Host "Using Python: $python" -ForegroundColor DarkGray

Write-Host "Installing/Updating packaging dependencies..." -ForegroundColor Cyan
& $python -m pip install --upgrade pip pyinstaller

Write-Host "Building AG3NT Assistant EXE..." -ForegroundColor Cyan
& $python -m PyInstaller `
  --noconfirm `
  --clean `
  --onefile `
  --console `
  --name AG3NT-Assistant `
  --paths . `
  --hidden-import apps.tui.assistant `
  --hidden-import apps.tui.gateway `
  --hidden-import speech_recognition `
  --hidden-import pyttsx3 `
  --exclude-module IPython `
  --exclude-module matplotlib `
  --exclude-module pandas `
  --exclude-module pytest `
  --exclude-module tensorflow `
  --exclude-module torch `
  --exclude-module numba `
  --exclude-module llvmlite `
  assistant_cli.py

Write-Host "Build complete." -ForegroundColor Green
Write-Host "EXE path: $root/dist/AG3NT-Assistant.exe" -ForegroundColor Green
