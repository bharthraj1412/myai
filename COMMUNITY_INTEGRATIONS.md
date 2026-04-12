# Community Integrations Guide

This guide explains how integrations work, and how to create new integrations for services like Stripe, Slack, Salesforce, etc.

---

## What Are Integrations?

**Integrations** are self-contained modules that enable your agent to interact with external services. AG3NT includes 370+ pre-built integrations for popular platforms.

### Key Characteristics

- **Modular**: Each integration lives in `/community/<service-name>/`
- **Self-Contained**: All code, dependencies, and configs in one folder
- **Tool-Based**: Each integration exports tools/actions the LLM can use
- **Authenticated**: Handles API keys and OAuth flows
- **Discoverable**: Automatically loaded by the Agent Worker

### Integration Categories

AG3NT supports 370+ integrations across 15+ categories:

| Category | Count | Examples |
|----------|-------|----------|
| **AI & LLM Services** | 15+ | Claude, OpenAI, Gemini, Groq, Mistral, Perplexity |
| **CRM & Sales** | 20+ | Salesforce, HubSpot, Pipedrive, Linear, Copper |
| **Productivity** | 40+ | Notion, Jira, Asana, Monday.com, Trello, Coda |
| **Communication** | 30+ | Slack, Discord, Teams, Telegram, Gmail, Twilio |
| **E-Commerce** | 25+ | Shopify, BigCommerce, Stripe, Square, PayPal |
| **Finance** | 15+ | Stripe, Chargebee, Baremetrics, Bokio |
| **Analytics** | 20+ | Google Analytics, Mixpanel, Chartly |
| **Storage** | 20+ | AWS S3, Azure Blob, Google Drive, Dropbox, Box |
| **HR & People** | 15+ | BambooHR, Ashby, Assembled |
| **DevOps** | 15+ | GitHub, GitLab, Jenkins, CircleCI |
| **Databases** | 20+ | PostgreSQL, MongoDB, Firebase, Supabase |
| **Other Services** | 120+ | Calendar, Email, SMS, Legal tools, etc. |

---

## Integration Structure

Each integration (e.g., `community/stripe/`) follows this structure:

```
community/stripe/
├── index.ts                       # Tool definitions (TypeScript)
├── package.json                   # Metadata, auth schema, dependencies
├── README.md                       # Usage documentation
├── types.ts                        # TypeScript interfaces
├── constants.ts                    # API endpoints, config
├── tests/
│   └── integration.test.ts        # Integration tests
└── examples/
    └── usage.md                    # Usage examples
```

### index.ts - Tool Definitions

Exports functions that the LLM can call:

```typescript
// community/stripe/index.ts
export const tools = {
  create_charge: {
    description: "Create a charge using Stripe",
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Amount in cents (e.g., 1000 for $10)"
        },
        currency: {
          type: "string",
          enum: ["usd", "eur", "gbp"],
          description: "Currency code"
        },
        card_token: {
          type: "string",
          description: "Stripe card token"
        }
      },
      required: ["amount", "currency", "card_token"]
    },
    execute: async (params) => {
      const stripe = require('stripe')(process.env.STRIPE_API_KEY);
      const charge = await stripe.charges.create({
        amount: params.amount,
        currency: params.currency,
        source: params.card_token
      });
      return charge;
    }
  },

  list_customers: {
    description: "List all Stripe customers",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const stripe = require('stripe')(process.env.STRIPE_API_KEY);
      const customers = await stripe.customers.list();
      return customers;
    }
  }
};
```

### package.json - Metadata

Describes the integration:

```json
{
  "name": "@ag3nt/integration-stripe",
  "version": "1.0.0",
  "description": "Stripe payment processing integration",
  "main": "index.ts",
  "author": "AG3NT",
  "license": "MIT",
  
  "ag3nt": {
    "integration_type": "payment",
    "service": "stripe",
    "auth_type": "api_key",
    "
    "auth_schema": {
      "STRIPE_API_KEY": {
        "type": "secret",
        "description": "Stripe Secret API Key",
        "required": true,
        "url": "https://dashboard.stripe.com/apikeys"
      }
    },
    "tools": [
      "create_charge",
      "list_customers",
      "refund_charge",
      "get_balance"
    ]
  },
  
  "dependencies": {
    "stripe": "^13.0.0"
  }
}
```

### README.md - Documentation

```markdown
# Stripe Integration

Charge cards, manage customers, and handle payments.

## Setup

1. Get your API key from https://dashboard.stripe.com/apikeys
2. Set environment variable:
   ```bash
   export STRIPE_API_KEY=sk_live_xxxxx
   ```

## Usage

### Create a Charge

```
Agent: Create a $10 charge to this card token: tok_visa
Output: Charge created successfully (ID: ch_xxxxx)
```

## Tools

- `create_charge(amount, currency, card_token)`
- `list_customers()`
- `refund_charge(charge_id)`
```

---

## Pre-Built Integrations Examples

### 1. Slack Integration (`community/slack/`)

**Purpose**: Send/receive messages, manage channels

**Tools**:
- `send_message(channel_id: string, text: string)`
- `list_channels()`
- `create_channel(name: string)`
- `invite_user(channel_id: string, user_id: string)`

**Auth**: Slack Bot Token

**Use Case**:
```
Agent: Send "Project complete!" to #general
Output: Message sent to #general

Agent: Create a new channel called #project-alpha
Output: Channel created successfully
```

---

### 2. Notion Integration (`community/notion/`)

**Purpose**: Read/write Notion databases and pages

**Tools**:
- `create_page(database_id: string, properties: object)`
- `query_database(database_id: string, filter?: object)`
- `update_page(page_id: string, properties: object)`
- `get_page(page_id: string)`

**Auth**: Notion API Token

**Use Case**:
```
Agent: Query my tasks database and show incomplete items
Output: [list of incomplete tasks]

Agent: Add a new task: "Review PR #123" to my database
Output: Task created with ID p_xxxxx
```

---

### 3. GitHub Integration (`community/github/`)

**Purpose**: Manage repos, issues, pull requests

**Tools**:
- `create_issue(repo: string, title: string, body: string)`
- `list_issues(repo: string, state?: 'open'|'closed')`
- `create_pull_request(repo: string, title: string, head: string, base: string)`
- `merge_pull_request(repo: string, number: number)`

**Auth**: GitHub Personal Access Token

**Use Case**:
```
Agent: Create an issue in my-org/my-repo: "Fix login bug"
Output: Issue #42 created

Agent: List all open PRs in my-org/my-repo
Output: [list of open PRs with details]
```

---

### 4. OpenAI Integration (`community/openai/`)

**Purpose**: Call GPT models for text/image generation

**Tools**:
- `generate_text(prompt: string, model: string)`
- `generate_image(prompt: string)`
- `transcribe_audio(audio_url: string)`

**Auth**: OpenAI API Key

**Use Case**:
```
Agent: Generate an image of "a sunset over mountains"
Output: Image generated and saved

Agent: Transcribe this audio file
Output: [transcribed text]
```

---

### 5. Salesforce Integration (`community/salesforce/`)

**Purpose**: Manage CRM data (leads, accounts, opportunities)

**Tools**:
- `create_lead(first_name: string, last_name: string, email: string)`
- `update_account(account_id: string, data: object)`
- `query_opportunities(filter?: object)`

**Auth**: Salesforce OAuth

**Use Case**:
```
Agent: Create a new lead: "John Doe, john@example.com"
Output: Lead created with ID 00Q...

Agent: Find all opportunities worth > $100k
Output: [list of opportunities with details]
```

---

## Creating a New Integration

### Step 1: Create Integration Folder

```bash
cd community
mkdir my-service
cd my-service
```

### Step 2: Create package.json

```json
{
  "name": "@ag3nt/integration-my-service",
  "version": "0.1.0",
  "description": "Integration with My Service",
  "main": "index.ts",
  
  "ag3nt": {
    "integration_type": "data|communication|payment|etc",
    "service": "my-service",
    "auth_type": "api_key|oauth|bearer",
    "auth_schema": {
      "MY_SERVICE_API_KEY": {
        "type": "secret",
        "description": "API Key from https://my-service.com/settings",
        "required": true
      }
    },
    "tools": ["tool1", "tool2", "tool3"]
  },
  
  "dependencies": {
    "axios": "^1.0.0"
  }
}
```

### Step 3: Create index.ts

```typescript
// community/my-service/index.ts
import axios from 'axios';

const BASE_URL = 'https://api.my-service.com/v1';
const API_KEY = process.env.MY_SERVICE_API_KEY;

export const tools = {
  // Tool 1: Create something
  create_item: {
    description: "Create an item in My Service",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Item name"
        },
        description: {
          type: "string",
          description: "Item description"
        }
      },
      required: ["name"]
    },
    execute: async (params) => {
      const response = await axios.post(`${BASE_URL}/items`, {
        name: params.name,
        description: params.description
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    }
  },

  // Tool 2: List items
  list_items: {
    description: "List all items in My Service",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const response = await axios.get(`${BASE_URL}/items`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      return response.data;
    }
  },

  // Tool 3: Get specific item
  get_item: {
    description: "Get a specific item by ID",
    parameters: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: "Item ID"
        }
      },
      required: ["item_id"]
    },
    execute: async (params) => {
      const response = await axios.get(`${BASE_URL}/items/${params.item_id}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      return response.data;
    }
  }
};
```

### Step 4: Create README.md

```markdown
# My Service Integration

Brief description of the integration.

## Setup

1. Sign up at https://my-service.com
2. Create an API key in settings
3. Set the environment variable:
   ```bash
   export MY_SERVICE_API_KEY=your_api_key
   ```

## Available Tools

- `create_item(name, description)` - Create a new item
- `list_items()` - List all items
- `get_item(item_id)` - Get a specific item

## Examples

### Create an Item

```
Agent: Create an item called "Project Alpha" with description "Q1 project"
Output: Item created with ID item_123
```

### List Items

```
Agent: Show me all items in my account
Output: [list of items...]
```
```

### Step 5: Create Tests (Optional)

```typescript
// community/my-service/tests/integration.test.ts
import { tools } from '../index';

describe('My Service Integration', () => {
  it('should list items', async () => {
    const result = await tools.list_items.execute({});
    expect(Array.isArray(result)).toBe(true);
  });

  it('should create item', async () => {
    const result = await tools.create_item.execute({
      name: 'Test Item'
    });
    expect(result).toHaveProperty('id');
  });
});
```

### Step 6: Install & Test

```bash
# Navigate to integration folder
cd community/my-service

# Install dependencies
npm install

# Run tests
npm test

# Verify it loads with agent
cd apps/agent
python -c "from ag3nt_agent.tools.integrations import load_integrations; print(load_integrations().keys())"
```

---

## Integration Development Best Practices

### 1. Follow Naming Conventions

```typescript
// ✅ GOOD: Descriptive function names
export const tools = {
  send_slack_message: { /* ... */ },
  list_stripe_customers: { /* ... */ },
  create_github_issue: { /* ... */ }
};

// ❌ BAD: Unclear names
export const tools = {
  send: { /* ... */ },
  list: { /* ... */ },
  create: { /* ... */ }
};
```

### 2. Use Proper Error Handling

```typescript
// ✅ GOOD: Meaningful errors
execute: async (params) => {
  if (!params.amount || params.amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  try {
    return await chargeCard(params);
  } catch (error) {
    if (error.code === 'card_declined') {
      throw new Error('Card was declined by the bank');
    }
    throw new Error(`Charge failed: ${error.message}`);
  }
};

// ❌ BAD: Silent failures
execute: async (params) => {
  return await chargeCard(params) || { success: false };
};
```

### 3. Validate API Keys

```typescript
// ✅ GOOD: Check key exists
export const tools = {
  some_tool: {
    execute: async (params) => {
      if (!process.env.MY_SERVICE_API_KEY) {
        throw new Error('MY_SERVICE_API_KEY environment variable not set');
      }
      // Implementation
    }
  }
};

// ❌ BAD: Silently fail
execute: async (params) => {
  const key = process.env.MY_SERVICE_API_KEY || 'default';
  // Wrong - will fail cryptically later
}
```

### 4. Rate Limit Protection

```typescript
// ✅ GOOD: Respect rate limits
let lastCallTime = 0;
const RATE_LIMIT_MS = 1000; // 1 call per second

execute: async (params) => {
  const now = Date.now();
  if (now - lastCallTime < RATE_LIMIT_MS) {
    const wait = RATE_LIMIT_MS - (now - lastCallTime);
    await new Promise(r => setTimeout(r, wait));
  }
  lastCallTime = Date.now();
  // Implementation
};
```

### 5. Document Parameters Clearly

```typescript
// ✅ GOOD: Clear documentation
{
  parameters: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "User email address (must be valid format)"
      },
      send_welcome: {
        type: "boolean",
        description: "Send welcome email after creation",
        default: true
      }
    },
    required: ["email"]
  }
}

// ❌ BAD: Vague
{
  parameters: {
    properties: {
      e: { type: "string" },
      sw: { type: "boolean" }
    }
  }
}
```

---

## Distribution

### Option 1: Include in Repository

Add your integration to `/community` and commit:

```bash
git add community/my-service/
git commit -m "feat: add my-service integration"
git push
```

### Option 2: Publish to npm

```bash
cd community/my-service
npm publish --access public
```

Then reference in `package.json`:

```json
{
  "dependencies": {
    "@ag3nt/integration-my-service": "^0.1.0"
  }
}
```

---

## Real-World Examples

Refer to these integrations as templates:

- **Simple API Integration**: `community/stripe/` (REST API with auth)
- **OAuth Integration**: `community/github/` (OAuth flow handling)
- **Real-Time Integration**: `community/slack/` (WebSocket events)
- **Complex Multi-Tool**: `community/salesforce/` (many related tools)

---

## Related Documentation

- **[SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md)** - Creating skills
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Codebase organization
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** - System design

---

## Submitting New Integrations

To contribute an integration:

1. Create integration in `/community/<service-name>/`
2. Follow the structure and best practices
3. Create comprehensive README and tests
4. Submit PR with description
5. Maintainers review and merge

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed submission guidelines.

