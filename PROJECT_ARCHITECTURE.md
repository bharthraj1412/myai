# AG3NT Project Architecture

## Project Vision

AG3NT is a **Personal AI Infrastructure (PAI)** platform. Rebuilt from the ground up on DeepAgents, it features a self-improving memory system, a 7-phase Algorithm Engine, event-driven lifecycle hooks, and specialized agent personalities.

**Key Philosophy**: Self-improving, Goal-aligned (TELOS), Locally-controlled.

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Algorithm Engine** | 7-phase execution (Observe→Think→Plan→Build→Execute→Verify→Learn) with PRDs |
| **Memory System** | Centralized `MEMORY/` directory for work, learnings, and state persistence |
| **TELOS Goal System** | User identity and goals defined in `USER/TELOS/` to guide agent priorities |
| **Agent Roster** | 8 specialized personas (Engineer, Architect, QA Tester, etc.) dynamically routed |
| **Event Hooks** | 10 lifecycle hooks (e.g., RatingCapture, WorkCompletionLearning) for automation |
| **Skill System** | Canonical TitleCase skills with declarative metadata (`SKILL.md`) |
| **Web Dashboard** | React UI with PAI Dashboard (Algorithm, Memory, Agents, TELOS) |

---

## System Architecture

### High-Level Deployment Model

```text
┌─────────────────────────────────────────────────────────────┐
│                        AG3NT User                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐   ┌──────────────┐   ┌────────────────┐
│  │   Web Dashboard  │   │   Terminal   │   │ Chat Channels  │
│  │  (Next.js/React) │   │   UI (TUI)   │   │(Discord, Slack)│
│  │   Port 3000      │   │              │   │                │
│  └────────┬─────────┘   └──────┬───────┘   └────────┬───────┘
│           │                     │                    │
│           └─────────────────────┼────────────────────┘
│                                 │
│                    HTTP + WebSocket + /api/memory
│                                 │
│           ┌─────────────────────▼─────────────────────┐
│           │   Gateway Daemon (TypeScript/Node.js)     │
│           │  - Hook Manager (10 Lifecycle Hooks)      │
│           │  - Memory API Endpoints                   │
│           │  - Session Routing & Management           │
│           └─────────────────────┬─────────────────────┘
│                                 │
│                    gRPC / Socket IPC
│                                 │
│           ┌─────────────────────▼─────────────────────┐
│           │   Agent Worker (Python/DeepAgents)        │
│           │  - Algorithm Engine (7-Phase execution)   │
│           │  - Subagent Registry (8 Personas)         │
│           │  - Tool / Skill Execution                 │
│           └─────────────────────┬─────────────────────┘
```
│                                 │
│           ┌─────────────────────▼─────────────────────┐
│           │ External Services & Integrations          │
│           │  - LLM Providers (Claude, GPT, etc.)      │
│           │  - 370+ Integrations (CRM, Storage, etc.) │
│           │  - MCP Servers                            │
│           └─────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **Gateway** (`apps/gateway/`)
- **Language**: TypeScript (Node.js)
- **Purpose**: HTTP + WebSocket daemon, event routing, session management
- **Port**: 18789
- **Key Responsibilities**:
  - REST API for chat, model config, health checks
  - WebSocket event streaming
  - Channel adapters (Slack, Discord, Telegram)
  - Session persistence (SQLite)
  - Health checks and service registration
- **Key Dependencies**: Express.js, WebSocket (ws), better-sqlite3, Slack Bolt, Discord.js

#### 2. **Agent Worker** (`apps/agent/`)
- **Language**: Python
- **Purpose**: DeepAgents runtime, LLM inference, tool execution
- **Port**: 18790
- **Key Responsibilities**:
  - Chat message processing and inference
  - Tool/skill execution
  - Browser automation via Playwright
  - Integration tool loading (370+ available)
  - Model provider configuration (Claude, OpenAI, etc.)
- **Key Dependencies**: DeepAgents, Anthropic SDK, OpenAI SDK, Playwright

#### 3. **Web Dashboard** (`apps/ui/`)
- **Language**: TypeScript (Next.js / React)
- **Purpose**: Web interface for chat, artifact management, skill browser
- **Port**: 3000
- **Key Features**:
  - Real-time chat with streaming
  - Artifact library (code, documents, etc.)
  - Skills and tools browser
  - MCP server manager
  - Browser automation interface
  - System monitoring and logs
- **Key Dependencies**: Next.js, React, Radix UI, TailwindCSS, Playwright

#### 4. **Terminal UI** (`apps/tui/`)
- **Language**: TypeScript
- **Purpose**: Terminal user interface for keyboard-drive interaction
- **Key Features**: Command-line chat, skill management, configuration

---

## Tech Stack Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Presentation** | Next.js, React, TailwindCSS, Radix UI | Latest | Web dashboard & UI components |
| **Gateway** | TypeScript, Express.js, WebSocket | Node 18+ | Event routing, session management |
| **Worker** | Python, DeepAgents, Playwright | Python 3.10+ | LLM inference, tool execution |
| **Package Mgmt** | pnpm (monorepo), pip | Latest | Dependency management |
| **Database** | SQLite (better-sqlite3) | v3 | Session persistence |
| **Testing** | Vitest, Playwright | Latest | Unit, integration, E2E tests |
| **DevOps** | Docker, Docker Compose | Latest | Containerization and orchestration |
| **Channels** | Slack Bolt, Discord.js, Telegram API, Node Schedule | Latest | Multi-channel adapters |

---

## Integration Ecosystem

### 370+ Community Integrations

<details open>
<summary><strong>Integration Categories</strong></summary>

| Category | Count | Examples |
|----------|-------|----------|
| **AI & LLM Services** | 15+ | Claude, OpenAI GPT, Gemini, Groq, Mistral, Perplexity |
| **CRM & Sales** | 20+ | Salesforce, HubSpot, Pipedrive, Linear, Zoho, Copper, Close |
| **Productivity & Docs** | 40+ | Notion, Jira, Asana, Monday.com, Trello, Coda, Confluence |
| **Communication** | 30+ | Slack, Discord, Teams, Telegram, Gmail, Twilio, SendGrid |
| **E-Commerce** | 25+ | Shopify, BigCommerce, Stripe, Square, PayPal, Chargebee |
| **Finance & Accounting** | 15+ | Stripe, Chargebee, Billplz, Cashfree, Baremetrics, Bokio |
| **Analytics & Business Intel** | 20+ | Google Analytics, Mixpanel, Amplitude, Chartly, Clicdata |
| **Storage & Cloud** | 20+ | AWS S3, Azure Blob, Google Drive, Dropbox, Backblaze, Box |
| **HR & People** | 15+ | BambooHR, Ashby, Bika, Assembled, Workday |
| **Code & DevOps** | 15+ | GitHub, GitLab, Azure DevOps, Jenkins, CircleCI |
| **Databases & Data** | 20+ | PostgreSQL, MongoDB, Supabase, Firebase, Couchbase |
| **Other Services** | 120+ | Calendar, Email, SMS, Automation platforms, Legal tools, etc. |

</details>

Each integration is a **self-contained module** in `/community/<integration-name>/` with:
- `package.json` - Metadata and dependencies
- `index.ts` or `index.py` - Tool definitions
- `manifest.json` - Integration metadata (schema, auth, etc.)

---

## Monorepo Structure

AG3NT is organized as a **pnpm workspace monorepo** for code sharing and parallel development:

```
AG3NT-main/
├── apps/                    # Core applications
│   ├── gateway/             # HTTP + WebSocket daemon (TypeScript)
│   ├── agent/               # DeepAgents worker (Python)
│   ├── ui/                  # Next.js web dashboard
│   └── tui/                 # Terminal UI client
│
├── community/               # 370+ community integrations
│   ├── claude/
│   ├── openai/
│   ├── stripe/
│   ├── slack/
│   └── ... (alphabetical by integration)
│
├── skills/                  # Bundled AI skills (SKILL.md format)
│   ├── app-launcher/
│   ├── daily-briefing/
│   ├── web-research/
│   ├── voice-tts/
│   └── ... (10 bundled skills)
│
├── packages/                # Shared utilities
│   └── shared/              # Shared types, utilities, constants
│
├── config/                  # Configuration templates
│   ├── default-config.yaml
│   └── goals/
│
├── python/                  # Python utilities
│   ├── deepagents_daemon.py # Daemon spawn helper
│   └── browser_ws_server.py # Playwright browser bridge
│
├── scripts/                 # Automation scripts
├── tests/                   # Integration test suite
└── ROOT CONFIG FILES
    ├── package.json         # pnpm workspace root config
    ├── pnpm-workspace.yaml  # pnpm workspace definition
    ├── tsconfig.json        # TypeScript config
    ├── docker-compose.yml   # Docker multi-service setup
    ├── start.ps1            # Windows quick-start
    ├── stop.ps1             # Windows quick-stop
    ├── DEVELOPER.md         # Maintainer reference
    └── README.md            # Project README
```

---

## Data Flow: Chat Request

### Typical Chat Send Flow

```
1. User types message in UI (web, TUI, or channel)
   └─> UI captures message + context (attachments, model, etc.)

2. UI sends HTTP POST to Gateway /api/chat/stream
   └─> Payload: { message, modelId, conversationId, attachments }

3. Gateway receives request
   └─> Creates/loads session
   └─> Validates message
   └─> Routes to available Agent Worker

4. Gateway sends task to Agent Worker
   └─> Worker receives task on port 18790
   └─> Worker initializes model/provider (Claude, GPT, etc.)

5. Agent calls LLM with message
   └─> LLM streams response

6. Agent processes response
   └─> Extracts tool calls if present
   └─> Executes tools/skills (browser, integrations, etc.)
   └─> Streams status updates back to Gateway

7. Gateway streams updates to UI via WebSocket/SSE
   └─> Real-time chat updates visible to user

8. Session stored in SQLite
   └─> History preserved for future context
```

### Event Flow Architecture

```
User Input
   │
   ▼
Gateway HTTP/WebSocket
   │
   ├─> Session Manager (load/create/persist)
   ├─> Auth Validator
   └─> Router → Agent Worker
          │
          ▼
        LLM Provider (Claude, GPT, etc.)
           (stream response)
           │
           ▼
        Tool Executor
           ├─> Browser Automation (Playwright)
           ├─> Integration Tools (370+ available)
           ├─> Skill Executor (SKILL.md modules)
           └─> MCP Servers
              │
              ▼
        Update Stream → Gateway → UI/Channels
```

---

## Security Architecture

### Authentication & Authorization

- **DM Pairing**: Secure device pairing for multi-node setups
- **HITL (Human-In-The-Loop)**: Approval workflows for sensitive operations
- **API Keys**: Environment variable-based secrets for LLM/integration credentials
- **Session Management**: SQLite-backed session persistence with expiry

### Privacy-First Design

- **Local Execution**: All inference runs locally (no cloud logging of conversations)
- **Configurable Storage**: Chat history stored locally in SQLite
- **No Telemetry**: No external tracking or analytics by default
- **Tool Sandboxing**: Browser automation isolated via Playwright

---

## Skill Framework

### What are Skills?

Skills are **reusable AI capabilities** defined in `SKILL.md` format. They enable agents to perform domain-specific tasks without code changes.

### Bundled Skills (10)

| Skill | Purpose |
|-------|---------|
| **app-launcher** | Launch and control desktop applications |
| **daily-briefing** | Generate personalized daily summaries |
| **deep-reasoning** | Extended thinking for complex problems |
| **example-skill** | Template for creating custom skills |
| **file-manager** | File system operations (read, write, delete) |
| **heartbeat** | Health checks and monitoring |
| **system-info** | System statistics and information |
| **voice-tts** | Text-to-speech and voice generation |
| **web-research** | Search and web scraping capabilities |
| **camera-capture** | Image capture and processing |

Each skill is a self-contained module in `/skills/<skill-name>/` with:
- `SKILL.md` - Skill definition and metadata
- `index.ts` or `index.py` - Implementation
- `package.json` - Dependencies

---

## Deployment Models

### 1. Local Development (Windows Quick-Start)

```powershell
# One command starts Gateway + Agent + UI
.\start.ps1

# Stop all services
.\stop.ps1
```

### 2. Manual Multi-Terminal Setup

Terminal 1: Gateway
```bash
cd apps/gateway && pnpm dev
```

Terminal 2: Agent Worker
```bash
cd apps/agent && .venv\Scripts\activate && python -m ag3nt_agent.worker
```

Terminal 3: Web Dashboard
```bash
cd apps/ui && pnpm dev
```

### 3. Docker Containerized Deployment

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

**Docker Compose Services**:
- **Gateway**: Port 18789, built from `apps/gateway/Dockerfile`
- **Agent**: Port 18790, built from `apps/agent/Dockerfile`
- **Shared Volume**: `/home/ag3nt/.ag3nt` for config and persistence

### 4. Production Deployment

- Deploy Gateway and Agent as systemd services or Kubernetes pods
- Use external SQLite or PostgreSQL for session persistence
- Configure API key management via environment variables or secrets vault
- Enable HTTPS/TLS for remote access
- Set up monitoring and alerting

---

## Known Operational Constraints

### External Dependencies

- **LLM Provider API Keys**: Claude, OpenAI, OpenRouter, etc. require valid credentials
- **Integration Credentials**: Each enabled integration needs authentication (API keys, OAuth tokens)
- **Network Access**: Some integrations require public internet access

### Limitations

- **Gateway Persistence**: Falls back to in-memory if SQLite native binding unavailable for active Node ABI
- **Model Configuration**: Chat stream returns provider errors if API keys missing
- **Browser Automation**: Playwright requires compatible browser installation
- **Concurrent Sessions**: Performance degrades with many simultaneous chat streams

### Recovery

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for debugging guidance.

---

## What's Next?

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Set up your local development environment
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Navigate the codebase
- **[DEVELOPER.md](DEVELOPER.md)** - Maintainer reference for upgrades and debugging
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

