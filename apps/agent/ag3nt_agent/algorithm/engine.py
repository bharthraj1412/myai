"""
AG3NT Algorithm Engine — Core Orchestrator

The Algorithm is the gravitational center of AG3NT. Everything else
exists to serve it. It provides a universal framework for accomplishing
any task: Current State → Ideal State via verifiable iteration.

7 Phases: OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN

Adapted from PAI Algorithm v3.7.0
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

from .effort import EffortClassifier, EffortLevel
from .prd import PRDManager
from .isc import ISCManager

logger = logging.getLogger(__name__)


class AlgorithmPhase(str, Enum):
    OBSERVE = "observe"
    THINK = "think"
    PLAN = "plan"
    BUILD = "build"
    EXECUTE = "execute"
    VERIFY = "verify"
    LEARN = "learn"
    COMPLETE = "complete"


class AlgorithmMode(str, Enum):
    INTERACTIVE = "interactive"  # Normal user-driven execution
    LOOP = "loop"               # Re-run against failing criteria
    NATIVE = "native"           # Bypass algorithm for simple tasks


class AlgorithmState:
    """Tracks the current state of an Algorithm execution."""
    
    def __init__(self, session_id: str, task: str):
        self.session_id = session_id
        self.task = task
        self.phase = AlgorithmPhase.OBSERVE
        self.effort_level = EffortLevel.STANDARD
        self.mode = AlgorithmMode.INTERACTIVE
        self.started_at = datetime.now().isoformat()
        self.updated_at = self.started_at
        self.prd_path: Optional[str] = None
        self.capabilities_selected: List[str] = []
        self.iteration = 0
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "task": self.task,
            "phase": self.phase.value,
            "effort_level": self.effort_level.value,
            "mode": self.mode.value,
            "started_at": self.started_at,
            "updated_at": self.updated_at,
            "prd_path": self.prd_path,
            "capabilities_selected": self.capabilities_selected,
            "iteration": self.iteration,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AlgorithmState":
        state = cls(data["session_id"], data["task"])
        state.phase = AlgorithmPhase(data.get("phase", "observe"))
        state.effort_level = EffortLevel(data.get("effort_level", "standard"))
        state.mode = AlgorithmMode(data.get("mode", "interactive"))
        state.started_at = data.get("started_at", "")
        state.updated_at = data.get("updated_at", "")
        state.prd_path = data.get("prd_path")
        state.capabilities_selected = data.get("capabilities_selected", [])
        state.iteration = data.get("iteration", 0)
        return state


class AlgorithmEngine:
    """
    The core Algorithm execution engine.
    
    Orchestrates the 7-phase execution loop:
    OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN
    
    Each phase has specific responsibilities and produces artifacts
    that feed into subsequent phases.
    """
    
    PHASES = [
        AlgorithmPhase.OBSERVE,
        AlgorithmPhase.THINK,
        AlgorithmPhase.PLAN,
        AlgorithmPhase.BUILD,
        AlgorithmPhase.EXECUTE,
        AlgorithmPhase.VERIFY,
        AlgorithmPhase.LEARN,
    ]
    
    def __init__(self, memory_dir: str, settings: Optional[Dict] = None):
        self.memory_dir = memory_dir
        self.settings = settings or {}
        self.prd_manager = PRDManager(memory_dir)
        self.isc_manager = ISCManager()
        self.effort_classifier = EffortClassifier(settings)
        self._active_states: Dict[str, AlgorithmState] = {}
        
    def should_enter_algorithm(self, message: str, context: Dict = None) -> bool:
        """
        Determine if a user message should trigger Algorithm mode.
        
        Algorithm mode is for complex tasks. Simple questions, 
        greetings, and quick lookups stay in NATIVE mode.
        """
        # Length heuristic — short messages are usually simple
        if len(message.strip()) < 30:
            return False
            
        # Check for explicit algorithm triggers
        algorithm_triggers = [
            "build", "create", "implement", "design", "architect",
            "refactor", "migrate", "upgrade", "deploy", "analyze",
            "research thoroughly", "deep dive", "comprehensive",
            "plan out", "figure out", "solve this"
        ]
        
        msg_lower = message.lower()
        
        # Check for simple task indicators (skip algorithm)
        simple_indicators = [
            "what is", "what's", "how do i", "explain",
            "list", "show me", "tell me", "hi", "hello",
            "thanks", "thank you", "yes", "no", "ok"
        ]
        
        for indicator in simple_indicators:
            if msg_lower.startswith(indicator):
                return False
        
        for trigger in algorithm_triggers:
            if trigger in msg_lower:
                return True
        
        # Default: use heuristic on message complexity
        # Multiple sentences or technical jargon → algorithm
        sentence_count = msg_lower.count('.') + msg_lower.count('?') + msg_lower.count('!')
        word_count = len(msg_lower.split())
        
        return word_count > 50 or sentence_count > 3
    
    def start(self, session_id: str, task: str) -> AlgorithmState:
        """Start a new Algorithm execution."""
        state = AlgorithmState(session_id, task)
        
        # Classify effort level
        state.effort_level = self.effort_classifier.classify(task)
        
        # Create PRD
        state.prd_path = self.prd_manager.create_prd(
            task=task,
            slug=self.prd_manager.generate_slug(task),
            effort=state.effort_level.value,
        )
        
        # Persist state
        self._active_states[session_id] = state
        self._save_state(state)
        
        logger.info(
            f"Algorithm started: session={session_id}, "
            f"effort={state.effort_level.value}, task={task[:60]}"
        )
        
        return state
    
    def advance_phase(self, session_id: str) -> Optional[AlgorithmPhase]:
        """Advance to the next phase in the Algorithm."""
        state = self._active_states.get(session_id)
        if not state:
            return None
        
        current_idx = self.PHASES.index(state.phase)
        
        if current_idx < len(self.PHASES) - 1:
            state.phase = self.PHASES[current_idx + 1]
        else:
            state.phase = AlgorithmPhase.COMPLETE
        
        state.updated_at = datetime.now().isoformat()
        self._save_state(state)
        
        # Update PRD frontmatter
        if state.prd_path:
            self.prd_manager.update_phase(state.prd_path, state.phase.value)
        
        logger.info(f"Phase advanced: {state.phase.value} (session={session_id})")
        return state.phase
    
    def get_state(self, session_id: str) -> Optional[AlgorithmState]:
        """Get the current algorithm state for a session."""
        if session_id in self._active_states:
            return self._active_states[session_id]
        
        # Try loading from disk
        return self._load_state(session_id)
    
    def get_phase_prompt(self, state: AlgorithmState) -> str:
        """Generate the phase-specific prompt/instructions for the current phase."""
        prompts = {
            AlgorithmPhase.OBSERVE: self._observe_prompt(state),
            AlgorithmPhase.THINK: self._think_prompt(state),
            AlgorithmPhase.PLAN: self._plan_prompt(state),
            AlgorithmPhase.BUILD: self._build_prompt(state),
            AlgorithmPhase.EXECUTE: self._execute_prompt(state),
            AlgorithmPhase.VERIFY: self._verify_prompt(state),
            AlgorithmPhase.LEARN: self._learn_prompt(state),
        }
        return prompts.get(state.phase, "")
    
    def complete(self, session_id: str) -> None:
        """Mark the Algorithm as complete."""
        state = self._active_states.pop(session_id, None)
        if state:
            state.phase = AlgorithmPhase.COMPLETE
            state.updated_at = datetime.now().isoformat()
            self._save_state(state)
    
    # --- Phase Prompt Generators ---
    
    def _observe_prompt(self, state: AlgorithmState) -> str:
        return f"""━━━ 👁️ OBSERVE ━━━ 1/7

REQUEST REVERSE ENGINEERING:
- What did the user explicitly ask for?
- What is implied but not stated?
- What should explicitly NOT happen?
- How quickly do they need the result?

EFFORT LEVEL: {state.effort_level.value.upper()}
ISC Range: {self.effort_classifier.get_isc_range(state.effort_level)}

Generate Ideal State Criteria (ISC) — atomic, verifiable checkboxes.
Each criterion: 8-12 words, binary testable, one thing per criterion.

Write ISC directly to PRD at: {state.prd_path}"""

    def _think_prompt(self, state: AlgorithmState) -> str:
        return """━━━ 🧠 THINK ━━━ 2/7

Pressure test the ISC criteria:
- RISKIEST ASSUMPTIONS: 2-12 risks
- PREMORTEM: 2-12 ways this could fail
- PREREQUISITES CHECK: What must be true before starting?

Refine ISC — split compound criteria, add missing failure modes."""

    def _plan_prompt(self, state: AlgorithmState) -> str:
        return """━━━ 📋 PLAN ━━━ 3/7

Validate prerequisites and plan the execution:
- Technical approach and key decisions
- Order of operations
- Capability selection validation"""

    def _build_prompt(self, state: AlgorithmState) -> str:
        return """━━━ 🔨 BUILD ━━━ 4/7

Invoke selected capabilities and prepare for execution.
Every capability selected in OBSERVE must be invoked here or in EXECUTE.
Make non-obvious decisions and document them in the PRD."""

    def _execute_prompt(self, state: AlgorithmState) -> str:
        return """━━━ ⚡ EXECUTE ━━━ 5/7

Perform the work. As each ISC criterion is satisfied:
1. Mark it [x] in the PRD immediately
2. Update the progress counter in frontmatter
Do NOT wait for VERIFY — update the moment a criterion passes."""

    def _verify_prompt(self, state: AlgorithmState) -> str:
        return """━━━ ✅ VERIFY ━━━ 6/7

For EACH ISC criterion in the PRD:
1. Test that it is actually complete
2. Mark [x] if verified, add evidence
3. Check that ALL selected capabilities were actually invoked

This is the critical step for achieving Ideal State."""

    def _learn_prompt(self, state: AlgorithmState) -> str:
        return """━━━ 📚 LEARN ━━━ 7/7

Algorithm reflection:
- What should I have done differently?
- What would a smarter algorithm have done?
- What capabilities should I have used?
- What would improve this algorithm for future tasks?

Write reflection to MEMORY/LEARNING/REFLECTIONS/."""

    # --- State Persistence ---
    
    def _save_state(self, state: AlgorithmState) -> None:
        """Save algorithm state to disk."""
        state_dir = os.path.join(self.memory_dir, "STATE", "algorithms")
        os.makedirs(state_dir, exist_ok=True)
        
        filepath = os.path.join(state_dir, f"{state.session_id}.json")
        with open(filepath, "w") as f:
            json.dump(state.to_dict(), f, indent=2)
    
    def _load_state(self, session_id: str) -> Optional[AlgorithmState]:
        """Load algorithm state from disk."""
        filepath = os.path.join(
            self.memory_dir, "STATE", "algorithms", f"{session_id}.json"
        )
        if os.path.exists(filepath):
            with open(filepath) as f:
                data = json.load(f)
            state = AlgorithmState.from_dict(data)
            self._active_states[session_id] = state
            return state
        return None
