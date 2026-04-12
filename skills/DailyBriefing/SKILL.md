---
name: DailyBriefing
description: Generate personalized daily summaries. USE WHEN user wants a daily briefing, morning summary, daily update, status report, OR overview of what happened today.
---

# DailyBriefing

Generate comprehensive personalized daily briefings drawing from memory, goals, and external sources.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Generate** | "daily briefing", "morning summary", "what's happening" | `Workflows/Generate.md` |
| **Configure** | "configure briefing", "change briefing sections" | `Workflows/Configure.md` |

## Examples

**Example 1: Morning briefing**
```
User: "Give me my daily briefing"
→ Invokes Generate workflow
→ Pulls from: active WORK items, TELOS goals, calendar, weather
→ Summarizes: yesterday's progress, today's priorities, blockers
→ Delivers formatted briefing with voice notification
```

## Quick Reference

- **Sources:** MEMORY/WORK, USER/TELOS, external APIs (weather, calendar)
- **Personalization:** Adapts sections based on USER/PREFERENCES.md
- **Delivery:** Text + optional voice TTS
- **Schedule:** Can be triggered by Heartbeat cron
