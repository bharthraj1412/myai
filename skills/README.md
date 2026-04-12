# AG3NT Skill System

**The authoritative configuration system for ALL AG3NT skills.**

Adapted from [PAI's Skill System](https://github.com/danielmiessler/Personal_AI_Infrastructure).

---

## TitleCase Naming Convention (MANDATORY)

| Component | Wrong | Correct |
|-----------|-------|---------|
| Skill directory | `web-research`, `WEB_RESEARCH` | `WebResearch` |
| Workflow files | `search.md`, `SEARCH.md` | `Search.md` |
| Tool files | `search-tool.ts` | `SearchTool.ts` |
| YAML name | `name: web-research` | `name: WebResearch` |

**Exception:** `SKILL.md` is always uppercase.

---

## SKILL.md Format

### 1. YAML Frontmatter

```yaml
---
name: SkillName
description: [What it does]. USE WHEN [intent triggers using OR]. [Additional capabilities].
---
```

**Rules:**
- `name` uses TitleCase
- `description` is a single line, max 1024 characters
- `USE WHEN` keyword is MANDATORY — the agent parses this for skill activation
- Use intent-based triggers with `OR` for multiple conditions

### 2. Markdown Body

```markdown
# SkillName

Brief description.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **WorkflowOne** | "trigger phrase" | `Workflows/WorkflowOne.md` |

## Examples

**Example 1: [Use case]**
\```
User: "[Request]"
→ Invokes WorkflowOne workflow
→ [What happens]
→ [Result]
\```
```

---

## Directory Structure

```
SkillName/
├── SKILL.md              # Main skill file (REQUIRED)
├── Tools/                # CLI tools for automation
│   └── ToolName.ts
└── Workflows/            # Operational procedures
    └── WorkflowName.md
```

---

## Personal vs System Skills

- **System Skills (TitleCase):** `WebResearch`, `BrowserControl` — shareable, no personal data
- **Personal Skills (_ALLCAPS):** `_SYSTEM`, `_MYSKILL` — contain personal config, never shared

---

## Bundled Skills

| Skill | Purpose |
|-------|---------|
| AppLauncher | Launch and control desktop applications |
| BrowserControl | Playwright-based web automation |
| CameraCapture | Image capture and processing |
| DailyBriefing | Generate personalized daily summaries |
| DeepReasoning | Extended thinking for complex problems |
| FileManager | File system operations |
| Heartbeat | Health checks and monitoring |
| SystemInfo | System statistics and information |
| VoiceTTS | Text-to-speech and voice generation |
| WebResearch | Search and web scraping |
