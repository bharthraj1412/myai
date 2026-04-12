---
name: DeepReasoning
description: Extended thinking for complex problems. USE WHEN user needs deep analysis, complex reasoning, multi-step problem solving, architectural decisions, OR thorough evaluation of tradeoffs.
---

# DeepReasoning

Extended thinking mode for complex problems requiring multi-step analysis, tradeoff evaluation, and thorough reasoning.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Analyze** | "analyze deeply", "think about", "evaluate" | `Workflows/Analyze.md` |
| **Compare** | "compare options", "tradeoff analysis" | `Workflows/Compare.md` |
| **FirstPrinciples** | "first principles", "from scratch", "fundamentals" | `Workflows/FirstPrinciples.md` |
| **Council** | "debate", "multiple perspectives", "council" | `Workflows/Council.md` |

## Examples

**Example 1: Architecture decision**
```
User: "Should I use PostgreSQL or MongoDB for my real-time analytics platform?"
→ Invokes Compare workflow
→ Analyzes requirements against both options
→ Evaluates: performance, scalability, query patterns, ecosystem
→ Delivers decision matrix with clear recommendation
```

**Example 2: First principles analysis**
```
User: "First principles analysis of why our deployment pipeline is slow"
→ Invokes FirstPrinciples workflow
→ Decomposes to root causes
→ Identifies fundamental constraints
→ Proposes solutions from the ground up
```

## Quick Reference

- **Thinking Modes:** Analysis, Comparison, First Principles, Council (multi-agent debate)
- **Output:** Structured reasoning with evidence and confidence levels
- **Integration:** Can spawn sub-agents for parallel analysis
