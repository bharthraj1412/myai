---
name: CameraCapture
description: Image capture and visual processing. USE WHEN user wants to capture images, take photos, use camera, screenshot desktop, OR process visual input.
---

# CameraCapture

Image capture from cameras and screen, with visual processing capabilities.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Capture** | "take photo", "capture image", "use camera" | `Workflows/Capture.md` |
| **Screenshot** | "screenshot desktop", "capture screen" | `Workflows/Screenshot.md` |
| **Analyze** | "what do you see", "analyze image" | `Workflows/Analyze.md` |

## Examples

**Example 1: Camera capture**
```
User: "Take a photo using my webcam"
→ Invokes Capture workflow
→ Accesses system camera
→ Captures and saves image
→ Returns image path and metadata
```

## Quick Reference

- **Sources:** Webcam, screen capture, file system
- **Analysis:** Vision model integration for image understanding
- **Output:** Saved to MEMORY/RESEARCH/captures/
