---
name: AppLauncher
description: Launch and control desktop applications. USE WHEN user wants to open an application, start a program, launch software, OR run a desktop app.
---

# AppLauncher

Launch and manage desktop applications from natural language commands.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Launch** | "open", "start", "launch", "run" | `Workflows/Launch.md` |
| **List** | "list apps", "what apps", "available programs" | `Workflows/List.md` |
| **Close** | "close", "quit", "stop app" | `Workflows/Close.md` |

## Examples

**Example 1: Launch application**
```
User: "Open VS Code"
→ Invokes Launch workflow
→ Resolves "VS Code" to executable path
→ Launches the application
→ Confirms launch with process info
```

**Example 2: List available apps**
```
User: "What applications can you launch?"
→ Invokes List workflow
→ Scans common application directories
→ Returns categorized list of available apps
```

## Quick Reference

- **Platform:** Windows (PowerShell), macOS (open), Linux (xdg-open)
- **Resolution:** Fuzzy matching for application names
- **Security:** HITL approval for unknown executables
