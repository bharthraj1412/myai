# AG3NT Documentation Index

Complete reference to all AG3NT documentation. **Start here** if you're lost.

---

## Quick Start by Role

### I'm a New Developer (Onboarding)

1. Read **[GETTING_STARTED.md](GETTING_STARTED.md)** (30 min)
   - Get AG3NT running locally
   - Verify setup works
   
2. Read **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** (20 min)
   - Understand the 4-app model
   - See how components connect
   
3. Read **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** (15 min)
   - Navigate the codebase
   - Find where to make changes

4. Explore **[apps/](apps/)** READMEs (30 min)
   - Understand each app's role
   - See startup options

**Next**: Pick a task and read relevant guide

---

### I Want to Deploy AG3NT

1. Read **[DEPLOYMENT.md](DEPLOYMENT.md)** (45 min)
   - Choose deployment model (local, Docker, Kubernetes, cloud)
   - Follow model-specific steps
   
2. Read **[CONFIGURATION.md](CONFIGURATION.md)** (30 min)
   - Set environment variables
   - Configure LLM provider
   - Set up integrations

3. Read **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** (on-demand)
   - Common deployment issues
   - Solutions for startup problems

---

### I'm Contributing Code

1. Read **[CONTRIBUTING.md](CONTRIBUTING.md)** (30 min)
   - Workflow (fork, branch, PR)
   - Code style (TypeScript, Python)
   - Testing requirements

2. Choose your contribution type:
   - **New Skill**: Read [SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md#creating-custom-skills)
   - **New Integration**: Read [COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md#creating-integrations)
   - **Bug Fix**: Read [DEVELOPER.md](DEVELOPER.md)
   - **Feature**: Read app's README.md

---

### I Have a Problem

**First**: Check **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** for solutions.

If not there:
- Search existing **GitHub Issues**
- Ask on **Discord/Slack**
- Create new **GitHub Issue** with:
  - Error message
  - Steps to reproduce
  - System info (OS, Node, Python versions)

---

## Complete Documentation Map

### Foundation Documents

| Document | Purpose | Audience | Time |
|----------|---------|----------|------|
| **[README.md](README.md)** | Project overview | Everyone | 5m |
| **[GETTING_STARTED.md](GETTING_STARTED.md)** | Local setup guide | New developers | 30m |
| **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** | System design & tech stack | All developers | 20m |
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | Navigate codebase | Developers | 15m |

### Application Documentation

| Document | Purpose | Audience | Time |
|----------|---------|----------|------|
| **[apps/gateway/README.md](apps/gateway/README.md)** | HTTP daemon & WebSocket server | Backend developers | 30m |
| **[apps/agent/README.md](apps/agent/README.md)** | AI worker & tool execution | AI engineers | 25m |
| **[apps/ui/README.md](apps/ui/README.md)** | Web dashboard | Frontend developers | 20m |
| **[apps/tui/README.md](apps/tui/README.md)** | Terminal interface | CLI users | 15m |

### Framework & Extension Documents

| Document | Purpose | Audience | Time |
|----------|---------|----------|------|
| **[SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md)** | How to create skills | Contributors | 40m |
| **[COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md)** | How to create integrations | Contributors | 40m |
| **[packages/README.md](packages/README.md)** | Shared utilities reference | Developers | 15m |
| **[skills/README.md](skills/README.md)** | Navigate bundled skills | All users | 10m |
| **[config/README.md](config/README.md)** | Configuration templates | DevOps | 10m |
| **[scripts/README.md](scripts/README.md)** | Automation scripts | DevOps | 10m |

### Operations & Development Documents

| Document | Purpose | Audience | Time |
|----------|---------|----------|------|
| **[CONFIGURATION.md](CONFIGURATION.md)** | Environment & config reference | Ops/DevOps | 30m |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deployment guide | DevOps | 45m |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Code contribution workflow | Contributors | 30m |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Common problems & solutions | Everyone | On-demand |

### Reference Documents

| Document | Purpose | Audience | Time |
|----------|---------|----------|------|
| **[DEVELOPER.md](DEVELOPER.md)** | Maintainer guide | Maintainers | 30m |
| **[ADR/README.md](ADR/README.md)** | Architectural decisions | All developers | On-demand |
| **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** | This file | Everyone | 5m |

---

## Study Paths

### Path 1: Local Development Setup (1-2 hours)

Goal: Get AG3NT running locally and make your first code change.

1. **[GETTING_STARTED.md](GETTING_STARTED.md)** (30m)
   - Follow step-by-step setup
   - Get all 3 services running
   - Access UI at http://localhost:3000

2. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** (15m)
   - Find where UI code lives
   - Understand app separation

3. **[apps/ui/README.md](apps/ui/README.md)** (20m)
   - Learn Next.js app structure
   - Make a small UI change

4. **[Contributing](CONTRIBUTING.md#code-style)** (15m)
   - Commit your change
   - Understand code style

---

### Path 2: Add Custom Skill (2-3 hours)

Goal: Create a custom AI skill and integrate it.

1. **[SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md)** (40m)
   - Understand skill format
   - Read examples
   
2. **[skills/README.md](skills/README.md)** (15m)
   - See what skills exist
   - Understand folder structure

3. Create your skill (1 hour)
   ```bash
   cp -r skills/example-skill skills/my-skill
   # Build it...
   ```

4. **[CONTRIBUTING.md](CONTRIBUTING.md)** (30m)
   - Test your code
   - Write tests
   - Create PR

---

### Path 3: Add Integration (2-3 hours)

Goal: Create integration for an external API/service.

1. **[COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md)** (40m)
   - Understand integration format
   - Read 5 examples

2. **[config/README.md](config/README.md)** (10m)
   - Understand configuration

3. Create your integration (1 hour)
   ```bash
   mkdir -p community/my-service
   # Build it...
   ```

4. **[CONTRIBUTING.md](CONTRIBUTING.md)** (30m)
   - Test thoroughly
   - Document
   - Create PR

---

### Path 4: Production Deployment (3-4 hours)

Goal: Deploy AG3NT to production environment.

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** (1 hour)
   - Choose deployment model (Docker or Kubernetes)
   - Follow step-by-step guide

2. **[CONFIGURATION.md](CONFIGURATION.md)** (30m)
   - Set environment variables
   - Configure LLM provider
   - Set up integrations

3. **[scripts/README.md](scripts/README.md)** (15m)
   - Understand build/test scripts

4. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** (30m)
   - Check common startup issues
   - Monitor deployment health

---

### Path 5: Fix a Bug (1-2 hours)

Goal: Find and fix an issue.

1. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** (15m)
   - Understand the problem

2. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** (15m)
   - Navigate to relevant code

3. **[DEVELOPER.md](DEVELOPER.md)** (20m)
   - Debugging tips
   - Testing strategy

4. **[CONTRIBUTING.md](CONTRIBUTING.md)** (30m)
   - Code style
   - Testing requirements
   - PR process

---

## Key Concepts

### The 4-App Model

AG3NT consists of 4 services:

| App | Purpose | Tech | Port |
|-----|---------|------|------|
| **UI** | Web dashboard interface | Next.js, React | 3000 |
| **Gateway** | API server & session manager | Node.js, Express, WebSocket | 18789 |
| **Agent** | AI inference & tool execution | Python, DeepAgents | 18790 |
| **TUI** | Terminal interface | TypeScript | CLI |

**Flow**: User → UI/TUI → Gateway → Agent → Tools/Skills

---

### Skills vs Integrations

| Aspect | Skill | Integration |
|--------|-------|-------------|
| **What is it?** | AI capability (reasoning, vision, etc.) | External API connection (Slack, Stripe, etc.) |
| **Files** | SKILL.md, index.ts, package.json | INTEGRATION.md, index.ts, package.json |
| **Location** | `/skills/` | `/community/` |
| **Uses** | Extends agent reasoning | Connect external services |
| **Examples** | web-research, file-manager | Slack, Stripe, Notion |

---

### Configuration Layers

AG3NT configuration loads in order (later overrides earlier):

1. **Hard defaults** - Built-in code defaults
2. **Default config** - `config/default-config.yaml` 
3. **User config** - `~/.ag3nt/config.yaml`
4. **Environment** - `.env` file
5. **CLI args** - Command-line parameters (highest priority)

---

## Frequently Asked Questions

### "Which documentation should I read first?"

- **Just getting started?** → [GETTING_STARTED.md](GETTING_STARTED.md)
- **Want to understand the system?** → [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
- **Lost in the code?** → [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **Something's broken?** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### "How do I deploy this?"

→ [DEPLOYMENT.md](DEPLOYMENT.md) - Follow the section matching your environment

### "How do I add a skill/integration?"

→ [SKILLS_FRAMEWORK.md](SKILLS_FRAMEWORK.md) or [COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md)

### "What's the difference between skills and integrations?"

→ See [Key Concepts](#key-concepts) above

### "How do I contribute code?"

→ [CONTRIBUTING.md](CONTRIBUTING.md)

### "Something's not working. Where do I look?"

→ [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## File Organization

```
AG3NT-main/
├── README.md                      ← Overview
├── GETTING_STARTED.md             ← New developer start
├── PROJECT_ARCHITECTURE.md        ← System design
├── PROJECT_STRUCTURE.md           ← Codebase map
│
├── CONFIGURATION.md               ← Config reference
├── DEPLOYMENT.md                  ← Deploy guide
├── CONTRIBUTING.md                ← Contribution guide
├── TROUBLESHOOTING.md             ← Problem solving
│
├── SKILLS_FRAMEWORK.md            ← Create skills
├── COMMUNITY_INTEGRATIONS.md      ← Create integrations
│
├── DEVELOPER.md                   ← Maintainer guide
├── DOCUMENTATION_INDEX.md         ← This file
│
├── apps/
│   ├── gateway/README.md          ← Gateway docs
│   ├── agent/README.md            ← Agent docs
│   ├── ui/README.md               ← UI docs
│   └── tui/README.md              ← TUI docs
│
├── packages/README.md             ← Shared utils
├── skills/README.md               ← Skills folder
├── config/README.md               ← Config folder
├── scripts/README.md              ← Scripts folder
│
└── ADR/                           ← Architecture decisions
    └── README.md
```

---

## Next Steps

1. **Pick your role** from [Quick Start by Role](#quick-start-by-role)
2. **Follow the recommended path** for your goal
3. **Read docs in order** for best understanding
4. **Reference back here** when lost

---

## Keep Learning

- Read **[DEVELOPER.md](DEVELOPER.md)** for advanced maintenance
- Explore **[ADR/](ADR/)** for why certain choices were made
- Study example **[skills/](skills/)** and **[community/](community/)** for best practices
- Check **[CONTRIBUTING.md](CONTRIBUTING.md)** before making changes

---

**Questions?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or create an issue.

