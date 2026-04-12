# AG3NT Memory System

**The unified system memory — what happened, what we learned, what we're working on.**

**Version:** 1.0.0 (PAI-inspired architecture)
**Location:** `MEMORY/`

---

## Architecture

```
User Request
    ↓
AG3NT Gateway → Session Transcript
    ↓
Agent Worker → Task Execution
    ↓
Hook Events trigger domain-specific captures:
    ├── Algorithm → WORK/
    ├── RatingCapture → LEARNING/SIGNALS/
    ├── WorkCompletionLearning → LEARNING/
    └── SecurityValidator → SECURITY/
    ↓
Harvesting (periodic):
    ├── SessionHarvester → LEARNING/
    └── LearningPatternSynthesis → LEARNING/SYNTHESIS/
```

---

## Directory Structure

```
MEMORY/
├── WORK/                   # PRIMARY work tracking
│   └── {timestamp}_{slug}/
│       └── PRD.md          # Single source of truth (metadata + ISC + decisions)
├── LEARNING/               # Learnings (includes signals)
│   ├── SYSTEM/             # AG3NT/tooling learnings
│   │   └── YYYY-MM/
│   ├── ALGORITHM/          # Task execution learnings
│   │   └── YYYY-MM/
│   ├── FAILURES/           # Full context dumps for low ratings (1-3)
│   ├── SYNTHESIS/          # Aggregated pattern analysis
│   ├── REFLECTIONS/        # Algorithm performance reflections
│   │   └── algorithm-reflections.jsonl
│   └── SIGNALS/            # User satisfaction ratings
│       └── ratings.jsonl
├── RESEARCH/               # Agent output captures
│   └── YYYY-MM/
├── SECURITY/               # Security audit events
│   └── security-events.jsonl
├── STATE/                  # Operational state (ephemeral)
│   ├── algorithms/         # Per-session algorithm state
│   ├── events.jsonl        # Unified event log
│   ├── current-work.json
│   └── session-names.json
└── README.md
```

## Data Flow

```
User Request → Gateway Session → Agent Worker
    ↓
Algorithm (if complex) → WORK/{slug}/PRD.md + STATE/current-work.json
    ↓
[Work happens — Worker writes PRD directly]
    ↓
RatingCapture → LEARNING/SIGNALS/ + LEARNING/
    ↓
WorkCompletionLearning → LEARNING/ (for significant work)
    ↓
SessionCleanup → WORK/PRD.md (status→COMPLETED), clears STATE/
```

## Naming Conventions

- **Work directories:** `YYYYMMDD-HHMMSS_kebab-task-description`
- **Learning files:** `YYYY-MM-DD-HHMMSS_TYPE_description.md`
- **Event logs:** Append-only JSONL format
