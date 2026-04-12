# myai Developer Full Guide

This document is a full developer handoff for the myai repository.

Repository: https://github.com/bharthraj1412/myai

---

## 1) Project Summary

myai is a local-first personal AI infrastructure platform built from DeepAgents and PAI-style patterns.

Core capabilities:
- 7-phase Algorithm Engine (Observe, Think, Plan, Build, Execute, Verify, Learn)
- Persistent memory (WORK, LEARNING, RESEARCH, SECURITY, STATE)
- TELOS goal alignment under USER/TELOS
- Multi-channel operation (UI, TUI, chat channel adapters)
- Multi-model support (Anthropic, OpenAI, OpenRouter, Kimi, Google, Groq, custom OpenAI-compatible endpoints)
- Skills framework + large community integration catalog

---

## 2) Monorepo Map

Top-level:
- apps/agent: Python AI worker runtime
- apps/gateway: TypeScript HTTP/WebSocket gateway
- apps/ui: Next.js dashboard and streaming chat
- apps/tui: terminal and voice assistant interface
- community: integration modules
- skills: bundled skill packs
- hooks: lifecycle hooks
- MEMORY: system memory directories
- USER: user identity/goals/preferences

Primary docs:
- README.md
- GETTING_STARTED.md
- CONFIGURATION.md
- TROUBLESHOOTING.md
- PROJECT_ARCHITECTURE.md
- DEVELOPER.md

---

## 3) Runtime Architecture

Main service graph:
1. UI/TUI/client sends request to Gateway
2. Gateway validates/routes and manages sessions
3. Gateway calls Agent Worker
4. Agent Worker builds/uses DeepAgent graph and tools
5. Responses stream back to Gateway then to client

Default ports:
- UI: 3000
- Gateway: 18789
- Agent Worker: 18790
- Browser WS bridge: 8765 (launcher default)

Runtime metadata:
- ~/.ag3nt/runtime.json

Runtime logs:
- ~/.ag3nt/logs/gateway.log
- ~/.ag3nt/logs/agent.log
- ~/.ag3nt/logs/ui.log
- ~/.ag3nt/logs/browser-ws.log

---

## 4) Key Components by App

### 4.1 apps/gateway

Responsibilities:
- REST + WebSocket APIs
- Session lifecycle and routing
- Health/status endpoints
- Scheduler endpoints
- Channel adapter bridging

Important API base:
- http://127.0.0.1:18789/api

Core endpoints in daily dev:
- GET /api/health
- POST /api/chat
- session approval/session listing routes
- scheduler status/jobs routes

### 4.2 apps/agent

Responsibilities:
- Model provider setup and inference
- Tool and skill execution
- DeepAgents graph construction
- Browser/tool orchestration

Key files:
- ag3nt_agent/worker.py
- ag3nt_agent/deepagents_runtime.py
- ag3nt_agent/model_config.py
- ag3nt_agent/algorithm/middleware.py

### 4.3 apps/ui

Responsibilities:
- Next.js app shell
- Chat streaming UX
- Skill/tool dashboards
- API routes that proxy/coordinate daemon/gateway interactions

Key areas:
- app/api/chat/stream/route.ts
- providers/chat-provider.tsx
- lib/deepagents/daemon-client.ts
- app/layout.tsx
- components/error-boundary.tsx

### 4.4 apps/tui

Responsibilities:
- Terminal chat UX
- Slash command + bash mode
- Voice assistant mode

Key file for voice assistant:
- apps/tui/assistant.py

---

## 5) Local Development Runbook

## Windows recommended launcher

From repo root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\start.ps1 -NoBrowser
```

Stop all processes:

```powershell
.\stop.ps1
```

Why bypass is needed:
- On some machines, unsigned script execution is blocked by default policy.
- Process scope is temporary and safest for local runs.

## Manual startup

Gateway:

```powershell
cd apps\gateway
pnpm dev
```

Agent:

```powershell
cd apps\agent
.\.venv\Scripts\python.exe -m ag3nt_agent.worker
```

UI:

```powershell
cd apps\ui
pnpm dev
```

Health checks:

```powershell
Invoke-WebRequest http://localhost:18789/api/health -UseBasicParsing
Invoke-WebRequest http://localhost:3000 -UseBasicParsing
```

---

## 6) Configuration Model

Priority order:
1. Environment variables
2. ~/.ag3nt/config.yaml
3. config/default-config.yaml
4. Code defaults

Core env vars:
- AG3NT_MODEL_PROVIDER
- AG3NT_MODEL_NAME
- AG3NT_MODEL_TEMPERATURE
- AG3NT_MODEL_MAX_TOKENS
- Provider keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, etc.)

Custom OpenAI-compatible endpoint support:
- AG3NT_CUSTOM_MODEL_URL
- AG3NT_CUSTOM_MODEL_NAME
- AG3NT_CUSTOM_API_KEY

NVIDIA-compatible example:
- AG3NT_CUSTOM_MODEL_URL=https://integrate.api.nvidia.com/v1
- AG3NT_CUSTOM_MODEL_NAME=qwen/qwen3-coder-480b-a35b-instruct

---

## 7) Testing and Validation

UI and API e2e:
- apps/ui/e2e

Common validation commands:

```powershell
# repo root
pnpm -r build

# targeted lint/type/test commands per package as needed
```

After high-risk changes, always validate:
- Gateway starts and /api/health responds
- Agent worker startup completes
- UI chat route and stream route respond
- Main page loads without chunk/runtime errors

---

## 8) Build and Distribution (Assistant EXE)

Build assistant payload EXE:

```powershell
pnpm run build:assistant:exe
```

Build installer EXE:

```powershell
pnpm run build:assistant:setup
```

Install/uninstall helper scripts:
- pnpm run assistant:install
- pnpm run assistant:uninstall

Generated artifacts:
- dist/AG3NT-Assistant.exe
- dist/AG3NT-Assistant-Setup.exe

---

## 9) Extension Points

Skills:
- skills/<SkillName>/SKILL.md

Community integrations:
- community/<integration-name>/

Hooks:
- hooks/lib and hooks/handlers

Agent personas:
- agents/*.md

Memory system:
- MEMORY/*

User goal alignment:
- USER/TELOS/*

---

## 10) Known Operational Failure Modes

1. UI shows localhost unreachable after startup
- Usually happens when agent startup fails and launcher shuts down all services.
- Check ~/.ag3nt/logs/agent.log first.

2. Script execution blocked on Windows
- Use process-scoped bypass before start.ps1.

3. ChunkLoadError in dev mode
- Usually stale browser chunk cache during restarts.
- Hard refresh/reopen tab; UI has recovery logic in error boundary.

4. Provider key/auth errors
- Validate correct provider env vars for selected model provider.

5. Port conflicts
- start.ps1 auto-increments but stale processes can still interfere.
- Run stop.ps1 to sweep ports/process trees.

---

## 11) Recent High-Impact Local Fixes

1. Launcher now prefers agent venv Python for worker startup
- start.ps1 updated to use apps/agent/.venv/Scripts/python.exe when present.

2. Algorithm middleware compatibility hardening for newer langchain middleware checks
- apps/agent/ag3nt_agent/algorithm/middleware.py updated with compatibility hooks and metadata expected by current agent factory behavior.

3. UI chunk load resilience
- apps/ui/components/error-boundary.tsx performs one-time auto-reload on chunk load failures.

4. TUI voice assistant setup improvements
- apps/tui/assistant.py supports custom OpenAI-compatible provider mode and safer token defaults.

---

## 12) Developer Onboarding Checklist

1. Clone repo and install root dependencies (pnpm install)
2. Create and activate apps/agent/.venv; install Python deps
3. Configure .env provider keys
4. Launch via start.ps1
5. Validate health endpoints and UI load
6. Send a chat request and verify streaming
7. Read logs from ~/.ag3nt/logs if anything fails

---

## 13) Change Management Guidelines

When changing runtime-critical paths (gateway routing, agent startup, stream parsing):
- Make small, isolated commits
- Verify service startup + health after each change
- Validate UI and API behavior together
- Update DEVELOPER.md and this guide with new known issues/fixes

---

## 14) Quick Command Reference

```powershell
# Start full stack
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\start.ps1 -NoBrowser

# Stop full stack
.\stop.ps1

# Build assistant installer
pnpm run build:assistant:setup

# Gateway health
Invoke-WebRequest http://localhost:18789/api/health -UseBasicParsing

# UI health
Invoke-WebRequest http://localhost:3000 -UseBasicParsing
```

---

## 15) Where to Look First During Incidents

1. ~/.ag3nt/logs/agent.log
2. ~/.ag3nt/logs/gateway.log
3. ~/.ag3nt/logs/ui.log
4. apps/ui/lib/deepagents/daemon-client.ts
5. apps/agent/ag3nt_agent/deepagents_runtime.py
6. apps/gateway/src/gateway/createGateway.ts

---

This file is intended as the primary maintainer handoff document for this repository.
