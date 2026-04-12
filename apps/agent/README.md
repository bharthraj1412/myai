# AG3NT Agent Worker

Python AI runtime using DeepAgents for LLM inference, tool execution, and integration orchestration.

## Quick Overview

| Aspect | Details |
|--------|---------|
| **Language** | Python 3.10+ |
| **Port** | 18790 (configurable) |
| **Role** | AI worker processing messages, executing tools/skills, integrations |
| **Key Features** | Multi-model support, tool execution, integration loading, browser automation |
| **Runtime** | ~1-2s startup, variable memory based on model/tasks |

---

## Prerequisites

- **Python** 3.10 or higher
- **pip** or **poetry** (for dependency management)
- .**venv** (virtual environment)
- **Gateway** running on port 18789

---

## Installation

### 1. Create & Activate Virtual Environment

```bash
cd apps/agent

# Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux/Mac (Bash):
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
# Poetry (preferred):
poetry install

# Or pip:
pip install -e .
pip install -r requirements.txt

# Optional (for development):
pip install pytest pytest-asyncio black mypy
```

### 3. Set Environment Variables

Create `.env` in repo root:

```bash
# LLM Provider
AG3NT_MODEL_PROVIDER=anthropic          # anthropic, openai, openrouter, etc.
AG3NT_MODEL_NAME=claude-3-5-sonnet      # Model name
ANTHROPIC_API_KEY=sk_ant_...            # Anthropic key (if using Claude)
OPENAI_API_KEY=sk_...                   # OpenAI key (if using GPT)
OPENROUTER_API_KEY=sk_...               # OpenRouter key

# Worker Configuration
AG3NT_AGENT_PORT=18790
AG3NT_AGENT_HOST=127.0.0.1
AG3NT_GATEWAY_URL=http://127.0.0.1:18789

# Python
PYTHONUNBUFFERED=1
```

---

## Running

### Development Mode

```bash
cd apps/agent

# Activate venv first
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows

# Start worker
python -m ag3nt_agent.worker

# Output:
# Agent listening on 0.0.0.0:18790
# LLM Provider: anthropic (Claude 3.5 Sonnet)
# Tools loaded: 370 integrations
# Ready for requests
```

### Production Mode

```bash
python -m ag3nt_agent.worker --config /etc/ag3nt/config.yaml
```

### Docker

```bash
docker build -f apps/agent/Dockerfile -t ag3nt-agent .
docker run -p 18790:18790 \
  -e ANTHROPIC_API_KEY=sk_ant_... \
  -e AG3NT_MODEL_PROVIDER=anthropic \
  ag3nt-agent
```

---

## Model Provider Configuration

The agent worker supports multiple LLM providers. Configure via environment variables:

### Supported Providers

| Provider | Env Var | Model Env | API Key Env |
|----------|---------|-----------|------------|
| **Anthropic (Claude)** | `anthropic` | `AG3NT_MODEL_NAME` | `ANTHROPIC_API_KEY` |
| **OpenAI (GPT)** | `openai` | `AG3NT_MODEL_NAME` | `OPENAI_API_KEY` |
| **OpenRouter** | `openrouter` | `AG3NT_MODEL_NAME` | `OPENROUTER_API_KEY` |
| **Kimi (Moonshot)** | `kimi` | `AG3NT_MODEL_NAME` | `KIMI_API_KEY` |
| **Google Gemini** | `google` | `AG3NT_MODEL_NAME` | `GOOGLE_API_KEY` |
| **Groq** | `groq` | `AG3NT_MODEL_NAME` | `GROQ_API_KEY` |

### Anthropic (Claude) - Recommended

```bash
export AG3NT_MODEL_PROVIDER=anthropic
export AG3NT_MODEL_NAME=claude-3-5-sonnet
export ANTHROPIC_API_KEY=sk_ant_your_key_here
```

**Get API Key**: https://console.anthropic.com/keys

**Popular Models**:
- `claude-3-5-sonnet` (Latest, recommended)
- `claude-3-5-haiku` (Faster, lower cost)
- `claude-3-opus` (Most capable)

### OpenAI (GPT)

```bash
export AG3NT_MODEL_PROVIDER=openai
export AG3NT_MODEL_NAME=gpt-4o
export OPENAI_API_KEY=sk_your_key_here
```

**Get API Key**: https://platform.openai.com/account/api-keys

**Popular Models**:
- `gpt-4o` (Latest, multimodal)
- `gpt-4-turbo`
- `gpt-3.5-turbo` (Faster, lower cost)

### OpenRouter (Access to Multiple Models)

```bash
export AG3NT_MODEL_PROVIDER=openrouter
export AG3NT_MODEL_NAME=anthropic/claude-3.5-sonnet
export OPENROUTER_API_KEY=sk_your_key_here
```

**Get API Key**: https://openrouter.ai/keys

**Popular Models** (via OpenRouter):
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-3-opus`
- `openai/gpt-4o`
- `openai/gpt-4-turbo`
- `google/gemini-pro-1.5`
- `meta-llama/llama-3.1-405b-instruct`
- `moonshotai/kimi-k2.5` (Chinese LLM)
- `deepseek/deepseek-chat` (Open-source)

**Full List**: https://openrouter.ai/models

### Kimi (Moonshot AI) - Chinese Optimized

```bash
export AG3NT_MODEL_PROVIDER=kimi
export AG3NT_MODEL_NAME=moonshot-v1
export KIMI_API_KEY=your_key_here
```

---

## Architecture

### Directory Structure

```
apps/agent/
├── ag3nt_agent/
│   ├── __init__.py
│   ├── worker.py                  # Entry point, runs on port 18790
│   │   - Receives messages from Gateway
│   │   - Coordinates inference and tool execution
│   │   - Returns response chunks
│   ├── model_config.py            # LLM provider setup
│   │   - Detects AG3NT_MODEL_PROVIDER
│   │   - Loads appropriate SDK (anthropic, openai, etc.)
│   │   - Configures API credentials
│   │   - Handles model-specific parameters
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── integrations.py        # Load 370+ community integrations
│   │   ├── skills.py              # Execute SKILL.md modules
│   │   ├── browser.py             # Playwright web automation
│   │   └── definitions.py         # Tool schema definitions
│   ├── channels/
│   │   ├── slack.py               # Slack adapter (optional)
│   │   └── discord.py             # Discord adapter (optional)
│   ├── utils/
│   │   ├── logging.py             # Structured logging
│   │   ├── config.py              # Load and parse config files
│   │   ├── errors.py              # Custom exception types
│   │   └── validation.py          # Input validation
│   └── schema/
│       ├── message.py             # Message data types
│       ├── tool.py                # Tool definition types
│       └── response.py            # Response types
├── tests/
│   ├── test_worker.py
│   ├── test_model_config.py
│   ├── test_integration_loading.py
│   └── test_tools.py
├── .venv/                         # Python virtual environment
├── Dockerfile
├── pyproject.toml                 # Poetry dependencies
├── setup.py
├── requirements.txt
└── README.md
```

### Data Flow

```
Gateway Request (TCP on port 18790)
    ├─ { message, model, context, attachments }
    │
    ↓
Worker (worker.py)
    ├─ Parse request
    ├─ Load model provider config
    │
    ↓
LLM Provider (anthropic/openai/openrouter/etc.)
    ├─ Call LLM API with message + tools
    ├─ Receive streaming response
    ├─ Parse tool calls if present
    │
    ↓
Tool Execution
    ├─ Browser automation (Playwright)
    ├─ Integration tools (370+)
    ├─ Skills (web-research, file-manager, etc.)
    ├─ MCP servers
    │
    ↓
Response Stream
    ├─ Send chunks back to Gateway
    ├─ Gateway streams to UI/channels
    │
    ↓
Final Response
    ├─ Stored in session history
```

---

## Key Files Reference

### Entry Point
- **`ag3nt_agent/worker.py`** - Main worker process, listens on port 18790

### Configuration
- **`ag3nt_agent/model_config.py`** - Provider setup, credential loading, model initialization

### Tool Execution
- **`ag3nt_agent/tools/integrations.py`** - Dynamically loads 370+ integrations from `/community`
- **`ag3nt_agent/tools/skills.py`** - Loads and executes SKILL.md modules from `/skills`
- **`ag3nt_agent/tools/browser.py`** - Playwright-based web automation

### Data Types
- **`ag3nt_agent/schema/message.py`** - Message structure
- **`ag3nt_agent/schema/tool.py`** - Tool definition format
- **`ag3nt_agent/schema/response.py`** - Response structure

---

## Tool & Skill System

### Tools From Integrations

The worker automatically loads 370+ tools from the `/community` folder at startup:

```python
# Example: tools/integrations.py
def load_integrations():
    """Load all integration tools from /community"""
    integrations = {}
    for integration_dir in COMMUNITY_PATH.iterdir():
        # Each folder is an integration (stripe, slack, openai, etc.)
        # Load its index.ts or index.py as tool definitions
        tools = load_integration_tools(integration_dir)
        integrations.update(tools)
    return integrations
```

**Used by LLM**: When you ask the agent to "send a Slack message" or "charge a Stripe card", the LLM has these tools available.

### Skills

Skills are AI capabilities that can be enabled/disabled per session. They're loaded from `/skills`:

```python
# Example usage
from ag3nt_agent.tools.skills import load_skills

skills = load_skills()
# Available: app-launcher, web-research, file-manager, voice-tts, etc.

# Add selected skills to LLM tools
available_tools = {**integrations, **skills}
```

---

## Testing

### Run Unit Tests

```bash
# Activate venv first
source .venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=ag3nt_agent

# Run specific test
pytest tests/test_model_config.py
```

### Manual Testing

```bash
# Start worker
python -m ag3nt_agent.worker

# In another terminal, send a test request
curl -X POST http://localhost:18790/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What time is it?",
    "model": "claude-3-5-sonnet"
  }'
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'anthropic'"

**Solution**: Reinstall dependencies
```bash
pip install -e .
# or if using poetry:
poetry install
```

### Issue: API Key Not Found Error

**Check**:
```bash
# Verify key is in .env
cat .env | grep ANTHROPIC_API_KEY

# Verify env var is loaded
python -c "import os; print(os.environ.get('ANTHROPIC_API_KEY'))"
```

**Fix**:
```bash
# Set directly in shell (Windows PowerShell):
$env:ANTHROPIC_API_KEY = "sk_ant_your_key"

# Or Linux/Mac:
export ANTHROPIC_API_KEY=sk_ant_your_key
```

### Issue: Port 18790 Already in Use

**Solution**:
```bash
# Change port in .env
AG3NT_AGENT_PORT=18791

# Or kill existing process (Linux/Mac):
lsof -i :18790
kill -9 <PID>
```

### Issue: Worker Crashes Immediately

**Debug**:
```bash
# Enable verbose logging
DEBUG=ag3nt:* python -m ag3nt_agent.worker

# Check Python version
python --version  # Must be 3.10+

# Check dependency installation
pip list | grep anthropic
```

---

## Performance

### For Heavy Workloads

1. **Increase Timeout**: `PYTHONASYNCIO_DEBUG=1`
2. **Use Faster Model**: Switch to GPT-3.5 or Kimi for speed
3. **Cache Integrations**: Worker caches loaded tools per session
4. **Monitor Memory**: `python -m memory_profiler -m ag3nt_agent.worker`

---

## Deployment

### Local Development

```bash
python -m ag3nt_agent.worker
```

### Systemd Service (Linux)

```ini
[Unit]
Description=AG3NT Agent Worker
After=network.target

[Service]
Type=simple
User=ag3nt
WorkingDirectory=/opt/ag3nt
ExecStart=/opt/ag3nt/apps/agent/.venv/bin/python -m ag3nt_agent.worker
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Docker (Production)

```bash
docker run -d \
  --name ag3nt-agent \
  -p 18790:18790 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  ag3nt-agent:latest
```

---

## Related Documentation

- **[PROJECT_ARCHITECTURE.md](../../PROJECT_ARCHITECTURE.md)** - System design
- **[GETTING_STARTED.md](../../GETTING_STARTED.md)** - Setup guide
- **[CONFIGURATION.md](../../CONFIGURATION.md)** - Configuration reference
- **[DEVELOPER.md](../../DEVELOPER.md)** - Maintainer reference
- **[SKILLS_FRAMEWORK.md](../../SKILLS_FRAMEWORK.md)** - Creating skills
- **[COMMUNITY_INTEGRATIONS.md](../../COMMUNITY_INTEGRATIONS.md)** - Creating integrations

---

## Dependencies

Key Python packages:
- **anthropic** - Claude API client
- **openai** - OpenAI API client
- **httpx** - Async HTTP client
- **pydantic** - Data validation
- **playwright** - Browser automation
- **python-dotenv** - Environment variable loading

See `requirements.txt` or `pyproject.toml` for full list.
Kimi provides powerful models with large context windows:

```bash
export AG3NT_MODEL_PROVIDER=kimi
export AG3NT_MODEL_NAME=moonshot-v1-128k  # or moonshot-v1-32k, moonshot-v1-8k
export KIMI_API_KEY=your_key_here
```

Get your Kimi API key from: https://platform.moonshot.cn/

Available Kimi models:
- `moonshot-v1-128k` - 128K context window (recommended)
- `moonshot-v1-32k` - 32K context window
- `moonshot-v1-8k` - 8K context window
- `kimi-latest` - Latest model version

#### Google Gemini
```bash
export AG3NT_MODEL_PROVIDER=google
export AG3NT_MODEL_NAME=gemini-pro
export GOOGLE_API_KEY=your_key_here
```

## Running the Worker

```bash
cd apps/agent
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m ag3nt_agent.worker
```

The worker will start on `http://127.0.0.1:18790`

## API Endpoints

### Health Check
```
GET /health
```

### Run Turn
```
POST /turn
Content-Type: application/json

{
  "session_id": "unique-session-id",
  "text": "User message here",
  "metadata": {}  // optional
}
```

Response:
```json
{
  "session_id": "unique-session-id",
  "text": "Agent response here",
  "events": [
    {
      "tool_name": "tool_name",
      "input": {},
      "status": "completed"
    }
  ],
  "interrupt": null  // or InterruptInfo if approval required
}
```

### Resume Turn (HITL Approval)
Resume an interrupted turn after user approval/rejection.

```
POST /resume
Content-Type: application/json

{
  "session_id": "unique-session-id",
  "decisions": [
    { "type": "approve" }  // or { "type": "reject" }
  ]
}
```

Response:
```json
{
  "session_id": "unique-session-id",
  "text": "Agent response after approval",
  "events": [...],
  "interrupt": null  // or another InterruptInfo if more approvals needed
}
```

**Note:** The `interrupt` field in responses contains details about pending actions requiring approval. Each decision in the `decisions` array corresponds to one pending action.

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| DeepAgents integration | ✅ Done | Full agent runtime with planning |
| Multi-model providers | ✅ Done | Anthropic, OpenAI, OpenRouter, Kimi, Google |
| Skills loader bridge | ✅ Done | SKILL.md parsing and indexing |
| Memory persistence | ✅ Done | TodoListMiddleware for task tracking |
| HITL approval flow | ✅ Done | Interrupt/resume for sensitive actions |
| Tool registry | ⏳ Partial | Core tools available, extensible |
| Streaming responses | 📋 Planned | Future enhancement |
| Sub-agents | ✅ Done | Researcher and Coder sub-agents |
