# AG3NT Terminal UI (TUI)

Sleek, keyboard-driven terminal user interface for AG3NT.

## Quick Overview

| Aspect | Details |
|--------|---------|
| **Language** | TypeScript/Python (depending on implementation) |
| **UI Framework** | Textual (Python) or similar TUI framework |
| **Role** | Terminal-based interface for chat and configuration |
| **Key Features** | Keyboard navigation, markdown rendering, bash mode, slash commands |
| **Runtime** | Lightweight, ~10MB |

---

## Prerequisites

- **Python** 3.10 or higher (if Python-based)
- **Node.js** 18.x or higher (if TypeScript-based)
- **Gateway** running on port 18789
- **Agent Worker** running on port 18790

---

## Installation

### From Repository

```bash
cd apps/tui

# If Python-based:
pip install -e .
# or
pip install -r requirements.txt

# If Node.js-based:
pnpm install
```

---

## Running

### Start Prerequisites

Make sure Gateway and Agent Worker are running:

```bash
# Terminal 1: Start Gateway
cd apps/gateway && pnpm dev

# Terminal 2: Start Agent Worker
cd apps/agent && source .venv/bin/activate && python -m ag3nt_agent.worker

# Terminal 3: Start TUI
cd apps/tui
python ag3nt_tui.py  # or npm run start if TypeScript

# Or launch the local voice assistant directly
python -m apps.tui --assistant
```

### Development Mode

```bash
cd apps/tui

# Python-based:
python -m ag3nt_tui

# TypeScript-based:
pnpm dev

# Voice assistant mode
python -m apps.tui --assistant
```

### Production Mode

```bash
# Python-based:
python ag3nt_tui.py

# TypeScript-based:
pnpm build
pnpm start
```

---

## Features

### 💬 Rich Chat Interface

- **Markdown rendering** - Proper formatting of code blocks, bold, italic, etc.
- **Syntax highlighting** - Code syntax highlighting for popular languages
- **Message history** - Scrollable conversation history
- **Auto-scroll** - Latest messages auto-visible

### ⌨️ Keyboard Navigation

- **Arrow keys** - Navigate messages and menu items
- **Tab/Shift+Tab** - Switch between input box and chat
- **Enter** - Send message
- **Escape** - Clear input or exit menu
- **Page Up/Down** - Scroll through history

### 🔧 Bash Mode

Execute shell commands directly within TUI:

```
> !ls -la
> !ps aux | grep python
> !git status
```

Commands are executed in the local shell and results displayed.

### 📝 Slash Commands

Quick actions with `/` prefix:

| Command | Purpose |
|---------|---------|
| `/help` | Show available commands |
| `/clear` | Clear chat history |
| `/exit` | Exit TUI |
| `/model <name>` | Switch active model |
| `/config` | Show current configuration |
| `/skills` | List available skills |
| `/integrations` | List loaded integrations |

### 🔄 Auto-Session Management

- Automatic DM pairing for multi-device setups
- Session persistence (if configured)
- Resume interrupted conversations

### 🎙️ Local Voice Assistant Mode

Run AG3NT as a local voice-first assistant:

```bash
python -m apps.tui --assistant
```

Supported providers:

- `gateway` - use the local AG3NT stack
- `anthropic` - Claude
- `openai` - GPT models
- `openrouter` - multi-model provider access
- `groq` - OpenAI-compatible Groq models

Inside assistant mode:

- `voice` - listen using the microphone
- `text` - type a message
- `setup` - change provider, model, and API key
- `config` - show current assistant config
- `clear` - clear chat memory
- `exit` - quit assistant mode

---

## Configuration

### Environment Variables

```bash
# Gateway connection
AG3NT_GATEWAY_URL=http://127.0.0.1:18789
AG3NT_GATEWAY_PORT=18789

# Model selection
AG3NT_MODEL_NAME=claude-3-5-sonnet
AG3NT_MODEL_PROVIDER=anthropic

# TUI theme
AG3NT_TUI_THEME=dark            # dark, light
AG3NT_TUI_ACCENT=blue           # blue, green, magenta, etc.

# Features
ENABLE_BASH_MODE=true
ENABLE_SLASH_COMMANDS=true

# Local voice assistant
AG3NT_ASSISTANT_PROVIDER=gateway   # gateway, anthropic, openai, openrouter, groq
AG3NT_ASSISTANT_MODEL=claude-3-5-sonnet
AG3NT_ASSISTANT_VOICE_INPUT=true
AG3NT_ASSISTANT_VOICE_OUTPUT=true
```

### Configuration File

Create `~/.ag3nt/tui-config.yaml`:

```yaml
theme: dark
accent_color: blue
features:
  bash_mode: true
  slash_commands: true
  auto_scroll: true
gateway:
  url: http://127.0.0.1:18789
  timeout: 30
```

---

## Architecture

### Directory Structure

```
apps/tui/
├── src/  (if TypeScript) or ag3nt_tui/ (if Python)
│   ├── index.ts / __init__.py
│   ├── cli.ts / cli.py            # Command-line argument parser
│   ├── app.ts / app.py            # Main TUI application
│   ├── ui/
│   │   ├── chat.ts / chat.py       # Chat screen component
│   │   ├── input.ts / input.py     # Input box component
│   │   ├── status.ts / status.py   # Status bar
│   │   └── menu.ts / menu.py       # Menu/settings screen
│   ├── services/
│   │   ├── gateway.ts / gateway.py # Gateway API client
│   │   └── storage.ts / storage.py # Local history storage
│   ├── commands/
│   │   ├── slash.ts / slash.py     # Slash command handler
│   │   └── bash.ts / bash.py       # Bash mode handler
│   └── utils/
│       ├── format.ts / format.py   # Markdown/text formatting
│       └── logger.ts / logger.py   # Logging
├── tests/
│   └── integration.test.ts / .py
├── Dockerfile
├── package.json / pyproject.toml
└── README.md
```

### Data Flow

```
User Presses Key
    ↓
Input Buffer (chat-input)
    │
    ├─→ Slash Command? → Execute Slash Handler
    ├─→ Bash Command? (starts with !) → Execute Bash Handler
    └─→ Regular Message → Send to Gateway
         │
         ↓
    Gateway (HTTP POST /api/chat/stream)
         │
         ├─→ Agent Worker
         ├─→ LLM Processing
         └─→ Stream response events
              │
              ↓
    TUI Receives SSE Stream
         │
         ├─→ Update chat display
         ├─→ Render markdown
         ├─→ Auto-scroll to latest
         │
         ↓
    User Sees Response
```

---

## Usage Examples

### Basic Chat

```
> What's 2+2?
[Model thinking...]
The sum of 2 and 2 is 4.

> Generate Python code to read a CSV file
[Model generates code with syntax highlighting]

def read_csv(filepath):
    import csv
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            print(row)
```

### Bash Mode

```
> !pwd
/Users/agent

> !git log --oneline | head -5
a1b2c3d Most recent commit
d4e5f6g Previous commit
...

> !python --version
Python 3.10.11
```

### Voice Assistant Mode

```bash
# Start the local assistant controller
python -m apps.tui --assistant

# Example flow
>>> setup
>>> voice
>>> text
>>> config
>>> exit
```

### Switching Providers

```bash
# Claude
AG3NT_ASSISTANT_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key

# Local AG3NT gateway
AG3NT_ASSISTANT_PROVIDER=gateway
AG3NT_GATEWAY_URL=http://127.0.0.1:18789
```

### Slash Commands

```
> /model gpt-4o
Switched to model: GPT-4 Omni

> /skills
Available skills:
  - web-research
  - file-manager
  - app-launcher
  - voice-tts

> /integrations
Loaded integrations: 370+
```

---

## Testing

### Manual Testing

1. Start all services (Gateway, Agent, TUI)
2. Type messages and verify responses
3. Test slash commands: `/help`, `/clear`, etc.
4. Test bash commands: `!ls`, `!git status`, etc.
5. Test model switching: `/model gpt-4o`

### Automated Tests

```bash
# If Python-based:
pytest

# If TypeScript-based:
pnpm test
```

---

## Troubleshooting

### Issue: Gateway Connection Failed

**Check**:
```bash
curl http://localhost:18789/api/health
```

**Fix**:
```bash
# Start Gateway
cd apps/gateway && pnpm dev
```

### Issue: No Model Response

**Check**:
1. Agent Worker running? `curl http://localhost:18790/health`
2. API keys set? `echo $ANTHROPIC_API_KEY`
3. Model name valid? `/model claude-3-5-sonnet`

### Issue: Weird Terminal Display

**Solution**:
```bash
# Reset terminal
reset

# Or exit and restart TUI
exit
python ag3nt_tui.py
```

### Issue: Bash Commands Not Working

**Check**:
```bash
# ENABLE_BASH_MODE must be true
env | grep ENABLE_BASH_MODE

# Or in config:
cat ~/.ag3nt/tui-config.yaml | grep bash_mode
```

---

## Keyboard Shortcuts Quick Reference

| Key | Action |
|-----|--------|
| **Enter** | Send message |
| **Tab** | Focus input box |
| **Shift+Tab** | Focus chat history |
| **Page Up/Down** | Scroll history |
| **Ctrl+C** | Exit |
| **Ctrl+L** | Clear screen |
| **Ctrl+A** | Home in input |
| **Ctrl+E** | End in input |

---

## Related Documentation

- **[PROJECT_ARCHITECTURE.md](../../PROJECT_ARCHITECTURE.md)** - System design
- **[GETTING_STARTED.md](../../GETTING_STARTED.md)** - Setup guide
- **[DEPLOYMENT.md](../../DEPLOYMENT.md)** - Deployment guide
- **[DEVELOPER.md](../../DEVELOPER.md)** - Maintainer reference

---

## Dependencies

### Python (if Python-based)
- **textual** - TUI framework
- **httpx** - Async HTTP client
- **rich** - Terminal formatting and colors
- **python-dotenv** - Environment variables
- **pydantic** - Data validation

### TypeScript (if TypeScript-based)
- **blessed** or similar - TUI framework
- **axios** - HTTP client

See `requirements.txt` or `package.json` for full list.

---

## Support

- **Setup Issues**: See [GETTING_STARTED.md](../../GETTING_STARTED.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **Architecture**: See [PROJECT_ARCHITECTURE.md](../../PROJECT_ARCHITECTURE.md)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AG3NT_GATEWAY_URL` | Gateway API URL | `http://127.0.0.1:18789` |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Send message |
| **Ctrl+J** / **Shift+Enter** | Insert new line |
| **Ctrl+L** | Clear chat and start new session |
| **Ctrl+C** | Quit (double press) |
| **Escape** | Interrupt / Close dialogs |
| **F1** | Show help modal |
| **Up/Down** | Navigate command history |

## Commands

### Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help modal |
| `/clear` | Clear chat and start new session |
| `/status` | Show session information |
| `/nodes` | Show connected nodes |
| `/tokens` | Show token usage (placeholder) |
| `/quit` | Exit the TUI |

### Bash Mode

Prefix any command with `!` to execute it directly in the shell:

```
!dir                    # List directory (Windows)
!ls -la                 # List directory (Unix)
!git status             # Check git status
!python --version       # Check Python version
```

Bash output is displayed in a styled panel with the command and result.

## Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│  AP3X - Personal AI Assistant                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  █████╗  ██████╗  ██████╗ ██╗  ██╗                         │
│ ██╔══██╗ ██╔══██╗ ╚════██╗╚██╗██╔╝                         │
│ ███████║ ██████╔╝  █████╔╝ ╚███╔╝                          │
│ ██╔══██║ ██╔═══╝   ╚═══██╗ ██╔██╗                          │
│ ██║  ██║ ██║      ██████╔╝██╔╝ ██╗                         │
│ ╚═╝  ╚═╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝                         │
│                                                             │
│  → Connected to Gateway!                                    │
│  → Session approved! Ready to chat.                         │
│                                                             │
│  ┌─ You ─────────────────────────────────────────────────┐ │
│  │ Hello, what can you help me with?                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ AP3X ────────────────────────────────────────────────┐ │
│  │ I can help you with many things! Here are some...     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  READY │ Session: abc123 │ 2 messages │ 1.2s               │
├─────────────────────────────────────────────────────────────┤
│  > Type a message...                                        │
├─────────────────────────────────────────────────────────────┤
│  Ctrl+C Quit │ Ctrl+L Clear │ F1 Help                       │
└─────────────────────────────────────────────────────────────┘
```

## Message Types

| Type | Description | Style |
|------|-------------|-------|
| **User** | Your messages | Indigo left border |
| **Assistant** | AP3X responses | Emerald left border |
| **System** | Status messages | Arrow prefix (→) |
| **Error** | Error messages | Red left border |
| **Bash Output** | Shell command results | Pink left border |

## Session Management

The TUI automatically:
1. Creates a new session on startup
2. Handles DM pairing (auto-approves for local connections)
3. Maintains session across messages
4. Clears session on `/clear` or Ctrl+L

## Troubleshooting

### "Connection refused" error
- Ensure Gateway is running on port 18789
- Check `AG3NT_GATEWAY_URL` environment variable

### "Session requires approval" message
- The TUI auto-approves local sessions
- If stuck, restart the TUI

### Slow responses
- Complex agent tasks can take up to 5 minutes
- The loading indicator shows elapsed time
- Press Escape to cancel a pending request

### Input not visible
- Ensure terminal supports 256 colors
- Try a different terminal emulator

## Development

The TUI is built with:
- **Textual** - Modern TUI framework
- **Rich** - Terminal formatting and markdown
- **httpx** - Async HTTP client

### File Structure

```
apps/tui/
├── __init__.py
├── __main__.py       # Module entry point
├── ag3nt_tui.py      # Main application (~1400 lines)
├── requirements.txt  # Python dependencies
└── README.md         # This file
```

