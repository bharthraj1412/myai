"""JARVIS Brain module for intent routing and task planning.

This module intercepts incoming user queries and analyzes the underlying
intent before routing them to the appropriate LangGraph subagent or execution layer.
"""

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

class JarvisBrain:
    """Core decision-maker for AG3NT, modeling the JARVIS AI Brain."""
    
    def __init__(self):
        self.enabled = True
        
    def analyze_intent(self, text: str) -> Dict[str, str]:
        """Analyze user input for distinct intents.
        
        Categorizes intents into execution, search, autonomous control, or general chat.
        """
        text_lower = text.lower().strip()
        intent = "chat"
        priority = "normal"
        
        # Priority parsing
        if any(keyword in text_lower for keyword in ["urgent", "emergency", "asap"]):
            priority = "high"
            
        # Intent classification
        if text_lower.startswith(("search", "find", "look up", "google")):
            intent = "search"
        elif text_lower.startswith(("run", "execute", "start", "build")):
            intent = "execution"
        elif text_lower.startswith(("schedule", "remind", "set alarm")):
            intent = "scheduling"
            
        return {
            "intent": intent,
            "priority": priority,
            "original_text": text
        }
    
    def format_prompt(self, text: str, analysis: Dict[str, str]) -> str:
        """Inject structured context into the prompt for the runtime."""
        # Provide the runtime with explicit intent categorization
        # to ensure the LangGraph router chooses the correct subagent.
        prefix = f"<system_intent>\nINTENT: {analysis['intent'].upper()}\nPRIORITY: {analysis['priority'].upper()}\n</system_intent>\n\n"
        return f"{prefix}{text}"

# Singleton instance
brain_instance = JarvisBrain()

def process_with_brain(session_id: str, text: str) -> str:
    """Intercept and augment user input with JARVIS brain analysis."""
    analysis = brain_instance.analyze_intent(text)
    logger.info(f"JARVIS Brain -> session: {session_id} | intent: {analysis['intent']} | priority: {analysis['priority']}")
    return brain_instance.format_prompt(text, analysis)
