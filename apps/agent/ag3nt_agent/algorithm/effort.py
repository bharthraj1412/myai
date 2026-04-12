"""
AG3NT Algorithm — Effort Level Classification

Classifies tasks into effort tiers that determine time budget,
ISC criteria count ranges, and minimum capability requirements.

Adapted from PAI Algorithm v3.7.0 effort levels.
"""

from enum import Enum
from typing import Optional, Dict, Any, Tuple


class EffortLevel(str, Enum):
    STANDARD = "standard"           # <2min, 8-16 ISC
    EXTENDED = "extended"           # <8min, 16-32 ISC  
    ADVANCED = "advanced"           # <16min, 24-48 ISC
    DEEP = "deep"                   # <32min, 40-80 ISC
    COMPREHENSIVE = "comprehensive" # <120min, 64-150 ISC


# Effort level configuration
EFFORT_CONFIG: Dict[EffortLevel, Dict[str, Any]] = {
    EffortLevel.STANDARD: {
        "budget_minutes": 2,
        "isc_min": 8,
        "isc_max": 16,
        "min_capabilities": 1,
        "description": "Normal request — quick and focused",
    },
    EffortLevel.EXTENDED: {
        "budget_minutes": 8,
        "isc_min": 16,
        "isc_max": 32,
        "min_capabilities": 3,
        "description": "Quality must be extraordinary",
    },
    EffortLevel.ADVANCED: {
        "budget_minutes": 16,
        "isc_min": 24,
        "isc_max": 48,
        "min_capabilities": 4,
        "description": "Substantial multi-file work",
    },
    EffortLevel.DEEP: {
        "budget_minutes": 32,
        "isc_min": 40,
        "isc_max": 80,
        "min_capabilities": 6,
        "description": "Complex design and architecture",
    },
    EffortLevel.COMPREHENSIVE: {
        "budget_minutes": 120,
        "isc_min": 64,
        "isc_max": 150,
        "min_capabilities": 8,
        "description": "No time pressure — maximum thoroughness",
    },
}


class EffortClassifier:
    """Classifies user requests into effort levels."""
    
    def __init__(self, settings: Optional[Dict] = None):
        self.settings = settings or {}
        self.default_effort = EffortLevel(
            self.settings.get("algorithm", {}).get("defaultEffort", "standard")
        )
    
    def classify(self, task: str) -> EffortLevel:
        """
        Classify a task description into an effort level.
        
        Uses heuristic analysis of task complexity:
        - Word count and sentence complexity
        - Presence of complexity indicators
        - Explicit time/effort mentions
        """
        task_lower = task.lower()
        
        # Check for explicit effort mentions
        if any(w in task_lower for w in ["comprehensive", "thorough", "complete", "exhaustive", "no rush"]):
            return EffortLevel.COMPREHENSIVE
        
        if any(w in task_lower for w in ["deep dive", "in-depth", "deeply", "complex design"]):
            return EffortLevel.DEEP
        
        if any(w in task_lower for w in ["advanced", "multi-file", "substantial", "architecture"]):
            return EffortLevel.ADVANCED
        
        if any(w in task_lower for w in ["detailed", "quality", "carefully", "extended"]):
            return EffortLevel.EXTENDED
        
        # Word count heuristic
        word_count = len(task.split())
        if word_count > 100:
            return EffortLevel.DEEP
        elif word_count > 50:
            return EffortLevel.ADVANCED
        elif word_count > 25:
            return EffortLevel.EXTENDED
        
        return self.default_effort
    
    def get_config(self, level: EffortLevel) -> Dict[str, Any]:
        """Get the configuration for an effort level."""
        return EFFORT_CONFIG[level]
    
    def get_isc_range(self, level: EffortLevel) -> Tuple[int, int]:
        """Get the ISC criteria count range for an effort level."""
        config = EFFORT_CONFIG[level]
        return (config["isc_min"], config["isc_max"])
    
    def get_budget_minutes(self, level: EffortLevel) -> int:
        """Get the time budget in minutes for an effort level."""
        return EFFORT_CONFIG[level]["budget_minutes"]
    
    def get_min_capabilities(self, level: EffortLevel) -> int:
        """Get minimum required capability count."""
        return EFFORT_CONFIG[level]["min_capabilities"]
