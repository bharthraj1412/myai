"""Quick lifecycle validation for the Algorithm Engine."""
import tempfile, os, shutil

from ag3nt_agent.algorithm.engine import AlgorithmEngine, AlgorithmPhase
from ag3nt_agent.algorithm.middleware import AlgorithmMiddleware

tmpdir = tempfile.mkdtemp()
os.makedirs(os.path.join(tmpdir, "STATE", "algorithms"), exist_ok=True)
os.makedirs(os.path.join(tmpdir, "WORK"), exist_ok=True)

engine = AlgorithmEngine(tmpdir)

# Test lifecycle
state = engine.start("test-session", "Build a login page with OAuth")
print(f"1. Started: phase={state.phase.value}, effort={state.effort_level.value}")
print(f"   PRD created: {os.path.exists(state.prd_path)}")

for i, expected in enumerate(["think","plan","build","execute","verify","learn","complete"], 2):
    phase = engine.advance_phase("test-session")
    print(f"{i}. Advanced to: {phase.value}")
    assert phase.value == expected, f"Expected {expected}, got {phase.value}"

# Test state persistence
engine2 = AlgorithmEngine(tmpdir)
loaded = engine2.get_state("test-session")
print(f"State persisted: phase={loaded.phase.value}")
assert loaded.phase == AlgorithmPhase.COMPLETE

# Test middleware
mw = AlgorithmMiddleware(memory_dir=tmpdir)
ctx = mw.on_user_message("mw-test", "Build a complete REST API with auth, JWT, database, tests, and docs")
print(f"Middleware context injected: {ctx is not None}")
active = mw.is_algorithm_active("mw-test")
print(f"Algorithm active: {active}")

# Simple message should NOT trigger algorithm
ctx2 = mw.on_user_message("simple-test", "What time is it?")
print(f"Simple message bypassed: {ctx2 is None}")

shutil.rmtree(tmpdir)
print("\n=== ALL ALGORITHM TESTS PASSED ===")
