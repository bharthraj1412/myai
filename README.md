<div align="center">
  <img src=".github/images/AG3NT_header.png" alt="AG3NT AI" width="100%"/>

  # AG3NT: Personal AI Infrastructure
  
  **Your Local-First, Highly Extensible Autonomous AI Platform**

  [![GitHub Repo](https://img.shields.io/badge/Repository-bharthraj1412%2Fmyai-blue?style=flat-square&logo=github)](https://github.com/bharthraj1412/myai)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
</div>

---

**myai (AG3NT)** is a production-grade, local-first personal AI assistant ecosystem. Born from a fusion of **DeepAgents** and the widely acclaimed **Personal AI Infrastructure (PAI)** patterns, it is built to be your intelligent digital twin—understanding your workflows, persistently improving through memory, and executing complex multi-step tasks across browsers, APIs, and local systems.

> 🚀 **v2.0 (The PAI Rebuild)** brings a full rewrite featuring the **Algorithm Engine**, structured **Memory Systems**, dynamic **Hook Lifecycles**, specialized **Agent Personalities**, and **TELOS** goal alignment constraints.

---

## ✨ Key Capabilities

<details open>
<summary><b>🧠 Advanced AI Architecture</b></summary>

- **Algorithm Engine**: Features a rigorous 7-phase execution loop (`Observe → Think → Plan → Build → Execute → Verify → Learn`).
- **8 Agent Personalities**: Specialized execution contexts including Algorithm, Engineer, Architect, Researcher, Designer, QA, Security, and Browser automation agents.
- **Dynamic Multi-Model Support**: Easily switch between **Anthropic, OpenAI, OpenRouter, Kimi, Google Gemini**, and custom **NVIDIA APIs** locally.
- **Memory & Context**: Highly structured persistent file memory routing (`WORK`, `LEARNING`, `RESEARCH`, `SIGNALS`).

</details>

<details open>
<summary><b>🔌 Extensibility & Integration</b></summary>

- **Hook System**: 10 event-driven lifecycle hooks enabling strict security checks, automated learning capture, and voice interfaces.
- **Canonical Skill System**: Native `SKILL.md` workflows supporting TitleCase naming, `USE WHEN` contextual triggers, and MCP integrations.
- **TELOS Life OS Integration**: Directly sync your assistant to your life goals (Mission, Goals, Projects, Beliefs, Strategies).
- **Multi-Node Deployment**: Connect multiple companion devices into the same unified AI brain.

</details>

<details open>
<summary><b>💻 Interfaces</b></summary>

- **Next.js Web Dashboard** (`apps/ui`): Comprehensive local dashboard for system logs, skill configuration, and state.
- **JARVIS Interface** (`JARVIS.html`): A stunning, standalone, ultra-low latency connection gateway powered entirely by browser-side caching—complete with multi-provider API configurations, connection aborts, and responsive context streaming.
- **Interactive Multi-Channel**: Adapters available for CLI, Terminal UI (TUI), Telegram, and Discord integration.

</details>

---

## 🏗️ System Architecture

AG3NT is structured as a robust monorepo:

### Workspace Layout
```text
AG3NT/
├── apps/
│   ├── gateway/     # Core communication daemon (HTTP + WS + Hooks)
│   ├── agent/       # Python Intelligence Worker (Algorithm Engine & Tool execution)
│   ├── ui/          # Next.js Web Dashboard interface
│   └── tui/         # Lightning-fast Terminal UI client
├── agents/          # Agent personality blueprints (.md)
├── hooks/           # Extensible middleware hooks for the system lifecycle
├── skills/          # Community and generated canonical skill libraries
├── MEMORY/          # Persistent hierarchical memory system storage
├── USER/            # High-priority user settings (Overrides & TELOS configurations)
└── config/          # Centralized configuration schema
```

---

## 🚀 Quick Start Guide

We provide an entirely unified setup script for Windows environments that compiles your React apps, scaffolds your Python virtual environments, and installs all dependencies sequentially. 

### ▶️ 1-Click Environment Boot (Recommended)
```powershell
# Drops you right into the AG3NT UI, Agent Engine, and Gateway simultaneously:
powershell -ExecutionPolicy Bypass -File .\start.ps1
```
Need to cleanly stop everything? Just run `powershell -ExecutionPolicy Bypass -File .\stop.ps1`.

### 🛠️ Manual Bootstrapping

If you're running on Linux/macOS or simply prefer isolated control, run the following:

**1. Boot the Application Gateway (Node.js)**
```bash
cd apps/gateway
pnpm install
pnpm dev
# Gateway deployed to http://127.0.0.1:18789
```

**2. Boot the Agent Engine (Python)**
```bash
cd apps/agent
python -m venv .venv

# Activate (Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt

# Start Uvicorn runtime for the Algorithm Engine
python -m uvicorn ag3nt_agent.worker:app --port 18790
# Agent deployed to http://127.0.0.1:18790
```

**3. Boot the User Interfaces**
*For the robust Dashboard:*
```bash
cd apps/ui
npm install
npm run dev
# Dashboard live at http://localhost:3000
```
*For the ultra-fast JARVIS interface:* Simply double-click `JARVIS.html` in your file explorer!

---

## 🔒 Environment Secrets & Configuration

To integrate with foundation models, load your credentials into `.env` (or via the UI configuration panel). 

| Variable | Description |
|----------|-------------|
| `AG3NT_MODEL_PROVIDER` | Defines the default active core processing engine (`openrouter`, `openai`, `anthropic`, `google`) |
| `AG3NT_MODEL_NAME` | Example fallback defaults depending on provider. |
| `OPENAI_API_KEY` | Your live OpenAI Key |
| `OPENROUTER_API_KEY` | Recommended. Provides access to 100+ models. |
| `AG3NT_CUSTOM_MODEL_URL`| Deploy custom local networks using this parameter (LMStudio / Ollama compatibility). |

---

## 📚 Advanced Documentation

To thoroughly explore the engineering capabilities, navigate to our core documentation files:
- [**The PAI Integration Report**](PAI_INTEGRATION_REPORT.md.resolved) - Rebuild context & decisions
- [**Agent Architecture**](apps/agent/README.md) - Deep dive into Algorithm mapping
- [**Developing Hooks**](DEVELOPER_FULL_GUIDE.md) - Writing custom event hooks
- [**Canonical Skills Framework**](SKILLS_FRAMEWORK.md) - Best practices on triggering workflows

---

<div align="center">
  <p>Built globally as part of the DeepAgents implementation track.</p>
  <p>Available under the <b>MIT License</b>.</p>
</div>
