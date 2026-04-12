"""
AG3NT Algorithm Engine — 7-Phase Task Execution System

Adapted from PAI's Algorithm v3.7.0.
Core loop: transition from CURRENT STATE to IDEAL STATE 
using verifiable criteria (ISC).

Phases: Observe → Think → Plan → Build → Execute → Verify → Learn
"""

from .engine import AlgorithmEngine, AlgorithmPhase, AlgorithmMode
from .prd import PRDManager
from .isc import ISCManager
from .effort import EffortClassifier, EffortLevel
from .phases import PhaseRunner
from .middleware import AlgorithmMiddleware

__all__ = [
    'AlgorithmEngine',
    'AlgorithmPhase',
    'AlgorithmMode',
    'AlgorithmMiddleware',
    'PRDManager', 
    'ISCManager',
    'EffortClassifier',
    'EffortLevel',
    'PhaseRunner',
]
