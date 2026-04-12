---
skill: Heartbeat
version: 2.0.0
author: AG3NT
category: system
triggers:
  - heartbeat
  - health check
  - scheduled check
  - monitoring
---

# Heartbeat

**USE WHEN** the system runs periodic health checks, scheduled tasks, or automated monitoring routines.

## Description

Manages periodic system health checks and automated status reporting. Runs on a configurable interval to verify system health, check pending tasks, and trigger scheduled work.

## Capabilities

- System health verification
- Pending task check and reporting
- Scheduled notification triggers
- Uptime and responsiveness monitoring

## Workflow

```
[Heartbeat Trigger] → [Check System Health] → [Review Pending Work]
    → [Send Status Report] → [Schedule Next Check]
```

## Configuration

- **Interval**: Configurable via `settings.json` → `scheduler.heartbeatMinutes`
- **Channel**: Routes notifications to configured channels (Telegram, Discord, etc.)

## Integration

- Triggered by Gateway Scheduler
- Reports to all connected channels
- Logs to `MEMORY/STATE/events.jsonl`
