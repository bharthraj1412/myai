# AG3NT Gateway

HTTP + WebSocket daemon providing routing, session management, and channel adapters.

## Quick Overview

| Aspect | Details |
|--------|---------|
| **Language** | TypeScript (Node.js) |
| **Port** | 18789 (configurable) |
| **Role** | Central hub routing requests to Agent Worker |
| **Key Features** | REST API, WebSocket streaming, channel adapters (Slack, Discord, Telegram), SQLite persistence |
| **Runtime** | ~500ms startup, ~50MB memory |

---

## Prerequisites

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher
- Git (for version control)

---

## Installation

### 1. Install Dependencies

```bash
cd apps/gateway
pnpm install
```

### 2. Set Environment Variables

Create a `.env` file in the repo root (if not already done):

```bash
AG3NT_GATEWAY_PORT=18789
AG3NT_AGENT_URL=http://127.0.0.1:18790
NODE_ENV=development
```

---

## Running

### Development Mode

```bash
cd apps/gateway
pnpm dev

# Output:
# > listening on :::18789
# > WebSocket server ready
# > Database initialized
```

The gateway will:
- Start HTTP server on port 18789
- Initialize SQLite database for sessions
- Wait for Agent Worker to be available

### Production Mode

```bash
cd apps/gateway
pnpm build
pnpm start
```

### Docker

```bash
docker build -f apps/gateway/Dockerfile -t ag3nt-gateway .
docker run -p 18789:18789 ag3nt-gateway
```

---

## API Endpoints

### Chat Endpoint

**POST `/api/chat`** - Send a chat message and get streamed response

```bash
curl -X POST http://localhost:18789/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the weather?",
    "model": "claude-3-5-sonnet",
    "conversationId": "conv-123"
  }'
```

**Response**: Server-Sent Events (SSE) stream

```
data: {"type":"status","text":"Processing..."}
data: {"type":"text","text":"The weather is..."}
data: {"type":"complete","tokens":142}
```

### Model Configuration

**GET `/api/models`** - List available models

```bash
curl http://localhost:18789/api/models
```

**Response**:
```json
{
  "models": [
    {
      "id": "claude-3-5-sonnet",
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "contextWindow": 200000
    },
    {
      "id": "gpt-4o",
      "name": "GPT-4 Omni",
      "provider": "openai",
      "contextWindow": 128000
    }
  ]
}
```

### Health Check

**GET `/api/health`** - Check service status

```bash
curl http://localhost:18789/api/health
```

**Response**:
```json
{
  "status": "ok",
  "uptime": 12345,
  "agentConnected": true,
  "dbHealthy": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Session Management

**GET `/api/sessions`** - List active sessions

**POST `/api/sessions/{id}`** - Get session details

**DELETE `/api/sessions/{id}`** - Delete session

---

## Architecture

### Directory Structure

```
apps/gateway/
├── src/
│   ├── index.ts                   # Entry point
│   ├── gateway/
│   │   ├── createGateway.ts       # Factory and setup
│   │   ├── router.ts              # Request routing logic
│   │   └── channels/              # Channel adapters
│   │       ├── slack.ts
│   │       ├── discord.ts
│   │       └── telegram.ts
│   ├── api/
│   │   ├── chat.ts                # Chat endpoint (POST /api/chat)
│   │   ├── models.ts              # Models endpoint (GET /api/models)
│   │   ├── health.ts              # Health check (GET /api/health)
│   │   └── sessions.ts            # Session management
│   ├── services/
│   │   ├── SessionService.ts      # Session CRUD
│   │   ├── DatabaseService.ts     # SQLite wrapper
│   │   ├── EventBus.ts            # WebSocket event streaming
│   │   └── AgentClient.ts         # Communication with Agent Worker
│   ├── types/
│   │   ├── chat.ts
│   │   ├── session.ts
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts
│       ├── error.ts
│       └── sse.ts                 # Server-Sent Events helpers
├── dist/                          # Compiled JavaScript
├── tests/
│   ├── chat.test.ts
│   ├── health.test.ts
│   └── integration/
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Data Flow

```
User (UI/Channel)
    ↓
Gateway HTTP Server (port 18789)
    ├─→ Validate request
    ├─→ Load/Create session (SQLite)
    ├─→ Route to Agent Worker
    │
    ↓
Agent Worker (port 18790)
    ├─→ Process with LLM
    ├─→ Execute tools/skills
    ├─→ Return response stream
    │
    ↓
Gateway SSE Streaming
    ├─→ Transform events
    ├─→ Stream to client (UI/Channel)
    ├─→ Persist to session history
    │
    ↓
SQLite Database (~/.ag3nt/data.db)
    └─→ Store session history, metadata
```

---

## Key Files Reference

### Entry Point
- **`src/index.ts`** - Starts HTTP server, initializes services

### Request Handling
- **`src/api/chat.ts`** - Chat streaming endpoint, validates requests
- **`src/gateway/router.ts`** - Routes requests to Worker, handles errors
- **`src/services/AgentClient.ts`** - Low-level Worker communication

### Session Management
- **`src/services/SessionService.ts`** - Load, create, delete sessions
- **`src/services/DatabaseService.ts`** - SQLite operations

### Channel Adapters
- **`src/gateway/channels/slack.ts`** - Slack adapter (Slack Bolt)
- **`src/gateway/channels/discord.ts`** - Discord adapter (Discord.js)
- **`src/gateway/channels/telegram.ts`** - Telegram adapter

---

## Configuration

### Environment Variables

```bash
# Ports
AG3NT_GATEWAY_PORT=18789         # Gateway listen port
AG3NT_GATEWAY_HOST=127.0.0.0     # Gateway bind address

# Worker Connection
AG3NT_AGENT_URL=http://127.0.0.1:18790  # Agent worker URL

# Database
AG3NT_DB_PATH=~/.ag3nt/data.db   # SQLite database path

# Environment
NODE_ENV=development             # development | production
DEBUG=ag3nt:*                    # Enable debug logging

# Channels (optional)
SLACK_BOT_TOKEN=xoxb-...        # Slack Bot token
SLACK_SIGNING_SECRET=...         # Slack signing secret
DISCORD_BOT_TOKEN=...            # Discord bot token
TELEGRAM_BOT_TOKEN=...           # Telegram bot token
```

### Configuration File

Gateway loads configuration from `~/.ag3nt/config.yaml`:

```yaml
gateway:
  port: 18789
  host: 127.0.0.0
  # ...

channels:
  slack:
    enabled: true
    botToken: ${SLACK_BOT_TOKEN}
  discord:
    enabled: true
    botToken: ${DISCORD_BOT_TOKEN}
```

---

## Testing

### Run All Tests

```bash
pnpm test              # Run all tests once
pnpm test:watch       # Watch mode (re-run on changes)
pnpm test:ui          # Visual test UI
pnpm test:coverage    # Coverage report
```

### Run Specific Tests

```bash
pnpm test chat        # Run chat-related tests
pnpm test health      # Run health check tests
pnpm test:integration # Integration tests only
```

### Test Structure

```
apps/gateway/tests/
├── chat.test.ts       # Chat endpoint tests
├── health.test.ts     # Health check tests
├── models.test.ts     # Model config tests
└── integration/
    ├── session.test.ts         # Session persistence
    └── agent-client.test.ts    # Agent communication
```

### Key Test Commands

```bash
# Test specific file
pnpm test -- src/api/chat.test.ts

# Test with specific pattern
pnpm test -- --grep "POST /api/chat"

# Generate coverage report
pnpm test:coverage
# View report: open coverage/index.html
```

---

## Troubleshooting

### Issue: Port 18789 Already in Use

**Solution**:
```bash
# Find process using port (Linux/Mac)
lsof -i :18789

# Kill it
kill -9 <PID>

# Or change port in .env
AG3NT_GATEWAY_PORT=18790
```

### Issue: Agent Worker Not Responding

**Check**:
```bash
# Health check
curl http://localhost:18789/api/health

# Start Agent Worker
cd apps/agent && python -m ag3nt_agent.worker
```

### Issue: Database Lock Error

**Solution**:
```bash
# Remove and recreate database
rm ~/.ag3nt/data.db

# Or increase lock timeout in .env
AG3NT_DB_TIMEOUT=10000
```

### Issue: Memory Leak or High CPU

**Debug**:
```bash
# Enable debug logging
DEBUG=ag3nt:* pnpm dev

# Check memory usage
node --inspect=9229 dist/index.js
# Open chrome://inspect
```

---

## Performance Tuning

### For Production

1. **Enable Caching**:
   ```bash
   NODE_ENV=production
   AG3NT_CACHE_ENABLED=true
   ```

2. **Database Connection Pool**:
   ```bash
   AG3NT_DB_POOL_SIZE=10
   AG3NT_DB_TIMEOUT=5000
   ```

3. **Compression**:
   - Express middleware compresses responses > 1KB

4. **Monitoring**:
   - Use `/api/health` for heartbeat checks
   - Monitor response times with `DEBUG=ag3nt:*`

---

## Debugging

### Enable Verbose Logging

```bash
DEBUG=ag3nt:* pnpm dev
```

**Output includes**:
- Request details (path, method, headers)
- Session operations (load, create, persist)
- Agent communication (request/response)
- Database operations (queries, timing)

### Inspect Network Requests

**Option 1**: cURL (from terminal)
```bash
curl -v http://localhost:18789/api/health
```

**Option 2**: Browser DevTools
- Open [http://localhost:18789/api/health](http://localhost:18789/api/health)
- Check Network tab

**Option 3**: Node Inspector
```bash
node --inspect=9229 dist/index.js
# Open chrome://inspect in Chrome
```

---

## Build & Deployment

### Local Build

```bash
pnpm build
# Output: dist/index.js (compiled JavaScript)
```

### Verify Build

```bash
pnpm start
# Should start without errors
```

### Docker Deployment

```bash
# Build image
docker build -f apps/gateway/Dockerfile -t ag3nt-gateway:latest .

# Run container
docker run -p 18789:18789 \
  -e AG3NT_AGENT_URL=http://agent:18790 \
  -v ~/.ag3nt:/home/ag3nt/.ag3nt \
  ag3nt-gateway:latest
```

---

## Related Documentation

- **[PROJECT_ARCHITECTURE.md](../../PROJECT_ARCHITECTURE.md)** - System design and component roles
- **[GETTING_STARTED.md](../../GETTING_STARTED.md)** - Local development setup
- **[CONFIGURATION.md](../../CONFIGURATION.md)** - Full configuration reference
- **[DEPLOYMENT.md](../../DEPLOYMENT.md)** - Production deployment guide
- **[DEVELOPER.md](../../DEVELOPER.md)** - Maintainer reference, known issues

---

## Dependencies

Key npm packages:
- **express** - HTTP server framework
- **ws** - WebSocket library
- **better-sqlite3** - SQLite database
- **@slack/bolt** - Slack adapter
- **discord.js** - Discord adapter
- **node-telegram-bot-api** - Telegram adapter

See `package.json` for full list.

---

## Support

- **Documentation**: [PROJECT_ARCHITECTURE.md](../../PROJECT_ARCHITECTURE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **Contributing**: [CONTRIBUTING.md](../../CONTRIBUTING.md)

