# AG3NT
<img src=".github/images/AG3NT_header.png" alt="AG3NT" width="100%"/>





Local-first personal AI agent platform built on DeepAgents with PAI-inspired architecture.

> **v2.0** — Rebuilt from the ground up using [Personal AI Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure) patterns: Algorithm Engine, Memory System, Hook Lifecycle, Agent Personalities, and TELOS goal alignment.

## Features

- ♻️ **Algorithm Engine** - 7-phase task execution (Observe→Think→Plan→Build→Execute→Verify→Learn) with ISC criteria
- 🧠 **Memory System** - Persistent learning across sessions (WORK, LEARNING, RESEARCH, SIGNALS)
- 🎣 **Hook System** - 10 event-driven lifecycle hooks (security, rating capture, learning, voice)
- 🤖 **8 Agent Personalities** - Algorithm, Engineer, Architect, Researcher, Designer, QA, Security, Browser
- 🧭 **TELOS Life OS** - 10 goal files (Mission, Goals, Projects, Beliefs, Strategies, Models, Learned, Challenges, Ideas, Narratives)
- 🤖 **Multi-Model Support** - Anthropic, OpenAI, OpenRouter, Kimi, Google Gemini
- 🔌 **Multi-Channel** - CLI, TUI, Telegram, Discord adapters
- 🛠️ **Canonical Skill System** - PAI-format SKILL.md with USE WHEN triggers, workflow routing, TitleCase naming
- 🌐 **Browser Control** - Playwright-based web automation (navigate, screenshot, click, fill)
- 🔒 **Security** - SecurityValidator hooks, sensitive path protection, HITL approval
- ⏰ **Scheduler** - Heartbeat checks and cron-based automation
- 🖥️ **Multi-Node** - Primary + companion device architecture
- 📊 **Rating System** - Explicit 1-10 rating capture with trend analysis

## Repo Layout

```
ag3nt/
├── apps/
│   ├── gateway/     # Gateway daemon (HTTP + WS + Hook Manager)
│   ├── agent/       # Agent worker (DeepAgents + Algorithm Engine)
│   ├── ui/          # Web dashboard (Next.js + PAI components)
│   └── tui/         # Terminal UI client
├── agents/          # 🆕 Agent personality .md files (8 specialists)
├── hooks/           # 🆕 Event-driven lifecycle hooks (10 hooks)
│   ├── lib/         #     Shared utilities (hook-io, identity, time, events)
│   └── handlers/    #     Reusable handler functions
├── skills/          # Canonical Skills (TitleCase, SKILL.md format)
├── MEMORY/          # 🆕 Persistent memory system
│   ├── WORK/        #     Active task tracking (PRD.md files)
│   ├── LEARNING/    #     Categorized learnings + signals
│   ├── RESEARCH/    #     Agent output captures
│   ├── SECURITY/    #     Security audit events
│   └── STATE/       #     Runtime state (ephemeral)
├── USER/            # 🆕 Upgrade-safe user customizations
│   ├── TELOS/       #     10 goal files (Mission, Goals, Projects, etc.)
│   └── PREFERENCES.md
├── config/
│   └── settings.json # 🆕 Single source of truth (PAI-style)
├── community/       # 370+ community integrations
└── packages/        # Shared utilities
```

## 🖥️ Web Dashboard

The AP3X-UI provides a comprehensive web interface for AG3NT:

### Running the UI

**Windows (Unified Script - Recommended):**
```powershell
.\start.ps1
```
This starts Gateway, Agent Worker, and UI together. Access at http://localhost:3000

**Manual Start:**
```bash
# Terminal 1: Start AG3NT Gateway
cd apps/gateway && npm run dev

# Terminal 2: Start AG3NT Agent Worker
cd apps/agent && .venv/Scripts/activate && python -m ag3nt_agent.worker

# Terminal 3: Start UI Dashboard
cd apps/ui && npm run dev
```

Access the dashboard at http://localhost:3000

### UI Features
- Real-time chat with streaming
- Artifact library and management
- Skills and tools browser
- Subagent configuration
- MCP server manager
- Browser automation interface
- System monitoring and logs

## Quick Start

### Windows (One Command)
```powershell
# Start everything: Gateway + Agent + UI
.\start.ps1

# Stop all services
.\stop.ps1
```

### Manual Setup

#### 1. Copy Configuration
```bash
# Create config directory
mkdir -p ~/.ag3nt

# Copy default config
cp config/default-config.yaml ~/.ag3nt/config.yaml
```

#### 2. Start Gateway
```bash
cd apps/gateway
pnpm install
pnpm dev
```
Gateway runs on `http://127.0.0.1:18789`

#### 3. Start Agent Worker
```bash
cd apps/agent
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m ag3nt_agent.worker
```
Worker runs on `http://127.0.0.1:18790`

#### 4. Start Web UI
```bash
cd apps/ui
npm install
npm run dev
```
UI runs on `http://localhost:3000`

#### 5. Start TUI (Optional)
```bash
cd apps/tui
pip install -r requirements.txt
python ag3nt_tui.py
```

## Milestone Status

| Milestone | Status | Description |
|-----------|--------|-------------|
| M1: Core Agent Runtime | ✅ Complete | DeepAgents integration, multi-model support |
| M2: Modular Skill System | ✅ Complete | SKILL.md format, skill discovery, execution runtime, trigger matching |
| M3: Gateway & Multi-Channel | ✅ Complete | HTTP/WS API, Telegram/Discord adapters |
| M4: Planning & Memory | ✅ Complete | TodoListMiddleware, memory persistence |
| M5: Secure Execution | ✅ Complete | HITL approval flow, DM pairing security |
| M6: Scheduling | ✅ Complete | Heartbeat system, cron jobs |
| M7: Multi-Node | ✅ Complete | WebSocket protocol, pairing, capability routing |
| M8: Control Panel | ✅ Complete | Web UI, skill management, debug logs |

### Active Development

See [ROADMAP.md](docs/ROADMAP.md) for detailed sprint planning and current priorities:
- **Core Tools**: Shell execution, web search, git operations
- **Skill Execution**: Runtime for skill entrypoints, MCP integration
- **Testing**: Unit and E2E test coverage

## Documentation

- [Agent Worker](apps/agent/README.md) - Model providers and worker API
- [Web Dashboard](apps/ui/README.md) - Next.js web interface
- [TUI Client](apps/tui/README.md) - Terminal interface usage
- [Gateway API](apps/gateway/API.md) - HTTP/WebSocket API reference
- [Control Panel](apps/gateway/src/ui/README.md) - Web-based control panel
- [Multi-Node Architecture](apps/gateway/src/nodes/README.md) - Companion device support
- [Skills](skills/example-skill/SKILL.md) - Skill format documentation

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AG3NT_MODEL_PROVIDER` | LLM provider (anthropic, openai, openrouter, kimi, google) | `openrouter` |
| `AG3NT_MODEL_NAME` | Model name | `moonshotai/kimi-k2.5` |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENROUTER_API_KEY` | OpenRouter API key | - |
| `KIMI_API_KEY` | Kimi/Moonshot API key | - |
| `GOOGLE_API_KEY` | Google Gemini API key | - |
| `AG3NT_CUSTOM_MODEL_URL` | OpenAI-compatible endpoint URL | - |
| `AG3NT_CUSTOM_MODEL_NAME` | Custom model name for compatible endpoints | - |
| `AG3NT_CUSTOM_API_KEY` | API key for custom compatible endpoints | - |

## License

MIT
