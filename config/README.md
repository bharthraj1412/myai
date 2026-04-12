# Configuration Directory (`config/`)

Configuration templates and default settings for AG3NT.

---

## Files

### default-config.yaml

Default configuration template. Copy to `~/.ag3nt/config.yaml` for local setup:

```bash
cp config/default-config.yaml ~/.ag3nt/config.yaml
```

**Contains**:
- Gateway configuration (ports, host, database)
- Agent worker configuration (model provider, API keys)
- Channel adapters (Slack, Discord, Telegram)
- Feature flags
- Logging settings

---

### goals/ Folder

Pre-built goal templates for agent sessions.

**Available templates**:
- `research.yaml` - Research task template
- `automation.yaml` - Automation task template
- (additional goal templates)

---

## Configuration Hierarchy

AG3NT loads configuration in this order (later overrides earlier):

1. **default-config.yaml** (this folder) - Built-in defaults
2. **~/.ag3nt/config.yaml** - User configuration
3. **.env** file - Environment variable overrides
4. **CLI arguments** - Command-line parameter overrides

Example:

```bash
# .env can override config.yaml:
AG3NT_GATEWAY_PORT=18800              # Override default 18789
AG3NT_MODEL_PROVIDER=openai            # Override default provider

# CLI can override further:
./start.ps1 --port 8000                # Override to port 8000
```

---

## Common Configuration

See [CONFIGURATION.md](../CONFIGURATION.md) for detailed configuration reference.

Quick examples:

### Switch LLM Provider

**Option 1: Edit config.yaml**
```yaml
agent:
  model:
    provider: openai
    name: gpt-4o
  credentials:
    OPENAI_API_KEY: sk_...
```

**Option 2: Set environment**
```bash
export AG3NT_MODEL_PROVIDER=openai
export AG3NT_MODEL_NAME=gpt-4o
export OPENAI_API_KEY=sk_...
```

### Enable Channels

**In config.yaml**:
```yaml
channels:
  slack:
    enabled: true
    botToken: xoxb-...
  discord:
    enabled: true
    botToken: ...
```

### Configure Port

**In .env**:
```bash
AG3NT_GATEWAY_PORT=18900
AG3NT_AGENT_PORT=18901
```

---

## Related Documentation

- **[CONFIGURATION.md](../CONFIGURATION.md)** - Full configuration guide
- **[GETTING_STARTED.md](../GETTING_STARTED.md)** - Setup instructions
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Production setup

