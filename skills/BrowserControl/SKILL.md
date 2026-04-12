---
name: BrowserControl
description: Browser automation and web interaction. USE WHEN user wants to navigate websites, take screenshots, click elements, fill forms, automate browser tasks, OR interact with web pages programmatically.
---

# BrowserControl

Playwright-based browser automation for navigating, interacting with, and capturing web content.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Navigate** | "go to", "open website", "navigate to" | `Workflows/Navigate.md` |
| **Screenshot** | "take screenshot", "capture page" | `Workflows/Screenshot.md` |
| **Interact** | "click", "fill form", "type into" | `Workflows/Interact.md` |
| **Extract** | "extract data from page", "scrape page elements" | `Workflows/Extract.md` |
| **Automate** | "automate workflow", "repeat browser steps" | `Workflows/Automate.md` |

## Examples

**Example 1: Navigate and screenshot**
```
User: "Go to github.com and take a screenshot"
→ Invokes Navigate workflow → Screenshot workflow
→ Launches headless browser, navigates to URL
→ Captures full-page screenshot
→ Returns screenshot path and page metadata
```

**Example 2: Form filling**
```
User: "Fill in the contact form on my website with test data"
→ Invokes Interact workflow
→ Identifies form fields via selectors
→ Fills each field with provided data
→ Optionally submits the form
```

**Example 3: Data extraction**
```
User: "Extract all product prices from this e-commerce page"
→ Invokes Extract workflow
→ Identifies repeating elements matching product pattern
→ Extracts structured data (name, price, URL)
→ Returns formatted table/JSON
```

## Quick Reference

- **Engine:** Playwright (Chromium, Firefox, WebKit)
- **Modes:** Headless (default) or headed for debugging
- **Security:** Sandboxed browser context, no cookie persistence by default
- **Screenshots:** Saved to `MEMORY/RESEARCH/screenshots/`
