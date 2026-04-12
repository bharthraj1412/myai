# AG3NT Shared Utilities (`packages/shared/`)

Shared TypeScript code, types, utilities, and constants used across all AG3NT apps and integrations.

---

## Overview

The shared package provides:

- **Types** - TypeScript interfaces for core concepts (Chat, Model, Tool, etc.)
- **Constants** - Shared constants (ports, provider lists, etc.)
- **Utilities** - Helper functions (logging, error handling, validation, formatting)
- **Schema** - Data validation schemas

This ensures consistency and type safety across the monorepo.

---

## Installation

Shared types and utilities are automatically available in all workspace packages:

```typescript
import { ChatMessage, LLMModel } from '@ag3nt/shared/types';
import { logger } from '@ag3nt/shared/utils';
```

No additional installation needed if developing within the monorepo.

---

## Core Exports

### Types (`types/index.ts`)

**Chat Types**:
```typescript
import {
  ChatMessage,      // Single chat message
  Conversation,     // Chat history + metadata
  StreamEvent,      // Real-time stream event
  Role              // 'user' | 'assistant' | 'system'
} from '@ag3nt/shared/types';
```

**Model Types**:
```typescript
import {
  LLMModel,              // Model configuration
  ModelProvider,         // 'anthropic' | 'openai' | etc.
  ModelConfig,           // Provider-specific settings
  TokenUsage             // Token count info
} from '@ag3nt/shared/types';
```

**Tool Types**:
```typescript
import {
  Tool,                  // Tool definition
  ToolParameter,         // Parameter schema
  ToolExecution,         // Execution request/response
  ToolResult             // Tool execution result
} from '@ag3nt/shared/types';
```

**Skill Types**:
```typescript
import {
  Skill,                 // Skill definition
  SkillTool,             // Tool within a skill
  SkillMetadata          // Skill metadata
} from '@ag3nt/shared/types';
```

**Integration Types**:
```typescript
import {
  Integration,           // Integration definition
  AuthConfig,            // Auth configuration
  IntegrationTool        // Tool from integration
} from '@ag3nt/shared/types';
```

### Constants (`constants/index.ts`)

**Ports**:
```typescript
import { PORTS } from '@ag3nt/shared/constants';

PORTS.GATEWAY      // 18789
PORTS.AGENT        // 18790
PORTS.UI           // 3000
PORTS.BROWSER_WS   // 9222
```

**Providers**:
```typescript
import { LLM_PROVIDERS } from '@ag3nt/shared/constants';

LLM_PROVIDERS.ANTHROPIC    // 'anthropic'
LLM_PROVIDERS.OPENAI       // 'openai'
LLM_PROVIDERS.OPENROUTER   // 'openrouter'
LLM_PROVIDERS.GEMINI       // 'google'
// ... more providers
```

**Channels**:
```typescript
import { CHANNELS } from '@ag3nt/shared/constants';

CHANNELS.SLACK             // 'slack'
CHANNELS.DISCORD           // 'discord'
CHANNELS.TELEGRAM          // 'telegram'
CHANNELS.CLI               // 'cli'
// ... more channels
```

### Utilities (`utils/index.ts`)

**Logger**:
```typescript
import { logger } from '@ag3nt/shared/utils';

logger.info('Starting server');
logger.debug('Debug info', { data: 'value' });
logger.warn('Warning message');
logger.error('Error occurred', new Error('details'));
```

**Error Handling**:
```typescript
import {
  AppError,              // Base application error
  ValidationError,       // Input validation error
  AuthenticationError,   // Auth failure
  NotFoundError          // Resource not found
} from '@ag3nt/shared/utils';

throw new ValidationError('Invalid email format');
```

**Validation**:
```typescript
import { validate } from '@ag3nt/shared/utils';

// Validate email
validate.email('user@example.com');  // true/false

// Validate URL
validate.url('https://example.com');

// Validate object schema
validate.schema({ name: string }, data);
```

**Formatting**:
```typescript
import { format } from '@ag3nt/shared/utils';

format.bytes(1024);           // '1 KB'
format.date(new Date());      // 'Jan 15, 2024'
format.duration(3661);        // '1h 1m 1s'
format.code(codeString);      // Highlight syntax
```

---

## Directory Structure

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── index.ts           # Main types export
│   │   ├── chat.ts            # Chat message types
│   │   ├── model.ts           # LLM model types
│   │   ├── tool.ts            # Tool definition types
│   │   ├── skill.ts           # Skill types
│   │   ├── integration.ts      # Integration types
│   │   ├── auth.ts            # Auth config types
│   │   └── streaming.ts       # Stream event types
│   ├── constants/
│   │   ├── index.ts           # Main constants export
│   │   ├── ports.ts           # Port numbers
│   │   ├── providers.ts       # LLM provider list
│   │   ├── channels.ts        # Channel types
│   │   └── models.ts          # Model name mappings
│   ├── utils/
│   │   ├── index.ts           # Main utils export
│   │   ├── logger.ts          # Logging (info, debug, warn, error)
│   │   ├── error.ts           # Custom error classes
│   │   ├── validation.ts      # Input validation functions
│   │   ├── formatting.ts      # String/data formatting
│   │   ├── api.ts             # API helpers
│   │   └── crypto.ts          # Encryption utilities
│   └── index.ts               # Package entry point
├── package.json
├── tsconfig.json
└── README.md (this file)
```

---

## Usage Examples

### In Gateway

```typescript
// apps/gateway/src/api/chat.ts
import { ChatMessage, LLMModel } from '@ag3nt/shared/types';
import { logger } from '@ag3nt/shared/utils';
import { PORTS } from '@ag3nt/shared/constants';

export async function handleChat(message: ChatMessage, model: LLMModel) {
  logger.info('Processing chat', { model: model.id });
  
  try {
    // Implementation
  } catch (error) {
    logger.error('Chat failed', error);
  }
}
```

### In Agent Worker

```typescript
// apps/agent/ag3nt_agent/worker.py
# Can import types via TypeScript stubs or just reference JSON schemas

from ag3nt_agent.types import ChatMessage, LLMModel

def process_message(message: ChatMessage, model: LLMModel):
    logger.info(f"Processing message from {message.role}")
    # Implementation
```

### In UI

```typescript
// apps/ui/lib/hooks/useChat.ts
import { ChatMessage, StreamEvent } from '@ag3nt/shared/types';
import { logger } from '@ag3nt/shared/utils';

export function useChat() {
  const handleMessage = (message: ChatMessage) => {
    logger.debug('New message', { id: message.id });
  };
  
  return { handleMessage };
}
```

### In Integrations

```typescript
// community/stripe/index.ts
import { Tool, ToolResult } from '@ag3nt/shared/types';
import { logger } from '@ag3nt/shared/utils';

export const tools: Record<string, Tool> = {
  create_charge: {
    description: "Create a charge",
    parameters: { /* ... */ },
    execute: async (params) => {
      logger.info('Creating Stripe charge', { amount: params.amount });
      // Implementation
    }
  }
};
```

---

## Adding to Shared

### When to Add Code to Shared

✅ **DO add to shared**:
- Common types used in 2+ apps
- Utility functions used in 2+ apps
- Constants referenced across packages
- Error/logging infrastructure

❌ **DON'T add to shared**:
- App-specific components or logic
- UI components (go in `apps/ui/components`)
- Feature-specific utilities (keep in respective app)

### How to Add

1. Create new file in appropriate subfolder (`types/`, `utils/`, `constants/`)
2. Export from respective `index.ts`
3. Export from `packages/shared/src/index.ts`
4. Update this README

Example: Adding new error type

```typescript
// packages/shared/src/utils/error.ts
export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT_EXCEEDED');
  }
}

// packages/shared/src/utils/index.ts
export * from './error';
```

---

## Type Safety

Shared types are TypeScript-first, but Python integrations can use:

1. **Type hints** - Reference TypeScript type definitions as documentation
2. **JSON Schema** - All types convert to JSON schema for Python validation
3. **Runtime validation** - Use pydantic models in Python

Example:

```typescript
// TypeScript type
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// Python equivalent
from pydantic import BaseModel

class ChatMessage(BaseModel):
    id: str
    role: Literal['user', 'assistant', 'system']
    content: str
    timestamp: int
```

---

## Updating Shared

When updating shared types or utilities:

1. Maintain backward compatibility where possible
2. Increment package version: `npm version patch`
3. Update CHANGELOG
4. Document breaking changes

```bash
cd packages/shared
npm version minor  # for new features
npm version patch  # for bugfixes
```

---

## Performance Considerations

- **No circular imports**: Shared should not import from apps
- **Lazy loading**: Large utilities can be lazy-loaded if needed
- **Tree shaking**: Exports are designed for ES6 tree-shaking

```typescript
// ✅ GOOD - Tree-shakeable
import { logger } from '@ag3nt/shared/utils';

// ❌ BAD - Pulls entire shared package
import * as shared from '@ag3nt/shared';
```

---

## Related Documentation

- **[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)** - Overall codebase structure
- **[PROJECT_ARCHITECTURE.md](../PROJECT_ARCHITECTURE.md)** - System design
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines

