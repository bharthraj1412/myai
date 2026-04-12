# Getting Started with AG3NT

This guide walks you through setting up AG3NT for local development on Windows or Linux.

## Prerequisites

### System Requirements

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| **OS** | Windows 10 / Ubuntu 20.04 | Windows 11 / Ubuntu 22.04 |
| **Node.js** | 16.x | 18.x LTS or 20.x |
| **Python** | 3.10 | 3.12 (Do not use 3.14+) |
| **RAM** | 4 GB | 8+ GB |
| **Disk Space** | 2 GB | 5+ GB |
| **CPU Cores** | 2 | 4+ |

### Software Requirements

Install these before proceeding:

#### 1. Node.js & pnpm
- **Download**: [nodejs.org](https://nodejs.org) (install 18.x LTS or higher)
- **Verify**: 
  ```bash
  node --version  # Should be v18.x or higher
  npm --version
  ```
- **Install pnpm**:
  ```bash
  npm install -g pnpm
  pnpm --version  # Should be 8.x or higher
  ```

#### 2. Python 3.10 - 3.12
- **Download**: [python.org](https://python.org)
- **Windows**: During installation, check **"Add Python to PATH"**
- **Note**: Version 3.14+ is currently incompatible with underlying Pydantic/LangChain dependencies. Stick to `3.12.x`.
- **Verify**:
  ```bash
  python --version  # Should be 3.10, 3.11, or 3.12
  ```

#### 3. Git
- **Download**: [git-scm.com](https://git-scm.com)
- **Verify**:
  ```bash
  git --version
  ```

#### 4. Optional: Docker
- **Download**: [docker.com/products/docker-desktop](https://docker.com/products/docker-desktop)
- **For**: Containerized deployment (useful for testing Docker setup)

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/bharthraj1412/myai.git
cd myai

# Verify you're in the correct directory
ls -la  # Should see: apps/, community/, skills/, package.json, etc.
```

---

## Step 2: Set Up Configuration

### 2.1 Create Configuration Directory

```bash
# Create ~/.ag3nt directory (will store config and data)
# Windows (PowerShell):
if (!(Test-Path "$env:USERPROFILE\.ag3nt")) { mkdir "$env:USERPROFILE\.ag3nt" }

# Linux/Mac (Bash):
mkdir -p ~/.ag3nt
```

### 2.2 Copy Default Configuration

```bash
# Copy default config
# Windows (PowerShell):
Copy-Item -Path "config\default-config.yaml" -Destination "$env:USERPROFILE\.ag3nt\config.yaml"

# Linux/Mac (Bash):
cp config/default-config.yaml ~/.ag3nt/config.yaml
```

### 2.3 Edit Configuration (Optional)

Edit `~/.ag3nt/config.yaml` to customize:
- LLM providers (Claude, OpenAI, etc.)
- Channel adapters (Slack, Discord, Telegram)
- Port numbers
- Feature flags

See [CONFIGURATION.md](CONFIGURATION.md) for detailed options.

---

## Step 3: Set Up Environment Variables

### 3.1 Create `.env` File

In the repo root, create `.env`:

```bash
# Windows (PowerShell):
@"
# LLM Provider Keys
ANTHROPIC_API_KEY=your_claude_key_here
OPENAI_API_KEY=your_openai_key_here

# Ports (optional, defaults shown)
AG3NT_GATEWAY_PORT=18789
AG3NT_AGENT_PORT=18790

# Environment
NODE_ENV=development
"@ | Out-File -Encoding UTF8 ".env"

# Linux/Mac (Bash):
cat > .env << 'EOF'
# LLM Provider Keys
ANTHROPIC_API_KEY=your_claude_key_here
OPENAI_API_KEY=your_openai_key_here

# Ports (optional, defaults shown)
AG3NT_GATEWAY_PORT=18789
AG3NT_AGENT_PORT=18790

# Environment
NODE_ENV=development
EOF
```

### 3.2 Get API Keys

1. **Anthropic Claude**:
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Create an API key
   - Paste into `.env` as `ANTHROPIC_API_KEY=sk_...`

2. **OpenAI GPT** (optional):
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create an API key
   - Paste into `.env` as `OPENAI_API_KEY=sk_...`

You can add other providers as needed. See [CONFIGURATION.md](CONFIGURATION.md) for all supported providers.

---

## Step 4: Install Dependencies

### 4.1 Install Root Dependencies

```bash
# Install pnpm dependencies for all workspaces (gateway, agent, ui, etc.)
pnpm install

# This runs in all directories listed in pnpm-workspace.yaml
```

**Takes 2-5 minutes** depending on network speed.

### 4.2 Verify Installation

```bash
# Check that key packages are installed
ls -la node_modules/@ag3nt/gateway
ls -la apps/ui/node_modules/next
```

---

## Step 5: Set Up Python Environment (Agent Worker)

The Agent worker runs in Python. Set up a virtual environment:

### 5.1 Create Virtual Environment

```bash
# Windows (PowerShell):
cd apps\agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# Verify prompt shows (.venv)

# Linux/Mac (Bash):
cd apps/agent
python3 -m venv .venv
source .venv/bin/activate
# Verify prompt shows (.venv)
```

### 5.2 Install Python Dependencies

```bash
# (Already in .venv from above)
pip install -r requirements.txt

# Install development dependencies (optional but recommended)
pip install pytest pytest-asyncio black mypy
```

### 5.3 Verify Python Setup

```bash
python --version  # Should show 3.10+
pip list | grep anthropic  # Should see anthropic package
deactivate  # Exit venv (works in both Windows/Linux)
```

---

## Step 6: Verify Build

Make sure everything compiles:

```bash
# Build TypeScript packages
pnpm build

# This builds:
# - apps/gateway
# - apps/ui
# - Any type-checked packages

# Verify no build errors
echo "Build complete!"
```

---

## Step 7: Start the Development Environment

### Option A: Windows Quick-Start (Recommended)

```powershell
# From repo root
powershell -ExecutionPolicy Bypass -File .\start.ps1

# This script starts:
# 1. Gateway (port 18789)
# 2. Agent Worker (port 18790)
# 3. UI Dashboard (port 3000)

# Output shows:
# > Gateway listening on http://127.0.0.1:18789
# > Agent listening on http://127.0.0.1:18790
# > UI available at http://localhost:3000
```

**Wait 10-15 seconds** for all services to start fully. Then open:
- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)

### Option B: Manual Multi-Terminal (All Platforms)

**Terminal 1: Gateway**
```bash
cd apps/gateway
pnpm dev
# Should show: "listening on :::18789"
```

**Terminal 2: Agent Worker**
```bash
cd apps/agent
.venv\Scripts\activate  # Windows (PowerShell):
# or
source .venv/bin/activate  # Linux/Mac

python -m uvicorn ag3nt_agent.worker:app --port 18790
# Should show: "Uvicorn running on http://127.0.0.1:18790 (Press CTRL+C to quit)"
```

**Terminal 3: Web Dashboard**
```bash
cd apps/ui
pnpm dev
# Should show: "ready - started server on 0.0.0.0:3000"
```

**Then open**: [http://localhost:3000](http://localhost:3000)

### Option C: Docker (If Installed)

```bash
# Build and start containers
docker compose up -d

# View logs
docker compose logs -f

# Services available at same ports: 3000, 18789, 18790
```

---

## Step 8: Verification Checklist

Once started, verify everything works:

### 8.1 Check Gateway Health
```bash
# In a new terminal
curl http://localhost:18789/api/health
# Should return: { "status": "ok", "timestamp": "..." }
```

### 8.2 Check Agent Health
```bash
# In a new terminal
curl http://localhost:18790/health
# Should return: { "status": "healthy" }
```

### 8.3 Test Web Dashboard

1. Open [http://localhost:3000](http://localhost:3000)
2. You should see the AG3NT web interface
3. Click **"New Chat"** to create a conversation
4. Pick a model (Claude, GPT, etc.)
5. Type a message and hit Send
6. You should see a response within 5-10 seconds

### 8.4 Test in Terminal (Optional)

```bash
# Send a test request to Gateway
curl -X POST http://localhost:18789/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what is 2+2?", "model": "claude-3-5-sonnet"}'
```

---

## Troubleshooting

### Common Setup Issues

#### Issue: `pnpm: command not found`
**Solution**: Install pnpm globally
```bash
npm install -g pnpm
pnpm --version
```

#### Issue: Port 3000 already in use
**Solution**: Change the port
```bash
cd apps/ui
pnpm dev --port 3001
# Then open http://localhost:3001
```

#### Issue: Python venv activation fails
**Solution**: Use correct activation script
```bash
# Windows PowerShell:
& "apps\agent\.venv\Scripts\Activate.ps1"

# Windows CMD:
apps\agent\.venv\Scripts\activate.bat

# Linux/Mac:
source apps/agent/.venv/bin/activate
```

#### Issue: `ANTHROPIC_API_KEY not set`
**Solution**: Verify `.env` file exists and is loaded
```bash
# Check .env exists
ls -la .env

# Verify key is set
cat .env | grep ANTHROPIC_API_KEY

# If using PowerShell, make sure .env is in repo root
```

#### Issue: Gateway won't start (port already in use)
**Solution**: Stop existing process or change port
```bash
# Find process on port 18789 (Linux/Mac):
lsof -i :18789

# Kill it:
kill -9 <PID>

# Or change port in .env:
AG3NT_GATEWAY_PORT=18789
```

#### Issue: Agent Worker crashes immediately
**Solution**: Check Python version and dependencies
```bash
cd apps/agent
python --version  # Must be 3.10+
pip list | grep anthropic  # Should be installed
pip install -e .  # Reinstall
```

More troubleshooting? See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Next Steps

Once you have everything running:

1. **Explore the Project Structure**: See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
2. **Understand the Architecture**: See [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
3. **Configure Integrations**: See [CONFIGURATION.md](CONFIGURATION.md)
4. **Start Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
5. **Advanced**: See [DEVELOPER.md](DEVELOPER.md) for maintainer reference

---

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev              # Start all (gate way, agent, ui) - Windows only
pnpm build            # Build all packages
pnpm test             # Run all tests

# Gateway
cd apps/gateway && pnpm dev         # Start gateway dev server
cd apps/gateway && pnpm test        # Run gateway tests

# Agent Worker
cd apps/agent && source .venv/bin/activate && python -m uvicorn ag3nt_agent.worker:app --port 18790

# UI Dashboard
cd apps/ui && pnpm dev              # Start UI on port 3000
cd apps/ui && pnpm test:e2e         # Run E2E tests

# Clean up
pnpm clean            # Remove all node_modules
rm -rf apps/agent/.venv  # Remove Python venv
```

### Important Ports

| Service | Port | URL |
|---------|------|-----|
| Web Dashboard | 3000 | http://localhost:3000 |
| Gateway API | 18789 | http://localhost:18789 |
| Agent Worker | 18790 | http://localhost:18790 |

### Environment Files

| File | Purpose |
|------|---------|
| `.env` | LLM keys, port config, environment variables |
| `~/.ag3nt/config.yaml` | Channel and provider configuration |
| `.venv/` | Python virtual environment (in `apps/agent/`) |

---

## Need Help?

- **Setup Issues**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Architecture Questions**: See [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
- **Project Structure**: See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **GitHub Issues**: [Create an issue](https://github.com/bharthraj1412/myai/issues)

