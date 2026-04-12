# AG3NT Developer Guide

This document is a practical reference for maintainers doing upgrades, bug fixes, and releases.

## 1) Monorepo map

- apps/gateway: TypeScript gateway (HTTP + WebSocket + routing + sessions)
- apps/agent: Python worker (DeepAgents runtime)
- apps/ui: Next.js dashboard and streaming chat UX
- apps/tui: terminal UI client
- community: integration packs
- skills: skill packs and SKILL.md assets
- packages: shared code and utilities

## 2) Core runtime flow

1. UI sends chat request to `apps/ui/app/api/chat/stream/route.ts`.
2. UI API route uses daemon client in `apps/ui/lib/deepagents/daemon-client.ts`.
3. Python daemon script (`python/deepagents_daemon.py`) streams events.
4. Gateway routes messages to worker (`apps/gateway/src/gateway/router.ts`).
5. Worker executes tools and returns stream updates.

## 3) Critical files to understand before upgrades

- UI streaming state machine: `apps/ui/providers/chat-provider.tsx`
- UI input and controls: `apps/ui/components/features/chat/chat-input.tsx`
- UI daemon spawn/config: `apps/ui/lib/deepagents/daemon-client.ts`
- UI stream endpoints: `apps/ui/app/api/chat/stream/route.ts`, `apps/ui/app/api/chat/resume-stream/route.ts`
- Gateway routing and approval logic: `apps/gateway/src/gateway/router.ts`
- Gateway model options and config APIs: `apps/gateway/src/gateway/createGateway.ts`
- Worker entrypoint: `apps/agent/ag3nt_agent/worker.py`
- Worker model/provider setup: `apps/agent/ag3nt_agent/model_config.py`

## 4) Recent fixes (important context)

### Fixed: DeepAgents daemon exit (code=1)

Symptoms:
- UI console showed: `DeepAgents daemon exited (code=1)`.

Root cause:
- Daemon launcher could resolve the wrong script/python in this workspace layout.

Fix location:
- `apps/ui/lib/deepagents/daemon-client.ts`

What changed:
- Added monorepo root autodetection.
- Added stronger daemon script path resolution.
- Added stronger agent venv Python resolution.
- Hardened daemon spawn startup behavior so early process exits reject startup instead of falsely resolving.

### Fixed: Audio chat recognition lifecycle

Symptoms:
- Speech recognition could re-initialize too often.

Fix location:
- `apps/ui/components/features/chat/chat-input.tsx`

What changed:
- SpeechRecognition now initializes once.
- Latest input value and onChange are read from refs.

### Fixed: UI stream payload hardening

Symptoms:
- Malformed or partial SSE event payloads could break parts of stream message handling.

Fix location:
- `apps/ui/providers/chat-provider.tsx`

What changed:
- Added lightweight SSE payload validation helpers.
- Added safer string extraction for status/text/error event fields.
- Ignored malformed event payloads without breaking ongoing stream processing.

### Fixed: Gateway duplicate-start error handling

Symptoms:
- Starting gateway when port `18789` was already occupied caused an unhandled listen error stack trace.

Fix location:
- `apps/gateway/src/gateway/createGateway.ts`
- `apps/gateway/dist/gateway/createGateway.js`

What changed:
- Gateway startup now listens for server `error` and rejects startup cleanly.
- `EADDRINUSE` now reports an actionable message to stop existing process or choose another port.

### Fixed: Tailwind config runtime ESM issue

Symptoms:
- UI crash with `ReferenceError: require is not defined`.

Fix location:
- `apps/ui/tailwind.config.ts`

What changed:
- Replaced CommonJS `require(...)` with ESM import.

## 5) Known operational issues

- Chat still requires valid provider API keys. If missing, stream returns provider key errors.
- Gateway runtime may fall back to in-memory persistence if sqlite native binding is unavailable for the active Node ABI.

## 6) Upgrade workflow (safe order)

1. Upgrade `apps/ui` dependencies and verify chat streaming.
2. Upgrade `apps/gateway` and verify `/api/model/config` and health endpoints.
3. Upgrade `apps/agent` dependencies and verify worker startup + `/health`.
4. Verify end-to-end streaming with one model from each provider in use.

## 7) File-by-file audit workflow for future maintenance

Use this workflow per package (`apps/ui`, `apps/gateway`, `apps/agent`) instead of random edits.

1. Inventory files:
   - `rg --files apps/ui`
   - `rg --files apps/gateway`
   - `rg --files apps/agent`
2. Identify high-risk code paths:
   - entrypoints, routing, model/provider config, streaming parsers, process spawn code.
3. Run focused checks after each change:
   - Type/build check for changed package.
   - One runtime smoke test for affected endpoint.
4. Validate behavior in UI:
   - send message
   - approve/reject flow (if enabled)
   - model switch
   - attachment and audio input (if modified)
5. Document the change in this file under "Recent fixes" and "Known operational issues".

## 8) Minimal runbook

Root (recommended):
- `./start.ps1`
- `./stop.ps1`

Manual:
- Gateway: `cd apps/gateway && pnpm dev`
- Agent: `cd apps/agent && .venv\Scripts\python.exe -m ag3nt_agent.worker`
- UI: `cd apps/ui && pnpm dev --port 3001`

## 9) Pre-release checklist

- UI loads without runtime exceptions.
- Chat stream endpoint responds with SSE events.
- No daemon startup crash on first message.
- Model selector options match gateway model config.
- Worker health endpoint is reachable.
- Any fallback behavior is explicitly documented.

## 10) Verified upgrade hotspots from TODO markers

- Gateway storage bootstrap is still a stub:
   - `apps/gateway/src/storage/db.ts`
- Gateway notification fan-out has a TODO for real channel notification dispatch:
   - `apps/gateway/src/gateway/createGateway.ts`
- UI E2B sandbox middleware contains placeholder `ensureSession` TODO notes:
   - `apps/ui/lib/e2b/sandbox-middleware.ts`
- Agent runtime has a TODO for integrating with Gateway approval queue:
   - `apps/agent/ag3nt_agent/deepagents_runtime.py`

These are good candidates for the next upgrade cycle after core chat reliability work.
