---
name: SystemInfo
description: System statistics and information. USE WHEN user wants system info, CPU usage, memory usage, disk space, OS details, OR hardware information.
---

# SystemInfo

System statistics, hardware information, and resource monitoring.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Overview** | "system info", "what system", "specs" | `Workflows/Overview.md` |
| **Resources** | "CPU usage", "memory usage", "disk space" | `Workflows/Resources.md` |
| **Processes** | "running processes", "what's using CPU" | `Workflows/Processes.md` |

## Examples

**Example 1: System overview**
```
User: "What are my system specs?"
→ Invokes Overview workflow
→ Gathers: OS, CPU, RAM, GPU, disk, network
→ Returns formatted system profile
```

## Quick Reference

- **Platform:** Cross-platform (Windows, macOS, Linux)
- **Metrics:** CPU, RAM, disk, network, GPU, uptime
- **Format:** Structured table output
