# AG3NT Configuration Guide

Complete reference for configuring AG3NT components, integrations, and deployment.

---

## Configuration Overview

AG3NT loads configuration from multiple sources (in priority order):

1. **Environment Variables** (highest priority) - `.env` file
2. **Config File** (`~/.ag3nt/config.yaml`) - User configuration
3. **Default Config** (`config/default-config.yaml`) - Built-in defaults
4. **Hardcoded Defaults** (lowest priority) - In code

**Example**: Setting `AG3NT_GATEWAY_PORT=18900` in `.env` overrides the default port 18789.

---

## Environment Variables

### Core Setup

```bash
# LLM Provider (required)
AG3NT_MODEL_PROVIDER=anthropic        # anthropic, openai, openrouter, google, groq
AG3NT_MODEL_NAME=claude-3-5-sonnet    # Model name
AG3NT_MODEL_TEMPERATURE=0.7           # 0.0 (deterministic) to 1.0 (creative)
AG3NT_MODEL_MAX_TOKENS=4096           # Max tokens in response

# API Keys (required for chosen provider)
ANTHROPIC_API_KEY=sk_ant_...          # Anthropic Claude
OPENAI_API_KEY=sk_...                 # OpenAI GPT
OPENROUTER_API_KEY=sk_...             # OpenRouter (multi-model)
GOOGLE_API_KEY=...                    # Google Gemini
GROQ_API_KEY=...                      # Groq
KIMI_API_KEY=...                       # Kimi (Moonshot)

# OpenAI-compatible custom endpoint (for NVIDIA or local gateways)
AG3NT_CUSTOM_MODEL_URL=https://integrate.api.nvidia.com/v1
AG3NT_CUSTOM_MODEL_NAME=qwen/qwen3-coder-480b-a35b-instruct
AG3NT_CUSTOM_API_KEY=...              # NVIDIA API key or other compatible key
```

### Server Ports

```bash
# Gateway (HTTP + WebSocket daemon)
AG3NT_GATEWAY_PORT=18789              # Default: 18789
AG3NT_GATEWAY_HOST=127.0.0.1          # Default: 127.0.0.1
AG3NT_GATEWAY_URL=http://127.0.0.1:18789

# Agent Worker (Python inference engine)
AG3NT_AGENT_PORT=18790                # Default: 18790
AG3NT_AGENT_HOST=127.0.0.1            # Default: 127.0.0.1
AG3NT_AGENT_URL=http://127.0.0.1:18790

# Web Dashboard
PORT=3000                             # Default: 3000 (for apps/ui)

# Browser Automation WebSocket
AG3NT_BROWSER_WS_PORT=9222            # Default: 9222
```

### Database

```bash
# SQLite Database Location
AG3NT_DB_PATH=~/.ag3nt/data.db        # Default: ~/.ag3nt/data.db
AG3NT_DB_TIMEOUT=5000                 # Query timeout in ms
AG3NT_DB_POOL_SIZE=10                 # Connection pool size
```

### Feature Flags

```bash
# Enable/disable features
ENABLE_AUDIO_INPUT=true               # Speech recognition
ENABLE_ARTIFACTS=true                 # Artifact library
ENABLE_MCP_SERVERS=true               # MCP server support
ENABLE_BASH_MODE=true                 # TUI bash mode
ENABLE_SLASH_COMMANDS=true            # TUI slash commands

# Approval workflow (HITL)
REQUIRE_APPROVAL_FOR_TOOLS=false      # Require user approval for tool execution
APPROVAL_TIMEOUT_MS=300000            # Timeout for approval (5 min)
```

### Channel Configuration

```bash
# Slack
SLACK_BOT_TOKEN=xoxb-...              # Slack bot token
SLACK_SIGNING_SECRET=...              # Signing secret for verification

# Discord
DISCORD_BOT_TOKEN=...                 # Discord bot token
DISCORD_INTENTS=32509                 # Message content intent

# Telegram
TELEGRAM_BOT_TOKEN=...                # Telegram bot token

# Email
SMTP_SERVER=smtp.gmail.com            # SMTP server
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=...                     # App password (not regular password)
```

### Development

```bash
# Environment
NODE_ENV=development                  # development, production
PYTHONUNBUFFERED=1                    # Python output buffering

# Logging
DEBUG=ag3nt:*                         # Enable debug logging
LOG_LEVEL=debug                       # debug, info, warn, error
LOG_FORMAT=json                       # json, text

# UI/UX
NEXT_PUBLIC_DEBUG=false               # UI debug mode
NEXT_PUBLIC_AG3NT_GATEWAY_URL=http://127.0.0.1:18789
```

---

## Configuration File (`~/.ag3nt/config.yaml`)

The YAML configuration file provides granular control:

```yaml
# Core Settings
app_name: AG3NT
version: 0.1.0
environment: development

# LLM Configuration
llm:
  provider: anthropic                # anthropic, openai, openrouter, etc.
  model_name: claude-3-5-sonnet      # Model name
  temperature: 0.7                   # 0.0-1.0
  max_tokens: 4096
  context_window: 200000

# Gateway Configuration
gateway:
  port: 18789
  host: 127.0.0.1
  cors_origin: '*'
  enable_helmet: true                # Security headers

  # Session Management
  session:
    duration_ms: 3600000             # 1 hour
    auto_save: true
    persistence: sqlite              # sqlite, postgres

  # Database
  database:
    type: sqlite
    path: ~/.ag3nt/data.db
    pool_size: 10
    timeout_ms: 5000

# Agent Worker Configuration
agent:
  port: 18790
  host: 127.0.0.1
  
  # Tool/Integration Configuration
  tools:
    max_concurrent: 5               # Max parallel tool execution
    timeout_ms: 30000               # Tool execution timeout
    retry_count: 3                  # Retries on failure

# Channel Adapters
channels:
  slack:
    enabled: false
    bot_token: ${SLACK_BOT_TOKEN}
    signing_secret: ${SLACK_SIGNING_SECRET}

  discord:
    enabled: false
    bot_token: ${DISCORD_BOT_TOKEN}
    
  telegram:
    enabled: false
    bot_token: ${TELEGRAM_BOT_TOKEN}

# Feature Flags
features:
  audio_input: true
  artifacts: true
  mcp_servers: true
  approval_workflow: false
  
  # Browser Automation
  browser_automation:
    enabled: true
    headless: true
    timeout_ms: 30000

# Logging
logging:
  level: info                        # debug, info, warn, error
  format: json                       # json, text
  output:
    - console
    - file: ~/.ag3nt/logs/agent.log

# Security
security:
  enable_https: false               # Enable HTTPS (requires cert)
  enable_cors: true                 # Cross-origin requests
  api_key_required: false           # Require API key for endpoints
  rate_limit:
    enabled: true
    max_requests_per_minute: 60
```

---

## Setting Up by Use Case

### Basic Local Development

```bash
# 1. Create .env in repo root
echo "ANTHROPIC_API_KEY=sk_ant_your_key" > .env
echo "AG3NT_MODEL_PROVIDER=anthropic" >> .env

# 2. Copy config
cp config/default-config.yaml ~/.ag3nt/config.yaml

# 3. Start services
./start.ps1  # Windows
# Or manually start 3 terminals for Gateway, Agent, UI

# 4. Access UI
# Open http://localhost:3000
```

### Production Deployment

```yaml
# ~/.ag3nt/config.yaml
environment: production
app_name: AG3NT Production

gateway:
  port: 80                          # Use standard HTTP port
  enable_helmet: true               # Security headers

agent:
  port: 8001                        # Non-standard port

security:
  enable_https: true                # Use HTTPS
  api_key_required: true            # Require auth

logging:
  level: info                       # Not debug
  output:
    - file: /var/log/ag3nt/agent.log
```

### Multi-User Deployment (Kubernetes)

```yaml
# ~/.ag3nt/config.yaml
gateway:
  port: 3000
  session:
    persistence: postgres          # Use PostgreSQL for persistence
    
  database:
    type: postgres
    host: postgres.example.com
    port: 5432
    database: ag3nt
    user: ag3nt_user
    password: ${DB_PASSWORD}

agent:
  port: 5000
  tools:
    max_concurrent: 20             # Support more concurrent users

security:
  enable_https: true
  api_key_required: true
  rate_limit:
    max_requests_per_minute: 1000  # Higher limit for server
```

---

## Switching LLM Providers

### Switch to OpenAI GPT-4

```bash
# Option 1: .env
export AG3NT_MODEL_PROVIDER=openai
export AG3NT_MODEL_NAME=gpt-4o
export OPENAI_API_KEY=sk_your_key

# Option 2: config.yaml
llm:
  provider: openai
  model_name: gpt-4o

# Option 3: CLI (if supported)
./agent --model openai:gpt-4o --api-key sk_...

```

### Switch to NVIDIA's OpenAI-Compatible API

```bash
# Option 1: .env
export AG3NT_MODEL_PROVIDER=custom
export AG3NT_CUSTOM_MODEL_URL=https://integrate.api.nvidia.com/v1
export AG3NT_CUSTOM_MODEL_NAME=qwen/qwen3-coder-480b-a35b-instruct
export AG3NT_CUSTOM_API_KEY=nvapi_your_key

# Option 2: direct OpenAI-compatible SDK usage
export OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
export OPENAI_API_KEY=nvapi_your_key
```

### Switch to OpenRouter (Many Models)

OpenRouter provides unified access to many models:

```bash
export AG3NT_MODEL_PROVIDER=openrouter
export AG3NT_MODEL_NAME=anthropic/claude-3.5-sonnet  # Claude via OpenRouter
export OPENROUTER_API_KEY=sk_your_key

# Or other models:
# - moonshotai/kimi-k2.5
# - openai/gpt-4o
# - google/gemini-pro-1.5
# - meta-llama/llama-3.1-405b
```

### Switch to Kimi (Chinese LLM)

```bash
export AG3NT_MODEL_PROVIDER=kimi
export AG3NT_MODEL_NAME=moonshot-v1
export KIMI_API_KEY=your_key
```

---

## Integration Configuration

### Enable Slack Integration

```yaml
# ~/.ag3nt/config.yaml
channels:
  slack:
    enabled: true
    bot_token: ${SLACK_BOT_TOKEN}
    signing_secret: ${SLACK_SIGNING_SECRET}
```

```bash
# .env
SLACK_BOT_TOKEN=xoxb-1234567890...
SLACK_SIGNING_SECRET=abcd1234...
```

**Steps**:
1. Create Slack App: https://api.slack.com/apps
2. Add "Chat" scopes
3. Copy Bot Token → `SLACK_BOT_TOKEN`
4. Copy Signing Secret → `SLACK_SIGNING_SECRET`
5. Set Webhook URL in Slack app settings to `https://your-domain.com/slack/events`

### Enable Discord Integration

```yaml
channels:
  discord:
    enabled: true
    bot_token: ${DISCORD_BOT_TOKEN}
```

```bash
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN
```

**Steps**:
1. Create Discord App: https://discord.com/developers/applications
2. Generate Bot Token
3. Copy to `DISCORD_BOT_TOKEN`

---

## Performance Tuning

### For High Load

```yaml
gateway:
  session:
    persistence: postgres          # Distributed persistence

agent:
  tools:
    max_concurrent: 20             # Handle more concurrent requests
    timeout_ms: 60000              # Longer timeout for complex operations

database:
  pool_size: 50                    # Larger connection pool

logging:
  level: warn                      # Reduce I/O
```

### For Low Resource Machines

```yaml
agent:
  tools:
    max_concurrent: 2              # Fewer concurrent tasks
    timeout_ms: 10000              # Shorter timeout

database:
  pool_size: 2                     # Smaller pool

logging:
  level: error                     # Minimal logging
```

---

## Validation

Check your configuration with:

```bash
# Validate .env
cat .env | grep -E "^[A-Z_]+=" | wc -l  # Should see all set vars

# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('~/.ag3nt/config.yaml'))"

# Test connectivity
curl http://localhost:18789/api/health
curl http://localhost:18790/health
```

---

## Common Issues

**Q: "API key not found"**
A: Verify key is in `.env` and env var is loaded

```bash
echo $ANTHROPIC_API_KEY        # Should not be empty
cat .env | grep ANTHROPIC      # Should see the key
```

**Q: "Port already in use"**
A: Change port in `.env`:
```bash
AG3NT_GATEWAY_PORT=18900
AG3NT_AGENT_PORT=18901
```

**Q: "Database locked"**
A: Increase timeout in config:
```yaml
database:
  timeout_ms: 10000
```

---

## Related Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Initial setup
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues

