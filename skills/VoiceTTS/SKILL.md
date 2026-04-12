---
name: VoiceTTS
description: Text-to-speech and voice generation. USE WHEN user wants text-to-speech, voice output, read aloud, speak text, OR voice notifications.
---

# VoiceTTS

Text-to-speech voice generation with multiple provider support.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Speak** | "say", "read aloud", "speak", "TTS" | `Workflows/Speak.md` |
| **Configure** | "change voice", "voice settings", "configure TTS" | `Workflows/Configure.md` |
| **Notify** | "voice notification", "announce" | `Workflows/Notify.md` |

## Examples

**Example 1: Speak text**
```
User: "Read this summary aloud"
→ Invokes Speak workflow
→ Processes text through TTS provider (Edge TTS / ElevenLabs)
→ Plays audio through system speakers
```

**Example 2: Voice notification**
```
User: "Announce when the build is complete"
→ Invokes Notify workflow
→ Watches for build completion event
→ Generates and plays voice announcement
```

## Quick Reference

- **Providers:** Edge TTS (free), ElevenLabs (premium), Google Cloud TTS
- **Voice Server:** localhost:8888
- **Prosody:** Natural speech patterns with emphasis control
- **Configuration:** Voice ID and provider set in settings.json
