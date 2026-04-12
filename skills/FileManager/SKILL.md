---
name: FileManager
description: File system operations. USE WHEN user wants to read files, write files, create directories, manage file system, search files, OR organize files and folders.
---

# FileManager

Comprehensive file system operations with security boundaries and audit logging.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Read** | "read file", "show contents", "cat" | `Workflows/Read.md` |
| **Write** | "write to", "create file", "save" | `Workflows/Write.md` |
| **Search** | "find files", "search for file", "locate" | `Workflows/Search.md` |
| **Organize** | "organize", "move files", "rename" | `Workflows/Organize.md` |

## Examples

**Example 1: File search**
```
User: "Find all TypeScript files modified in the last week"
→ Invokes Search workflow
→ Scans filesystem with date and extension filters
→ Returns sorted list with modification times and sizes
```

## Quick Reference

- **Security:** Respects `protectedDirectories` from settings.json
- **Audit:** All write operations logged to MEMORY/SECURITY/
- **Supported:** Read, write, copy, move, delete, search, glob
