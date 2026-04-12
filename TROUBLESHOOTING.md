# AG3NT Troubleshooting Guide

Solutions to common AG3NT issues.

---

## Startup Issues

### Service Won't Start

**Gateway fails to start**
```
Error: listen EADDRINUSE: address already in use :::18789
```

**Solution**:
```bash
# Change port
export AG3NT_GATEWAY_PORT=18900

# Or kill process using port
lsof -i :18789  # Find process
kill -9 <PID>
```

**Agent worker fails to start**
```
ModuleNotFoundError: No module named 'ag3nt_agent'
```

**Solution**:
```bash
cd apps/agent
pip install -e .
```

**UI won't load**
```
Error: next: the development server failed to compile
```

**Solution**:
```bash
cd apps/ui
rm -rf .next node_modules
npm install
npm run dev
```

---

## Connection Issues

### Gateway Can't Connect to Agent

**Error**: `Error connecting to agent at http://127.0.0.1:18790`

**Causes & Solutions**:

1. Agent not running
   ```bash
   # Check if running
   curl http://localhost:18790/health
   
   # Start agent
   cd apps/agent && python -m ag3nt_agent.worker
   ```

2. Wrong port configured
   ```bash
   # Check .env
   cat .env | grep AG3NT_AGENT
   
   # Should match agent startup port
   ```

3. Firewall blocking
   ```bash
   # Allow port
   # Windows: netsh advfirewall firewall add rule ...
   # Linux: sudo ufw allow 18790
   # Mac: sudo pfctl -f /etc/pf.conf
   ```

### UI Can't Connect to Gateway

**Error**: `WebSocket connection failed`

**Causes & Solutions**:

1. Gateway not running
   ```bash
   curl http://localhost:18789/api/health
   # If fails, start gateway
   cd apps/gateway && npm run dev
   ```

2. Gateway not on correct host/port
   ```bash
   # Check UI config
   cat apps/ui/.env | grep GATEWAY_URL
   # Should be http://127.0.0.1:18789
   ```

3. CORS issues
   ```bash
   # Check gateway config
   cat ~/.ag3nt/config.yaml | grep -A5 cors
   # Ensure cors_origin is set correctly
   ```

---

## API Key & Authentication

### "API Key Not Found" Error

**Error**: `Error: ANTHROPIC_API_KEY not found`

**Solution**:
```bash
# Option 1: Set in .env
echo "ANTHROPIC_API_KEY=sk_ant_your_key" >> .env

# Option 2: Set environment variable
export ANTHROPIC_API_KEY=sk_ant_your_key

# Option 3: Verify it's set
echo $ANTHROPIC_API_KEY        # Should not be empty

# Restart services
# The error should be gone
```

### Invalid API Key

**Error**: `Error: Invalid API key (401)`

**Solution**:
```bash
# Verify key is correct
# 1. Copy key exactly from provider (no extra quotes)
# 2. Check for trailing spaces
# 3. Verify key hasn't expired
# 4. Check provider account is active

# Replace with new key
export ANTHROPIC_API_KEY=sk_ant_new_key
# Restart agent
```

### API Key Expired/Revoked

**Error**: `Error: Authentication failed - API key revoked`

**Solution**:
1. Log into provider account (Anthropic, OpenAI, etc.)
2. Generate new API key
3. Update `.env` with new key
4. Restart services

---

## Database Issues

### Database Locked

**Error**: `Error: database is locked`

**Causes**:
- Multiple processes writing to database
- Long-running query holding lock
- Corrupted database

**Solutions**:

```bash
# Option 1: Increase lock timeout
cat >> ~/.ag3nt/config.yaml << 'EOF'
database:
  timeout_ms: 10000
EOF

# Option 2: Restart services (releases locks)
./stop.ps1
./start.ps1

# Option 3: Reset database
rm ~/.ag3nt/data.db
# Services will recreate it
```

### Database File Corrupted

**Error**: `Error: database disk image is malformed`

**Solution**:
```bash
# Backup current (corrupted) database
mv ~/.ag3nt/data.db ~/.ag3nt/data.db.bak

# Services will create new database on restart
./start.ps1

# If you had important data:
# Restore from backup (if one exists)
```

---

## LLM Provider Issues

### Anthropic (Claude)

**"Rate limited" error**:
```
Error: Too many requests (429)
```

**Solution**:
- Implement exponential backoff
- Reduce request frequency
- Upgrade Claude API plan
- Use OpenRouter as fallback provider

**"No available models" error**:
```
Error: Model 'claude-4' not found
```

**Solution**:
```bash
# Check available models
export AG3NT_MODEL_NAME=claude-3-5-sonnet  # Correct name

# Restart agent
```

### OpenAI (GPT-4/3.5)

**"Rate limited" error**:
```
Error: RateLimitError
```

**Solution**:
- Check OpenAI usage dashboard
- Reduce token limits
- Upgrade OpenAI plan
- Use gpt-3.5-turbo (cheaper)

**Model access denied**:
```
Error: You do not have access to model gpt-4
```

**Solution**:
```bash
# Use available model
export AG3NT_MODEL_NAME=gpt-3.5-turbo
# Or upgrade OpenAI account
```

### Generic Provider Issues

**Switching providers**:
```bash
# Test with OpenRouter (works with multiple providers)
export AG3NT_MODEL_PROVIDER=openrouter
export OPENROUTER_API_KEY=sk_...
export AG3NT_MODEL_NAME=anthropic/claude-3.5-sonnet

# Restart
./stop.ps1
./start.ps1
```

---

## Tool Execution Issues

### Tool Timeout

**Error**: `Tool execution timeout after 30s`

**Solution**:
```yaml
# Increase timeout in config
agent:
  tools:
    timeout_ms: 60000  # 60 seconds instead of 30
```

### Tool Not Found

**Error**: `Tool 'web_search' not found`

**Causes**:
- Skill not loaded
- Typo in tool name
- Integration not installed

**Solutions**:
```bash
# 1. Check skill exists
ls skills/web-research/

# 2. Verify SKILL.md has tool definition
cat skills/web-research/SKILL.md | grep "web_search"

# 3. Restart agent (reloads skills)
# Kill agent process
# Restart it

# 4. Check agent logs for load errors
```

### Tool Returns Error

**Error**: `Error executing tool: [tool output]`

**Solutions**:
1. **Check tool parameters**:
   ```bash
   # Read tool documentation
   cat skills/file-manager/README.md
   # Verify parameters match expected schema
   ```

2. **Check permissions**:
   - File system access (for file-manager)
   - API keys (for web-research)
   - Network access (for external tools)

3. **Enable debug logging**:
   ```bash
   export LOG_LEVEL=debug
   export DEBUG=ag3nt:*
   ```

---

## Chat & Memory Issues

### Chat History Not Saved

**Symptoms**: Chat disappears after reload

**Causes**:
- Database not saving
- Session/conversation ID issue
- Cache cleared

**Solution**:
```bash
# Verify database is working
curl http://localhost:18789/api/health | jq .database

# Check database file exists
ls -lh ~/.ag3nt/data.db

# If missing, restart gateway to recreate
```

### Out of Memory Error

**Error**: `JavaScript heap out of memory` or `MemoryError`

**Causes**:
- Very large conversation history
- Memory leak in long-running process
- Insufficient system RAM

**Solutions**:
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"  # 4GB

# Increase Python memory
python -c "import resource; resource.setrlimit(resource.RLIMIT_AS, (4*1024*1024*1024, -1))"

# Or restart services to clear memory
./stop.ps1
./start.ps1
```

### Conversation Loses Context

**Symptoms**: Agent forgets previous messages

**Causes**:
- Window size too small
- Context pruning too aggressive
- Model context limit reached

**Solutions**:
```bash
# Increase context window if provider supports
export AG3NT_MODEL_MAX_TOKENS=8192  # Double the size

# For Anthropic
export AG3NT_MODEL_NAME=claude-3-5-sonnet  # Has 200k token window

# Restart and try again
```

---

## Integration Issues

### Slack Integration Not Responding

**Symptoms**: Messages sent to Slack bot don't get responses

**Causes**:
- Bot token invalid
- Signing secret wrong
- Webhook URL not set
- Gateway not accessible from internet

**Solutions**:
```bash
# 1. Verify configuration
cat ~/.ag3nt/config.yaml | grep -A10 slack

# 2. Check Slack app settings
# - Go to api.slack.com/apps
# - Verify Bot Token (xoxb-...)
# - Verify Signing Secret
# - Verify Event Subscription webhook URL

# 3. Update .env
export SLACK_BOT_TOKEN=xoxb_...
export SLACK_SIGNING_SECRET=...

# 4. Restart gateway
```

### Discord Bot Offline

**Symptoms**: Discord bot shows as offline, no responses

**Causes**:
- Bot token invalid
- Gateway not running
- Bot not invited to server

**Solutions**:
```bash
# 1. Regenerate token
# - Go to discord.com/developers/applications
# - Regenerate bot token
# - Copy new token

# 2. Update config
export DISCORD_BOT_TOKEN=new_token

# 3. Invite bot to server
# - Get OAuth2 URL from Discord developer portal
# - Authorize with "Send Messages", "Read Messages" scopes

# 4. Restart gateway
```

---

## Performance Issues

### Slow Response Times

**Symptoms**: Agent takes 30+ seconds to respond

**Causes**:
- Model provider slow (network/API)
- Too many tools being evaluated
- Large context history

**Solutions**:
```bash
# 1. Switch to faster model
export AG3NT_MODEL_NAME=gpt-3.5-turbo  # Faster than GPT-4

# 2. Reduce context window
export AG3NT_MODEL_MAX_TOKENS=2048

# 3. Disable unused integrations
# Remove from config

# 4. Monitor provider status
# Check if provider is having issues
```

### High CPU/Memory Usage

**Symptoms**: System running slowly, fans loud

**Causes**:
- Concurrent tool execution
- Large file processing
- Memory leak

**Solutions**:
```bash
# 1. Reduce concurrent tools
agent:
  tools:
    max_concurrent: 1  # Instead of 5

# 2. Monitor resource usage
# Windows: Task Manager, top
# Linux: top, htop
# Mac: Activity Monitor

# 3. Restart services
./stop.ps1
./start.ps1

# 4. Check for memory leaks
# Enable memory profiling in agent
```

---

## Development Issues

### Cannot Build Project

**Error**: `npm ERR! code ERESOLVE`

**Solution**:
```bash
# Clear cache
pnpm store prune
rm -rf node_modules/ pnpm-lock.yaml

# Reinstall
pnpm install
```

### Tests Failing

**Error**: `Test failed: expect(...).toEqual(...)`

**Solutions**:
```bash
# 1. Run single test in isolation
npm test -- --testNamePattern="test name"

# 2. Check for flaky tests
npm test -- --repeat=3

# 3. Update snapshots if intentional change
npm test -- --updateSnapshot

# 4. Mock external dependencies
# See test file for current mocks
```

### Type Errors in IDE

**Error**: `Cannot find module 'ag3nt-shared'`

**Solution**:
```bash
# File > Close Folder > Reopen
# Or restart TypeScript server
# Ctrl+Shift+P > "TypeScript: Restart TS Server"

# Verify paths in tsconfig.json
cat tsconfig.json | grep paths
```

---

## Getting Support

**Still stuck?**

1. **Check existing issues**: Search GitHub issues for similar error
2. **Create new issue**: Include:
   - Steps to reproduce
   - Error message/logs
   - OS version
   - Node/Python versions
   - .env (without API keys)
3. **Ask community**:
   - Discord server
   - Stack Overflow (tag: ag3nt)
   - Discussion forums

---

## Related Documentation

- **[CONFIGURATION.md](CONFIGURATION.md)** - Configuration reference
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment issues
- **[DEVELOPER.md](DEVELOPER.md)** - Maintainer guide

