# AG3NT Project One-Click Setup Script
# This script will:
# 1. Install pnpm if not present
# 2. Install Node.js dependencies
# 3. Install Python dependencies (if .venv or requirements.txt found)
# 4. Build the UI
# 5. Print next steps

$ErrorActionPreference = 'Stop'

Write-Host "[1/5] Checking for pnpm..." -ForegroundColor Cyan
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Installing globally via npm..." -ForegroundColor Yellow
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "npm is required but not found. Please install Node.js and npm first." -ForegroundColor Red
        exit 1
    }
    npm install -g pnpm
}

Write-Host "[2/5] Installing Node.js dependencies with pnpm..." -ForegroundColor Cyan
pnpm install

Write-Host "[3/5] Setting up Python environment..." -ForegroundColor Cyan
if (Test-Path apps/agent/requirements.txt) {
    if (-not (Test-Path apps/agent/.venv)) {
        Write-Host "Creating Python virtual environment in apps/agent..." -ForegroundColor Yellow
        python -m venv apps/agent/.venv
    }
    Write-Host "Installing Python dependencies..." -ForegroundColor Green
    $pip = ".\apps\agent\.venv\Scripts\pip.exe"
    & $pip install -r apps/agent/requirements.txt
    if (Test-Path apps/tui/requirements.txt) {
        & $pip install -r apps/tui/requirements.txt
    }
} else {
    Write-Host "No Python requirements.txt found in apps/agent. Skipping Python setup." -ForegroundColor Yellow
}

Write-Host "[4/5] Building AG3NT Workspace..." -ForegroundColor Cyan
pnpm build

Write-Host "[5/5] Setup complete!" -ForegroundColor Green
Write-Host "To start all components easily: .\start.ps1" -ForegroundColor Cyan
Write-Host "For manual startup or individual services:" -ForegroundColor Cyan
Write-Host " - Web UI Server: pnpm dev" -ForegroundColor Cyan
Write-Host " - Python agent: .\apps\agent\.venv\Scripts\Activate.ps1; cd apps\agent; python -m uvicorn ag3nt_agent.worker:app --port 18790" -ForegroundColor Cyan
Write-Host " - Gateway: pnpm --filter @ag3nt/gateway dev" -ForegroundColor Cyan
Write-Host " - TUI: pnpm --filter @ag3nt/tui dev" -ForegroundColor Cyan
