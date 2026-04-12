"""
AG3NT Algorithm Middleware — DeepAgents Integration

Integrates the 7-phase Algorithm Engine into the DeepAgents middleware chain.
When a complex task is detected, this middleware:
1. Classifies effort level
2. Creates a PRD in MEMORY/WORK/
3. Injects phase-specific prompts into the system context
4. Tracks phase transitions and ISC progress

Simple queries bypass the algorithm entirely (NATIVE mode).
"""

import logging
import os
import json
from pathlib import Path
from typing import Any, Optional

from langchain.agents.middleware.types import AgentMiddleware, AgentState

from ag3nt_agent.algorithm.engine import AlgorithmEngine, AlgorithmPhase, AlgorithmMode
from ag3nt_agent.algorithm.effort import EffortLevel

logger = logging.getLogger("ag3nt.algorithm")


class AlgorithmMiddleware(AgentMiddleware[AgentState, Any]):
    """DeepAgents middleware that orchestrates the Algorithm Engine.
    
    Intercepts user messages to:
    - Detect complex tasks and activate Algorithm mode
    - Inject phase-specific prompts
    - Track PRD/ISC progress
    - Capture learnings on completion
    """
    
    name = "AlgorithmMiddleware"

    def __init__(self, memory_dir: Optional[str] = None, settings: Optional[dict] = None):
        super().__init__()
        self.tools: list[Any] = []
        self.memory_dir = memory_dir or self._find_memory_dir()
        self.settings = settings or self._load_settings()
        self.engine = AlgorithmEngine(self.memory_dir, self.settings)
        self._active_sessions: set = set()
        
        logger.info("AlgorithmMiddleware initialized (memory_dir=%s)", self.memory_dir)

    def _find_memory_dir(self) -> str:
        """Find the MEMORY directory."""
        # Try repo root first
        current = Path(__file__).resolve()
        repo_root = current.parent.parent.parent.parent
        memory_dir = repo_root / "MEMORY"
        if memory_dir.exists():
            return str(memory_dir)
        
        # Fallback to ~/.ag3nt/MEMORY
        home_memory = Path.home() / ".ag3nt" / "MEMORY"
        home_memory.mkdir(parents=True, exist_ok=True)
        return str(home_memory)

    def _load_settings(self) -> dict:
        """Load settings.json."""
        current = Path(__file__).resolve()
        repo_root = current.parent.parent.parent.parent
        settings_path = repo_root / "config" / "settings.json"
        
        if settings_path.exists():
            try:
                with open(settings_path, encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def on_user_message(self, session_id: str, message: str, state: Any = None) -> Optional[str]:
        """Called when a user message is received.
        
        Returns additional system context to inject, or None.
        """
        # Check if already in algorithm mode
        existing = self.engine.get_state(session_id)
        if existing and existing.phase != AlgorithmPhase.COMPLETE:
            # Already in algorithm — provide phase prompt
            return self._get_phase_context(existing)

        # Evaluate if this message should trigger algorithm mode
        if not self.engine.should_enter_algorithm(message):
            return None  # NATIVE mode — no intervention
        
        # Start the algorithm
        algo_state = self.engine.start(session_id, message)
        self._active_sessions.add(session_id)
        
        logger.info(
            "Algorithm ACTIVATED: session=%s, effort=%s, task=%s",
            session_id, algo_state.effort_level.value, message[:60]
        )
        
        # Return the OBSERVE phase prompt
        return self._get_phase_context(algo_state)

    def on_assistant_response(self, session_id: str, response: str, state: Any = None) -> None:
        """Called after the assistant responds. Advances phases if appropriate."""
        algo_state = self.engine.get_state(session_id)
        if not algo_state or algo_state.phase == AlgorithmPhase.COMPLETE:
            return

        # Auto-advance phase based on response content heuristics
        phase_indicators = {
            AlgorithmPhase.OBSERVE: ["## Criteria", "ISC-", "- [ ]"],
            AlgorithmPhase.THINK: ["RISKIEST", "PREMORTEM", "risks"],
            AlgorithmPhase.PLAN: ["approach", "order of operations", "prerequisites"],
            AlgorithmPhase.BUILD: ["invoking", "capability", "preparing"],
            AlgorithmPhase.EXECUTE: ["- [x]", "completed", "implemented"],
            AlgorithmPhase.VERIFY: ["verified", "✅", "all criteria"],
            AlgorithmPhase.LEARN: ["reflection", "lesson", "next time"],
        }

        current_indicators = phase_indicators.get(algo_state.phase, [])
        response_lower = response.lower()
        
        if any(indicator.lower() in response_lower for indicator in current_indicators):
            next_phase = self.engine.advance_phase(session_id)
            if next_phase:
                logger.info(
                    "Algorithm phase advanced: %s → %s (session=%s)",
                    algo_state.phase.value, next_phase.value, session_id
                )

    def on_session_end(self, session_id: str) -> None:
        """Called when session ends. Completes the algorithm if active."""
        if session_id in self._active_sessions:
            self.engine.complete(session_id)
            self._active_sessions.discard(session_id)
            logger.info("Algorithm completed for session %s", session_id)

    def _get_phase_context(self, state) -> str:
        """Generate phase-specific context to inject into the conversation."""
        phase_prompt = self.engine.get_phase_prompt(state)
        
        effort_config = self.engine.effort_classifier.get_config(state.effort_level)
        isc_range = self.engine.effort_classifier.get_isc_range(state.effort_level)
        
        context = f"""
<algorithm-context>
## Algorithm v3.7.0 — Active

**Phase:** {state.phase.value.upper()} ({AlgorithmEngine.PHASES.index(state.phase) + 1 if state.phase in AlgorithmEngine.PHASES else 7}/7)
**Effort:** {state.effort_level.value} (budget: {effort_config['budget_minutes']}min, ISC: {isc_range[0]}-{isc_range[1]})
**Iteration:** {state.iteration}
**PRD:** {state.prd_path or 'Not yet created'}

{phase_prompt}

**CRITICAL RULES:**
1. Write ISC criteria directly to the PRD file
2. Mark criteria [x] the MOMENT they are verified
3. Update PRD frontmatter progress counter after each change
4. Every selected capability MUST be invoked via tool call
5. Time awareness: check elapsed time at phase boundaries
</algorithm-context>
"""
        return context.strip()

    def is_algorithm_active(self, session_id: str) -> bool:
        """Check if algorithm is active for a session."""
        return session_id in self._active_sessions

    def get_current_phase(self, session_id: str) -> Optional[str]:
        """Get the current phase name for a session."""
        state = self.engine.get_state(session_id)
        if state and state.phase != AlgorithmPhase.COMPLETE:
            return state.phase.value
        return None

    # ---------------------------------------------------------------------
    # LangChain middleware compatibility hooks
    # ---------------------------------------------------------------------
    # Newer langchain versions inspect middleware classes for these methods.
    # If absent, agent construction can fail before runtime. We keep behavior
    # pass-through here and preserve algorithm logic via existing callbacks.
    def wrap_tool_call(self, request: Any, handler: Any) -> Any:
        return handler(request)

    async def awrap_tool_call(self, request: Any, handler: Any) -> Any:
        return await handler(request)

    def wrap_model_call(self, request: Any, handler: Any) -> Any:
        return handler(request)

    async def awrap_model_call(self, request: Any, handler: Any) -> Any:
        return await handler(request)

    def before_agent(self, state: Any, runtime: Any) -> Any:
        return None

    async def abefore_agent(self, state: Any, runtime: Any) -> Any:
        return None

    def after_agent(self, state: Any, runtime: Any) -> Any:
        return None

    async def aafter_agent(self, state: Any, runtime: Any) -> Any:
        return None

    def before_model(self, state: Any, runtime: Any) -> Any:
        return None

    async def abefore_model(self, state: Any, runtime: Any) -> Any:
        return None

    def after_model(self, state: Any, response: Any, runtime: Any) -> Any:
        return None

    async def aafter_model(self, state: Any, response: Any, runtime: Any) -> Any:
        return None
