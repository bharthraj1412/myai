# AG3NT Project Structure

This document maps the codebase structure and explains what each folder contains.

---

## Directory Tree

```
AG3NT-main/
│
├── 📁 apps/                           # Core applications (4 services)
│   ├── 📁 gateway/                    # TypeScript HTTP + WebSocket daemon
│   ├── 📁 agent/                      # Python AI worker (DeepAgents runtime)
│   ├── 📁 ui/                         # Next.js web dashboard
│   └── 📁 tui/                        # Terminal UI client
│
├── 📁 community/                      # 370+ integration modules
│   ├── 📁 claude/                     # Claude (Anthropic) integration
│   ├── 📁 openai/                     # OpenAI (GPT) integration
│   ├── 📁 slack/                      # Slack integration
│   ├── 📁 discord/                    # Discord integration
│   ├── 📁 stripe/                     # Stripe payment integration
│   ├── 📁 notion/                     # Notion integration
│   ├── 📁 salesforce/                 # Salesforce CRM integration
│   ├── 📁 google-drive/               # Google Drive storage integration
│   └── ... (300+ more, alphabetically)
│
├── 📁 skills/                         # AI capability modules (10 bundled)
│   ├── 📁 app-launcher/               # Launch desktop applications
│   ├── 📁 camera-capture/             # Capture images from camera
│   ├── 📁 daily-briefing/             # Generate daily summaries
│   ├── 📁 deep-reasoning/             # Extended thinking capabilities
│   ├── 📁 example-skill/              # Template for custom skills
│   ├── 📁 file-manager/               # File system operations
│   ├── 📁 heartbeat/                  # Health monitoring and checks
│   ├── 📁 system-info/                # System statistics and info
│   ├── 📁 voice-tts/                  # Text-to-speech and voice
│   └── 📁 web-research/               # Web search and scraping
│
├── 📁 packages/                       # Shared code (monorepo)
│   └── 📁 shared/                     # Shared types, utils, constants
│
├── 📁 config/                         # Configuration templates
│   ├── 📄 default-config.yaml         # Default configuration
│   └── 📁 goals/                      # Goal templates
│
├── 📁 python/                         # Python utilities
│   ├── 📄 deepagents_daemon.py        # Daemon process spawner
│   └── 📄 browser_ws_server.py        # Playwright WebSocket bridge
│
├── 📁 scripts/                        # Automation scripts
│
├── 📁 tests/                          # Integration test suite
│
├── 📁 vendor/                         # Third-party dependencies
│
├── 📄 package.json                    # pnpm root workspace config
├── 📄 pnpm-workspace.yaml             # Monorepo workspace definition
├── 📄 tsconfig.json                   # TypeScript configuration
├── 📄 docker-compose.yml              # Docker multi-service setup
├── 📄 start.ps1                       # Windows quick-start script
├── 📄 stop.ps1                        # Windows quick-stop script
├── 📄 setup-assistant.sh              # Assistant setup for Unix shells
├── 📄 setup-assistant.ps1             # Assistant setup for PowerShell
├── 📄 .env.example                    # Environment variables template
├── 📄 .gitignore                      # Git ignore patterns
├── 📄 README.md                       # Project overview
├── 📄 DEVELOPER.md                    # Maintainer reference
├── 📄 GETTING_STARTED.md              # Setup guide (NEW)
├── 📄 PROJECT_ARCHITECTURE.md         # Architecture deep-dive (NEW)
└── 📄 PROJECT_STRUCTURE.md            # This file (NEW)
```

---

## Core Applications (`apps/`)

### `apps/gateway/`

**Purpose**: HTTP + WebSocket daemon for routing, session management, and channel adapters.

```
apps/gateway/
├── src/
│   ├── index.ts                   # Entry point
│   ├── gateway/
│   │   ├── createGateway.ts       # Gateway factory
│   │   ├── router.ts              # Message routing logic
│   │   └── channels/              # Channel adapters
│   │       ├── slack.ts
│   │       ├── discord.ts
│   │       └── telegram.ts
│   ├── api/
│   │   ├── chat.ts                # Chat endpoint
│   │   ├── models.ts              # Model config endpoint
│   │   └── health.ts              # Health check endpoint
│   ├── services/
│   │   ├── SessionService.ts      # Session management
│   │   ├── DatabaseService.ts     # SQLite persistence
│   │   └── EventBus.ts            # Event streaming
│   ├── types/
│   └── utils/
├── dist/                          # Compiled JavaScript
├── Dockerfile                     # Docker image definition
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript config
```

**Key Files**:
- `src/index.ts` - Starts HTTP server on port 18789
- `src/gateway/router.ts` - Routes requests to Agent Worker
- `src/api/chat.ts` - POST `/api/chat` endpoint for messages
- `src/services/SessionService.ts` - Session persistence logic

**Technology**: TypeScript, Express.js, WebSocket, SQLite

---

### `apps/agent/`

**Purpose**: Python AI worker using DeepAgents for LLM inference, tool execution, and integration loading.

```
apps/agent/
├── ag3nt_agent/
│   ├── __init__.py
│   ├── worker.py                  # Entry point
│   ├── model_config.py            # LLM provider setup
│   ├── tools/
│   │   ├── browser.py             # Playwright browser automation
│   │   ├── integrations.py        # Load community integrations
│   │   └── skills.py              # Load and execute skills
│   ├── channels/
│   │   ├── slack.py               # Slack adapter
│   │   └── discord.py             # Discord adapter
│   └── utils/
│       ├── logging.py
│       └── config.py              # Configuration loader
├── tests/
│   └── test_worker.py
├── .venv/                         # Python virtual environment
├── Dockerfile                     # Docker image definition
├── pyproject.toml                 # Poetry dependencies
└── setup.py / requirements.txt    # pip dependencies
```

**Key Files**:
- `ag3nt_agent/worker.py` - Worker process listening on port 18790
- `ag3nt_agent/model_config.py` - LLM provider (Claude, GPT, etc.) setup
- `ag3nt_agent/tools/browser.py` - Playwright web automation
- `ag3nt_agent/tools/integrations.py` - Load 370+ integrations

**Technology**: Python 3.10+, DeepAgents, Anthropic SDK, OpenAI SDK, Playwright

---

### `apps/ui/`

**Purpose**: Next.js web dashboard for real-time chat, artifact management, and configuration.

```
apps/ui/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   ├── api/
│   │   ├── chat/
│   │   │   ├── stream/
│   │   │   │   └── route.ts       # POST /api/chat/stream (SSE endpoint)
│   │   │   └── resume-stream/
│   │   │       └── route.ts       # POST /api/chat/resume-stream
│   │   ├── models/
│   │   │   └── route.ts           # GET /api/models (model list)
│   │   └── health/
│   │       └── route.ts           # GET /api/health
│   └── (chat)/
│       └── [id]/
│           └── page.tsx           # Chat conversation page
├── components/
│   ├── features/
│   │   ├── chat/
│   │   │   ├── chat-input.tsx     # Message input box
│   │   │   ├── chat-message.tsx   # Message display
│   │   │   └── chat-container.tsx # Chat layout
│   │   ├── artifacts/
│   │   │   └── artifact-viewer.tsx
│   │   ├── skills/
│   │   │   └── skill-browser.tsx
│   │   └── models/
│   │       └── model-selector.tsx
│   └── ui/
│       ├── button.tsx             # Radix UI components
│       ├── input.tsx
│       └── ...
├── lib/
│   ├── deepagents/
│   │   ├── daemon-client.ts       # Spawn daemon process
│   │   └── types.ts               # DeepAgents types
│   ├── hooks/
│   │   ├── useChat.ts             # Chat streaming hook
│   │   └── useModels.ts           # Model list hook
│   ├── utils/
│   │   ├── sse.ts                 # Server-Sent Events parser
│   │   └── format.ts              # Text formatting utilities
│   └── api/
│       └── client.ts              # API client
├── providers/
│   ├── chat-provider.tsx          # Chat state management
│   └── theme-provider.tsx         # Theme context
├── styles/
│   └── globals.css                # Tailwind CSS
├── public/
│   └── images/                    # Static assets
├── Dockerfile                     # Docker image definition
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind CSS config
└── next.config.ts                 # Next.js config
```

**Key Files**:
- `app/api/chat/stream/route.ts` - Main chat streaming endpoint
- `lib/deepagents/daemon-client.ts` - Spawns Python daemon
- `providers/chat-provider.tsx` - React state for chat messages
- `components/features/chat/chat-input.tsx` - Message input + audio
- `tailwind.config.ts` - Styling configuration

**Technology**: Next.js, React, TypeScript, TailwindCSS, Radix UI, Playwright

---

### `apps/tui/`

**Purpose**: Terminal user interface for keyboard-driven interaction.

```
apps/tui/
├── assistant.py                   # Local voice assistant controller
├── app.py                         # Main TUI application
├── gateway.py                     # Gateway discovery/client
├── config.py                      # TUI constants and colors
├── widgets/                       # Chat and status widgets
├── screens/                       # Help, command palette, session browser
├── utils/                         # Session/history persistence
└── README.md                      # TUI documentation
```

**Technology**: TypeScript, Terminal UI framework

---

## Integrations (`community/`)

370+ pre-built integrations organized alphabetically by service name.

### Integration Module Structure

Each integration (e.g., `community/stripe/`) contains:

```
community/stripe/
├── index.ts (or index.py)         # Tool definitions
├── package.json                   # Metadata, auth schema, dependencies
├── README.md                       # Usage documentation
└── tests/
    └── integration.test.ts        # Integration tests
```

### Integration Categories

- **AI Services** (claude, openai, gemini, groq, mistral, etc.)
- **CRM** (salesforce, hubspot, pipedrive, zoho, copper, etc.)
- **Productivity** (notion, jira, asana, monday, trello, coda, etc.)
- **Communication** (slack, discord, telegram, gmail, twilio, etc.)
- **E-Commerce** (shopify, stripe, square, paypal, etc.)
- **Storage** (aws-s3, azure-blob, google-drive, dropbox, etc.)
- **Databases** (postgresql, mongodb, supabase, firebase, etc.)
- **And 60+ more categories...**

**Finding Integrations**:
```bash
# List all integrations
ls community/

# Search for integration
ls community/ | grep stripe

# View specific integration
ls community/stripe/
```

See [COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md) for how to create new integrations.

---

## Skills (`skills/`)

Reusable AI capabilities in SKILL.md format.

### Skill Module Structure

Each skill (e.g., `skills/web-research/`) contains:

```
skills/web-research/
├── SKILL.md                       # Skill definition (name, description, tools)
├── index.ts (or index.py)         # Implementation
├── package.json                   # Dependencies
├── README.md                       # Usage guide
└── tests/
    └── skill.test.ts              # Skill tests
```

### Built-in Skills

| Skill | Location | Purpose |
|-------|----------|---------|
| App Launcher | `skills/app-launcher/` | Launch and control desktop apps |
| Camera Capture | `skills/camera-capture/` | Capture images from camera |
| Daily Briefing | `skills/daily-briefing/` | Generate daily summaries |
| Deep Reasoning | `skills/deep-reasoning/` | Extended thinking for complex problems |
| Example Skill | `skills/example-skill/` | Template for custom skills |
| File Manager | `skills/file-manager/` | File system operations |
| Heartbeat | `skills/heartbeat/` | Health monitoring |
| System Info | `skills/system-info/` | System statistics |
| Voice TTS | `skills/voice-tts/` | Text-to-speech synthesis |
| Web Research | `skills/web-research/` | Web search and scraping |

See [SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md) for how to create custom skills.

---

## Shared Code (`packages/`)

Monorepo shared utilities used across multiple apps.

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── index.ts               # Shared TypeScript types
│   │   ├── chat.ts                # Chat message types
│   │   ├── model.ts               # LLM model types
│   │   ├── integration.ts         # Integration types
│   │   └── skill.ts               # Skill types
│   ├── utils/
│   │   ├── logger.ts              # Logging utility
│   │   ├── error.ts               # Error handling
│   │   ├── validation.ts          # Input validation
│   │   └── formats.ts             # Format utilities
│   ├── constants/
│   │   ├── ports.ts               # Port definitions
│   │   ├── providers.ts           # LLM provider list
│   │   └── channels.ts            # Channel types
│   └── index.ts                   # Public exports
├── package.json                   # Shared package config
└── tsconfig.json                  # TypeScript config
```

**Common Exports**:
- `types/chat.ts` - Chat message and conversation types
- `types/model.ts` - LLM model configuration
- `constants/ports.ts` - Port numbers (18789, 18790, 3000)
- `utils/logger.ts` - Logging (info, debug, error, warn)
- `utils/error.ts` - Custom error classes

**Usage in Apps**:
```typescript
import { ChatMessage, LLMModel } from '@ag3nt/shared/types';
import { logger } from '@ag3nt/shared/utils';
```

---

## Configuration (`config/`)

System configuration templates and defaults.

```
config/
├── default-config.yaml            # Default configuration
└── goals/
    ├── research.yaml              # Goal template: Research
    ├── automation.yaml            # Goal template: Automation
    └── ...
```

### Default Config Structure

See `config/default-config.yaml`:
- LLM provider setup (API keys, endpoints)
- Channel configuration (Slack, Discord, Telegram)
- Database settings
- Port configuration
- Feature flags

---

## Python Utilities (`python/`)

Python scripts for daemon management and browser automation.

```
python/
├── deepagents_daemon.py           # Spawns Python daemon process
└── browser_ws_server.py           # Playwright WebSocket bridge
```

**Used By**:
- `apps/ui/lib/deepagents/daemon-client.ts` - Spawns daemon via `deepagents_daemon.py`

---

## Scripts (`scripts/`)

Automation and helper scripts.

```
scripts/
├── build.sh                       # Build script
├── test.sh                        # Test script
└── deploy.sh                      # Deployment script
```

---

## Tests (`tests/`)

Integration and end-to-end tests.

```
tests/
├── integration/
│   ├── chat.test.ts               # Chat endpoint tests
│   ├── models.test.ts             # Model config tests
│   └── integrations.test.ts       # Integration loading tests
├── e2e/
│   └── user-flow.test.ts          # End-to-end user workflows
└── fixtures/
    └── sample-data.json           # Test fixtures
```

---

## Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | pnpm workspace root config |
| `pnpm-workspace.yaml` | Defines workspace packages |
| `tsconfig.json` | TypeScript configuration (all packages) |
| `docker-compose.yml` | Multi-service Docker setup |
| `.env` | Environment variables (not version controlled) |
| `.env.example` | Environment variables template |
| `.gitignore` | Git ignore patterns |
| `start.ps1` | Windows quick-start script |
| `stop.ps1` | Windows quick-stop script |

---

## Key Interdependencies

### Dependency Graph

```
UI (Next.js)
  ├─> Gateway API (port 18789)
  │    └─> Agent Worker (port 18790)
  │         ├─> Integrations (/community)
  │         ├─> Skills (/skills)
  │         └─> LLM Providers (Claude, GPT, etc.)
  │
  └─> Python Daemon (spawned locally)
       └─> Browser Automation (Playwright)
```

### Data Flow

1. **User Input** → UI (Next.js)
2. **HTTP Request** → Gateway API (port 18789)
3. **Session Lookup** → SQLite Database
4. **Task Dispatch** → Agent Worker (port 18790)
5. **Tool Execution** → Integrations + Skills
6. **LLM Inference** → Claude, GPT, or other provider
7. **Response Stream** → UI (Server-Sent Events)

---

## How to Find Things

### "I want to understand how chat works"
- Start: [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) - Data Flow section
- Read: `apps/ui/app/api/chat/stream/route.ts` - Chat endpoint
- Read: `apps/gateway/src/api/chat.ts` - Gateway chat handler
- Read: `apps/agent/ag3nt_agent/worker.py` - Worker processing

### "I want to add a new LLM provider"
- Read: `apps/agent/ag3nt_agent/model_config.py` - Provider setup
- Reference: `community/claude/` or `community/openai/` - Integration example
- See: [CONFIGURATION.md](CONFIGURATION.md) - Provider configuration

### "I want to create a custom skill"
- Start: [SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md)
- Reference: `skills/example-skill/` - Template skill
- Reference: `skills/web-research/SKILL.md` - Real skill example

### "I want to add a new integration (Stripe, Slack, etc.)"
- Start: [COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md)
- Reference: `community/stripe/` - Integration example
- Template: Use `community/example-integration/` if available

### "I want to deploy with Docker"
- Read: `docker-compose.yml` - Service definitions
- Read: `apps/gateway/Dockerfile` - Gateway image
- Read: `apps/agent/Dockerfile` - Agent image
- See: [DEPLOYMENT.md](DEPLOYMENT.md)

### "I want to understand the database schema"
- Read: `apps/gateway/src/services/DatabaseService.ts` - Schema definition
- Files: `apps/gateway/src/migrations/` - Database migrations (if any)

### "I want to run tests"
- See: [CONTRIBUTING.md](CONTRIBUTING.md) - Testing section
- Unit Tests: `apps/gateway/src/**/*.test.ts`, `apps/agent/tests/`
- Integration Tests: `tests/integration/`
- E2E Tests: `tests/e2e/` or `apps/ui/playwright/`

---

## Common Development Tasks

### Clone and Build from Scratch
```bash
git clone https://github.com/YOUR_ORG/AG3NT.git
cd AG3NT-main
pnpm install
pnpm build
```

### Start Dev Environment
```bash
./start.ps1  # Windows
# or manually in 3 terminals:
# Terminal 1: cd apps/gateway && pnpm dev
# Terminal 2: cd apps/agent && python -m ag3nt_agent.worker
# Terminal 3: cd apps/ui && pnpm dev
```

### Add a New Integration
1. Create `community/my-service/`
2. Create `package.json`, `index.ts`, `README.md`
3. Export tool definitions
4. Test with `apps/agent` tool loading

### Add a New Skill
1. Create `skills/my-skill/`
2. Create `SKILL.md`, `index.ts`, `package.json`
3. Reference in agent configuration
4. Test in UI

### Run Tests
```bash
pnpm test              # All tests
pnpm test:watch       # Watch mode
pnpm test:integration # Integration tests only
```

---

## Next Steps

- **Setup**: Follow [GETTING_STARTED.md](GETTING_STARTED.md)
- **Architecture**: Deep-dive [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
- **Contributions**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

