---
name: WebResearch
description: Web search and content extraction. USE WHEN user wants to search the web, find information online, scrape websites, extract content from URLs, do internet research, OR look up current information.
---

# WebResearch

Complete web search and content extraction skill powered by multiple search providers.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Search** | "search for", "find information", "look up" | `Workflows/Search.md` |
| **Scrape** | "scrape", "extract from URL", "get content from" | `Workflows/Scrape.md` |
| **DeepResearch** | "research thoroughly", "deep dive", "comprehensive research" | `Workflows/DeepResearch.md` |

## Examples

**Example 1: Quick web search**
```
User: "Search for the latest AI agent frameworks in 2026"
→ Invokes Search workflow
→ Performs web search via configured provider
→ Returns formatted results with sources and summaries
```

**Example 2: URL content extraction**
```
User: "Extract the main content from this article URL"
→ Invokes Scrape workflow
→ Fetches and parses the URL content
→ Returns cleaned, structured text
```

**Example 3: Deep research**
```
User: "Do comprehensive research on WebAssembly performance benchmarks"
→ Invokes DeepResearch workflow
→ Spawns multiple search agents in parallel
→ Aggregates, deduplicates, and synthesizes findings
→ Returns structured research report with citations
```

## Quick Reference

- **Search Providers:** Configurable (Google, Bing, DuckDuckGo, Brave Search)
- **Content Extraction:** Readability-based article parsing
- **Output Format:** Markdown with source attribution
- **Rate Limiting:** Respects provider rate limits automatically
