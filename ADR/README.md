# Architecture Decision Records (ADRs)

Record of important architectural decisions in AG3NT.

---

## ADR-001: 4-App Service Model

**Status**: Accepted  
**Date**: [Project inception]  
**Deciders**: Architecture team

### Context

AG3NT needed to support:
- Web UI and terminal interfaces (separate user experiences)
- Multiple deployment scenarios (local, cloud, on-premises)
- Independent scaling of components
- Different technology choices per component (TypeScript for web, Python for AI)

### Decision

Implement a **4-service architecture**:

1. **UI Layer** (Next.js/React)
   - Web dashboard interface
   - Browser-based interaction
   - Port 3000

2. **Gateway Layer** (Node.js/Express)
   - HTTP and WebSocket API
   - Session management
   - Database persistence
   - Port 18789

3. **Agent Layer** (Python)
   - LLM inference and reasoning
   - Tool execution
   - Skill management
   - Port 18790

4. **TUI** (TypeScript CLI)
   - Terminal-based interface
   - Direct agent communication

### Rationale

- ✅ **Independent deployment**: Each service deployable separately
- ✅ **Technology flexibility**: Right tool per layer (Node.js for web, Python for AI)
- ✅ **Scalability**: Agent workers can be scaled independently
- ✅ **Separation of concerns**: Clear boundaries and responsibilities
- ✅ **Multi-user**: Gateway can support multiple concurrent users
- ✅ **Channel adapter pattern**: Easy to add Slack, Discord, etc.

### Consequences

- ⚠️ **Operational complexity**: 4 services to manage instead of 1
- ⚠️ **Network overhead**: Inter-service communication
- ⚠️ **Distributed debugging**: Harder to trace issues across services

### Alternatives Considered

1. **Monolithic**: Single Node.js/TypeScript app with embedded Python
   - ❌ Forces Node.js for AI processing (suboptimal)
   - ❌ Harder to scale agent independently
   - ✅ Simpler to deploy initially

2. **Full microservices** (10+ services)
   - ✅ Maximum flexibility
   - ❌ Excessive operational complexity

---

## ADR-002: SQLite for Local Persistence

**Status**: Accepted  
**Date**: [Early design]  
**Deciders**: Backend team

### Context

AG3NT needed persistent storage for:
- Chat history
- Sessions
- Conversation metadata
- User settings

Needed to support local development + cloud deployments.

### Decision

Use **SQLite** for default persistence:
- Auto-created at `~/.ag3nt/data.db`
- No external DB setup required
- Embedded in applications
- Migrate to PostgreSQL in production (if needed)

### Rationale

- ✅ **Zero setup**: Works without external database
- ✅ **Local development**: Perfect for on-premises deployment
- ✅ **Small deployments**: No PostgreSQL infrastructure needed
- ✅ **File-based**: Easy backup and migration
- ✅ **SQL migration path**: Can upgrade to PostgreSQL later

### Consequences

- ⚠️ **Single user**: SQLite not ideal for concurrent heavy workloads
- ⚠️ **Lock contention**: Multiple processes can lock database
- ✅ **Migration**: Easy upgrade path to PostgreSQL for production

### Migration Path

For production multi-user deployments:

```javascript
// Gateway can switch to PostgreSQL:
// gateway/config.yaml:
database:
  type: postgres
  host: postgres.example.com
  port: 5432
```

---

## ADR-003: LLM Provider Abstraction

**Status**: Accepted  
**Date**: [Early design]  
**Deciders**: AI team

### Context

AG3NT needs to support multiple LLM providers:
- Anthropic Claude (primary)
- OpenAI (GPT-4, GPT-3.5)
- OpenRouter (multi-model)
- Custom providers (Kimi, Groq, Google, Azure OpenAI)

### Decision

Implement **provider-agnostic interface**:

```python
# In apps/agent/ag3nt_agent/models/base.py
class LLMProvider(ABC):
    async def generate(self, messages, temperature, max_tokens):
        """Generate response."""
    
    async def stream(self, messages):
        """Stream response."""
```

Each provider implements this interface:
- `AnthropicProvider`
- `OpenAIProvider`
- `OpenRouterProvider`
- etc.

User selects provider via environment variable:
```bash
AG3NT_MODEL_PROVIDER=anthropic
```

### Rationale

- ✅ **Easy switching**: Change provider without code changes
- ✅ **No vendor lock-in**: Works seamlessly with OpenAI, Anthropic, etc.
- ✅ **Fallback support**: Can implement failover logic
- ✅ **Cost optimization**: Switch to cheaper models as needed
- ✅ **User flexibility**: All providers supported equally

### Consequences

- ⚠️ **Lower common denominator**: Some provider features not available to all
- ✅ **Extensible**: New providers can be added without changing core code

### Adding New Provider

1. Create provider class extending `LLMProvider`
2. Implement interface methods
3. Register in provider factory
4. Add integration tests

---

## ADR-004: Skill-Based Tool Architecture

**Status**: Accepted  
**Date**: [Early design]  
**Deciders**: Architecture team

### Context

AG3NT needs:
- Many tools/capabilities
- Easy for users to add tools
- Tools discoverable to the agent
- Tools reusable across different deployments

### Decision

Implement **skill-based architecture**:

1. **Skill** = Container for related tools
2. **Each skill** has `SKILL.md` (metadata) + `index.ts` (implementation)
3. **Skills** auto-discovered from `/skills` folder
4. **Agent** loads all available skills at startup

Example skill structure:
```
skills/web-research/
├── SKILL.md           # Tool definitions
├── index.ts           # Implementation
└── package.json
```

### Rationale

- ✅ **Modular**: Each skill is independent
- ✅ **Discoverable**: SKILL.md is machine-readable format
- ✅ **Easy to add**: Copy template, implement tools
- ✅ **Encapsulated**: Dependencies managed per skill
- ✅ **Shareable**: Skills can be published to npm

### Consequences

- ⚠️ **Skill discovery overhead**: Agent loads on startup
- ✅ **Namespace potential**: Tools could conflict (needs planning)

### Alternative: Monolithic Tool Library

- ❌ Harder to add tools
- ❌ All tools always loaded
- ❌ Not user-extensible

---

## ADR-005: WebSocket for Real-time Chat

**Status**: Accepted  
**Date**: [Early design]  
**Deciders**: Backend + Frontend teams

### Context

AG3NT UI needs:
- Streaming responses (show text as it's generated)
- Real-time chat experience
- Efficient for high-frequency updates

### Decision

Use **WebSocket** for real-time communication:

```typescript
// Client (UI)
const ws = new WebSocket('ws://localhost:18789/chat');
ws.send(JSON.stringify({ message: 'Hello' }));

ws.addEventListener('message', (event) => {
  const chunk = JSON.parse(event.data);
  // Stream text as it arrives
});
```

Gateway accepts both HTTP (for simple queries) and WebSocket (for streaming):
- HTTP POST `/api/chat` - Request-response
- WebSocket `/ws/chat` - Streaming

### Rationale

- ✅ **Streaming**: Show response word-by-word
- ✅ **Efficient**: Binary WebSocket frames are small
- ✅ **Bidirectional**: Client can send interrupts
- ✅ **Real-time**: No polling needed
- ✅ **Graceful degradation**: HTTP fallback available

### Consequences

- ⚠️ **More complex**: WebSocket management vs HTTP
- ⚠️ **Deployment**: Needs proxy support for WebSockets
- ✅ **Better UX**: Streaming responses feel faster

---

## ADR-006: Environment Variable Configuration

**Status**: Accepted  
**Date**: [Early design]  
**Deciders**: Operations team

### Context

AG3NT needs flexible configuration for:
- Local development
- Multiple deployments
- Sensitive data (API keys)
- Different environments

### Decision

Use **environment variables** as primary config mechanism:

```bash
# .env file
AG3NT_MODEL_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk_ant_...
AG3NT_GATEWAY_PORT=18789
```

Configuration loading hierarchy:
1. Hard defaults (code)
2. `config/default-config.yaml`
3. `~/.ag3nt/config.yaml`
4. `.env` file
5. CLI arguments (highest priority)

### Rationale

- ✅ **No secrets in code**: API keys never committed
- ✅ **Flexible**: Works with 12-factor app principles
- ✅ **Portable**: Same config format across platforms
- ✅ **Docker/K8s friendly**: Native env var support
- ✅ **Secrets management**: Works with vault/secrets managers

### Consequences

- ⚠️ **Potentially too many vars**: Can become overwhelming
- ✅ **Documentation needed**: Good config docs required

---

## ADR-007: DeepAgents for Agent Framework

**Status**: Accepted  
**Date**: [Early design]  
**Deciders**: AI team

### Context

AG3NT needed an AI agent framework that:
- Supports tool use / function calling
- Works with multiple LLM providers
- Handles conversation memory
- Extensible for custom behaviors

### Decision

Use **DeepAgents** library as the agent framework.

DeepAgents provides:
- Tool/function calling abstraction
- Conversation history management
- Provider abstraction (Anthropic, OpenAI, etc.)
- Streaming support
- Error handling

### Rationale

- ✅ **LLM abstraction**: Works with all providers
- ✅ **Tool support**: Standardized tool/function calling
- ✅ **Memory management**: Automatic conversation history
- ✅ **Python-first**: Native Python implementation
- ✅ **Active development**: Regular updates

### Consequences

- ⚠️ **Dependency**: Adds external dependency (managed via pip)
- ✅ **Tested**: Well-tested framework

### Alternative: Build Custom Agent

- ❌ Significant engineering effort
- ❌ Duplicate testing/debugging

---

## ADR-008: Docker Compose for Local Development

**Status**: Accepted  
**Date**: [Early design]  
**Deciders**: DevOps team

### Context

AG3NT developers need:
- Single command to start all services
- Reproducible environment
- Matching production deployment
- Service dependency management

### Decision

Use **Docker Compose** for development environment:

```yaml
# docker-compose.yml
services:
  gateway: ...
  agent: ...
  ui: ...
```

Start all services:
```bash
docker-compose up
```

### Rationale

- ✅ **Single command**: `docker-compose up` runs everything
- ✅ **Reproducible**: Same environment for all developers
- ✅ **Production parity**: Prod uses Docker too
- ✅ **Dependency ordering**: Services start in correct order
- ✅ **Easy cleanup**: `docker-compose down` removes everything

### Consequences

- ⚠️ **Docker required**: Developers must have Docker installed
- ⚠️ **Resource overhead**: Containers use more resources than native
- ✅ **Consistency**: Same environment eliminates "works on my machine"

---

## ADR-009: Monorepo with pnpm Workspaces

**Status**: Accepted  
**Date**: [Project structure]  
**Deciders**: Architecture team

### Context

AG3NT needs:
- Shared code across multiple apps
- Unified dependency management
- Single repository
- Efficient local development

### Decision

Use **pnpm monorepo workspaces**:

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'skills/*'
  - 'community/*'
```

Benefits:
- Shared dependencies cached
- Single `pnpm install`
- Cross-workspace references
- Unified CI/CD pipeline

### Rationale

- ✅ **Efficient**: Shared dependency deduplication
- ✅ **Symbolic links**: Development changes immediately visible
- ✅ **Single install**: `pnpm install` gets everything
- ✅ **Fast CI/CD**: Faster than multi-repo approach
- ✅ **Atomic commits**: Related changes in one commit

### Consequences

- ⚠️ **Monorepo complexity**: Harder to split later
- ⚠️ **Large repo**: Some tools struggle with size
- ✅ **Shared standards**: Easier to enforce consistency

---

## ADR-010: No Database for TUI

**Status**: Accepted  
**Date**: [CLI design]  
**Deciders**: CLI team

### Context

TUI app needs:
- Quick interactions from terminal
- Minimal dependencies
- Light memory footprint

### Decision

TUI connects to Gateway (which has database):
- No local database in TUI
- Session state in Gateway
- TUI is stateless
- Connection failures don't affect data

### Rationale

- ✅ **Lightweight**: No database dependency
- ✅ **Stateless**: Easy to recreate/restart
- ✅ **Data integrity**: Single source of truth (Gateway)
- ✅ **Multi-channel**: Gateway persists data for all clients

### Consequences

- ⚠️ **Offline mode**: TUI needs Gateway running
- ✅ **Data sharing**: Multiple clients share same history

---

## Future ADRs

To be documented:

- [ ] MCP Server support architecture
- [ ] Rate limiting strategy
- [ ] Artifact system design
- [ ] Browser automation approach
- [ ] Multi-language support

---

## Related Documentation

- **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** - The resulting architecture
- **[DEVELOPER.md](DEVELOPER.md)** - Maintainer notes
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - All docs

