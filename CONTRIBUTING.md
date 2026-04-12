# AG3NT Contributing Guide

How to contribute to AG3NT – code, integrations, skills, documentation.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- pnpm (package manager)
- Git
- VS Code (optional, recommended)

### Fork & Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/AG3NT.git
cd AG3NT-main

# Add upstream remote for syncing
git remote add upstream https://github.com/ORIGINAL_ORG/AG3NT.git
```

### Local Development Setup

```bash
# Install dependencies
pnpm install

# Set up Python environment
cd apps/agent
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -e .
cd ../..

# Create .env for local development
cp config/default-config.yaml ~/.ag3nt/config.yaml
cat > .env << 'EOF'
ANTHROPIC_API_KEY=your_key_here
AG3NT_MODEL_PROVIDER=anthropic
AG3NT_MODEL_NAME=claude-3-5-sonnet
EOF

# Start all services
./start.ps1  # Windows
# Or start manually in separate terminals
```

---

## Development Workflow

### Branch Naming

Use conventional prefixes:

- `feature/` - New feature (feature/slack-integration)
- `fix/` - Bug fix (fix/gateway-reconnect)
- `docs/` - Documentation (docs/add-faq)
- `refactor/` - Code refactoring (refactor/error-handling)
- `test/` - Add tests (test/gateway-e2e)
- `chore/` - Build/maintenance (chore/update-deps)

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Slack integration
^--- type

fix: resolve memory leak in gateway
refactor: simplify tool loading logic
docs: add integration creation guide
test: add E2E tests for chat UI
chore: bump dependencies

feat(gateway): add authentication middleware
      ^---- optional scope
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Add/update tests
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `chore` - Build/tooling/dependency changes

### Creating a Pull Request

1. **Create feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and commit:
   ```bash
   git add .
   git commit -m "feat: add new integration"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/my-feature
   ```

4. **Open PR on GitHub**:
   - Use descriptive title
   - Reference related issues (#123)
   - Describe changes and testing

5. **Address review feedback**:
   ```bash
   git add .
   git commit -m "feedback: update error handling"
   git push origin feature/my-feature
   ```

---

## Code Style

### TypeScript

ESLint configured in `apps/gateway/.eslintrc.json`:

```bash
# Check code style
pnpm lint

# Fix issues automatically
pnpm lint:fix
```

**Guidelines**:
- Use TypeScript types (no `any`)
- Async/await over Promises
- Const first, then let (no var)
- Use interfaces for object shapes

```typescript
// ✅ GOOD
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

async function processMessage(msg: ChatMessage): Promise<void> {
  const result = await handleMessage(msg);
  logger.info('Processed', { id: msg.id });
}

// ❌ BAD
const processMessage = (msg: any) => {
  return handleMessage(msg).then(result => {
    // ...
  });
};
```

### Python

PEP 8 style with black formatter:

```bash
# Format code
black apps/agent/

# Lint
pylint apps/agent/ag3nt_agent/

# Type check
mypy apps/agent/
```

**Guidelines**:
- Type hints on all functions
- Docstrings on classes/functions
- 100 character line limit
- CamelCase for classes, snake_case for functions

```python
# ✅ GOOD
from typing import Optional

class ChatProcessor:
    """Process incoming chat messages."""
    
    async def process_message(
        self, message: str, model_id: str
    ) -> Optional[str]:
        """
        Process a chat message.
        
        Args:
            message: The message content
            model_id: The model to use
            
        Returns:
            The response, or None if error
        """
        result = await self.handler.process(message, model_id)
        return result

# ❌ BAD
class ChatProcessor:
    def process_message(self, message, model_id):
        result = self.handler.process(message, model_id)
        return result
```

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific suite
cd apps/gateway && pnpm test
cd apps/ui && pnpm test:e2e

# Watch mode (auto-rerun on change)
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Writing Tests

**TypeScript (Vitest)**:

```typescript
// apps/gateway/src/__tests__/chat.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ChatService } from '../services/chat';

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
  });

  it('should process a message', async () => {
    const result = await chatService.process('Hello');
    expect(result).toBeDefined();
    expect(result?.content).toContain('Hello');
  });

  it('should handle errors gracefully', async () => {
    expect(async () => {
      await chatService.process('');
    }).rejects.toThrow();
  });
});
```

**Python (pytest)**:

```python
# apps/agent/tests/test_tools.py
import pytest
from ag3nt_agent.tools import ToolExecutor

class TestToolExecutor:
    @pytest.fixture
    def executor(self):
        return ToolExecutor()

    @pytest.mark.asyncio
    async def test_execute_tool(self, executor):
        result = await executor.execute('web_search', {'query': 'test'})
        assert result is not None

    def test_invalid_tool_raises_error(self, executor):
        with pytest.raises(ValueError):
            executor.execute('nonexistent_tool', {})
```

**E2E Tests (Playwright)**:

```typescript
// apps/ui/tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test('should send and receive a message', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Type message
  await page.fill('input[placeholder="Type a message..."]', 'Hello AI');
  await page.press('input', 'Enter');
  
  // Wait for response
  await page.waitForSelector('div:has-text("Hello")', { timeout: 10000 });
  
  // Verify response exists
  const response = await page.textContent('div.assistant-message');
  expect(response).toBeTruthy();
});
```

---

## Adding Features

### New Skill

See [SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md) for detailed guide.

Quick start:

```bash
# 1. Create skill folder
cp -r skills/example-skill skills/my-skill
cd skills/my-skill

# 2. Edit SKILL.md (define tools)
vim SKILL.md

# 3. Implement in index.ts
vim index.ts

# 4. Test
npm test

# 5. Push to repo or publish to npm
git add .
git commit -m "feat: add my-skill"
```

### New Integration

See [COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md) for detailed guide.

Quick start:

```bash
# 1. Create integration folder
mkdir -p community/my-service
cd community/my-service

# 2. Create files
# - INTEGRATION.md (metadata)
# - index.ts (tool implementations)
# - package.json
# - README.md

# 3. Implement tools
vim index.ts

# 4. Test
npm test

# 5. Push
git add .
git commit -m "feat: add my-service integration"
```

### New App Feature

1. **Create feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Create component/module** in appropriate app:
   - UI: `apps/ui/src/components/` or `apps/ui/src/features/`
   - Gateway: `apps/gateway/src/services/` or `apps/gateway/src/routes/`
   - Agent: `apps/agent/ag3nt_agent/` (modules)

3. **Add tests** alongside code

4. **Document** in README or create ADR

5. **Submit PR** with tests passing

---

## Documentation

### Update Documentation

When making changes:

1. **Update relevant markdown files**:
   - `PROJECT_STRUCTURE.md` - If adding/removing files
   - `CONFIGURATION.md` - If adding config options
   - Component README.md - If changing app behavior
   - `TROUBLESHOOTING.md` - If there's a known workaround

2. **Add code examples** for new features

3. **Update ADR** if architectural decision made

### Documentation Standards

All docs should have:

- **Overview** - What is this?
- **Prerequisites** - What's needed?
- **Installation/Setup** - How to get started?
- **Usage** - How to use it?
- **Configuration** - Optional tunables?
- **Troubleshooting** - Common issues?
- **Related** - Links to related docs

---

## Release Process

Only maintainers:

```bash
# 1. Ensure all tests pass
pnpm test

# 2. Bump version
npm version minor  # or patch/major

# 3. Build
pnpm build

# 4. Create GitHub release with notes

# 5. Publish (if distributing as npm package)
npm publish
```

---

## Code Review Checklist

When reviewing PRs, check:

- ✅ Code follows style guidelines
- ✅ Tests added/updated for changes
- ✅ No console.logs left in code
- ✅ TypeScript types used correctly
- ✅ Error handling implemented
- ✅ No hardcoded secrets/keys
- ✅ Documentation updated
- ✅ Breaking changes documented
- ✅ Commits follow conventional format

---

## Getting Help

- **Discord/Slack** - Ask in community channel
- **GitHub Issues** - Search existing or create new
- **Stack Overflow** - Tag with `ag3nt`
- **Email** - contact@example.com

---

## Related Documentation

- **[DEVELOPER.md](DEVELOPER.md)** - Maintainer documentation
- **[SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md)** - Creating skills
- **[COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md)** - Creating integrations

