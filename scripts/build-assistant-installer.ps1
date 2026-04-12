Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$python = Join-Path $root '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) {
  $python = 'C:/Python314/python.exe'
}

Write-Host "Using Python: $python" -ForegroundColor DarkGray

if (-not (Test-Path '.\dist\AG3NT-Assistant.exe')) {
    Write-Host 'Assistant payload EXE missing. Building payload first...' -ForegroundColor Yellow
    .\scripts\build-assistant-exe.ps1
}

Write-Host 'Installing/Updating PyInstaller...' -ForegroundColor Cyan
& $python -m pip install --upgrade pyinstaller

Write-Host 'Building installer EXE...' -ForegroundColor Cyan
& $python -m PyInstaller `
  --noconfirm `
  --clean `
  --onefile `
  --console `
  --name AG3NT-Assistant-Setup `
  --paths . `
  --add-data "dist/AG3NT-Assistant.exe;." `
  installer/assistant_installer.py

Write-Host 'Installer build complete.' -ForegroundColor Green
Write-Host "Installer path: $root/dist/AG3NT-Assistant-Setup.exe" -ForegroundColor Green
