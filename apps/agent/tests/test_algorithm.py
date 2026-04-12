"""
AG3NT Algorithm Engine — Integration Tests

Tests the core Algorithm Engine components:
- AlgorithmEngine lifecycle
- EffortClassifier classification
- PRDManager CRUD operations
- ISCManager validation
"""

import os
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from ag3nt_agent.algorithm.engine import AlgorithmEngine, AlgorithmPhase, AlgorithmMode
from ag3nt_agent.algorithm.effort import EffortClassifier, EffortLevel, EFFORT_CONFIG
from ag3nt_agent.algorithm.prd import PRDManager
from ag3nt_agent.algorithm.isc import ISCManager, ISCCriterion


class TestEffortClassifier(unittest.TestCase):
    """Test effort level classification."""

    def setUp(self):
        self.classifier = EffortClassifier()

    def test_simple_request_standard(self):
        result = self.classifier.classify("Fix the button color")
        self.assertEqual(result, EffortLevel.STANDARD)

    def test_comprehensive_trigger(self):
        result = self.classifier.classify(
            "Do a comprehensive audit of the entire authentication system "
            "including OAuth, JWT, session management, and password policies"
        )
        self.assertEqual(result, EffortLevel.COMPREHENSIVE)

    def test_deep_trigger(self):
        result = self.classifier.classify("Deep dive into the database performance issues")
        self.assertEqual(result, EffortLevel.DEEP)

    def test_word_count_heuristic(self):
        long_request = " ".join(["word"] * 60)
        result = self.classifier.classify(long_request)
        self.assertIn(result, [EffortLevel.ADVANCED, EffortLevel.DEEP])

    def test_isc_range(self):
        min_isc, max_isc = self.classifier.get_isc_range(EffortLevel.STANDARD)
        self.assertEqual(min_isc, 8)
        self.assertEqual(max_isc, 16)

    def test_budget_minutes(self):
        budget = self.classifier.get_budget_minutes(EffortLevel.COMPREHENSIVE)
        self.assertEqual(budget, 120)

    def test_all_effort_levels_have_config(self):
        for level in EffortLevel:
            config = self.classifier.get_config(level)
            self.assertIn("budget_minutes", config)
            self.assertIn("isc_min", config)
            self.assertIn("isc_max", config)


class TestPRDManager(unittest.TestCase):
    """Test PRD document management."""

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.prd_manager = PRDManager(self.tmpdir)

    def tearDown(self):
        shutil.rmtree(self.tmpdir)

    def test_create_prd(self):
        prd_path = self.prd_manager.create_prd(
            task="Build a login page",
            slug="20260412-120000_build-a-login-page",
            effort="standard",
        )
        self.assertTrue(os.path.exists(prd_path))
        self.assertTrue(prd_path.endswith("PRD.md"))

    def test_read_prd(self):
        prd_path = self.prd_manager.create_prd(
            task="Test task",
            slug="test-slug",
        )
        result = self.prd_manager.read_prd(prd_path)
        self.assertEqual(result["frontmatter"]["task"], "Test task")
        self.assertEqual(result["frontmatter"]["phase"], "observe")

    def test_update_phase(self):
        prd_path = self.prd_manager.create_prd(task="Phase test", slug="phase-test")
        self.prd_manager.update_phase(prd_path, "execute")
        result = self.prd_manager.read_prd(prd_path)
        self.assertEqual(result["frontmatter"]["phase"], "execute")

    def test_update_progress(self):
        prd_path = self.prd_manager.create_prd(task="Progress test", slug="progress-test")
        # Manually add some criteria
        with open(prd_path, "a") as f:
            f.write("\n- [x] ISC-1: Database schema created\n")
            f.write("- [ ] ISC-2: API endpoints implemented\n")
            f.write("- [x] ISC-3: Tests written\n")
        
        progress = self.prd_manager.update_progress(prd_path)
        self.assertEqual(progress, "2/3")

    def test_generate_slug(self):
        slug = self.prd_manager.generate_slug("Build a REST API for user authentication")
        self.assertIn("build", slug.lower())
        self.assertIn("_", slug)

    def test_list_recent_work(self):
        self.prd_manager.create_prd(task="Task 1", slug="task-1")
        self.prd_manager.create_prd(task="Task 2", slug="task-2")
        items = self.prd_manager.list_recent_work()
        self.assertEqual(len(items), 2)


class TestISCManager(unittest.TestCase):
    """Test ISC criteria management."""

    def setUp(self):
        self.isc = ISCManager()

    def test_validate_good_criterion(self):
        issues = self.isc.validate_criterion("Login form renders without errors on mobile devices")
        self.assertEqual(len(issues), 0)

    def test_validate_too_short(self):
        issues = self.isc.validate_criterion("Test works")
        self.assertTrue(any("short" in i.lower() for i in issues))

    def test_validate_compound_and(self):
        issues = self.isc.validate_criterion(
            "Database schema created and API endpoints implemented"
        )
        self.assertTrue(any('"and"' in i for i in issues))

    def test_validate_action_verb(self):
        issues = self.isc.validate_criterion("Create the database schema for users table")
        self.assertTrue(any("action verb" in i.lower() for i in issues))

    def test_parse_criterion_from_markdown(self):
        criterion = ISCCriterion.from_markdown("- [x] ISC-1: Database schema exists")
        self.assertIsNotNone(criterion)
        self.assertEqual(criterion.id, "ISC-1")
        self.assertTrue(criterion.checked)
        self.assertFalse(criterion.is_anti)

    def test_parse_anti_criterion(self):
        criterion = ISCCriterion.from_markdown("- [ ] ISC-A-1: No console errors in production")
        self.assertIsNotNone(criterion)
        self.assertTrue(criterion.is_anti)

    def test_count_criteria(self):
        content = """
---
task: Test
---

## Criteria

- [x] ISC-1: First criterion done
- [ ] ISC-2: Second criterion pending
- [x] ISC-3: Third criterion done
"""
        checked, total = self.isc.count_criteria(content)
        self.assertEqual(checked, 2)
        self.assertEqual(total, 3)

    def test_check_isc_floor(self):
        # 3 criteria is below standard floor of 8
        content = "- [ ] ISC-1: A\n- [ ] ISC-2: B\n- [ ] ISC-3: C\n"
        passes, count, floor = self.isc.check_isc_floor(content, "standard")
        self.assertFalse(passes)
        self.assertEqual(count, 3)
        self.assertEqual(floor, 8)

    def test_suggest_decomposition(self):
        suggestions = self.isc.suggest_decomposition(
            "Database schema created and API endpoints implemented"
        )
        self.assertGreater(len(suggestions), 1)

    def test_criterion_to_markdown(self):
        c = ISCCriterion("ISC-1", "Login form renders correctly", checked=True)
        md = c.to_markdown()
        self.assertIn("[x]", md)
        self.assertIn("ISC-1", md)


class TestAlgorithmEngine(unittest.TestCase):
    """Test the core Algorithm Engine."""

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        os.makedirs(os.path.join(self.tmpdir, "STATE", "algorithms"), exist_ok=True)
        os.makedirs(os.path.join(self.tmpdir, "WORK"), exist_ok=True)
        self.engine = AlgorithmEngine(self.tmpdir)

    def tearDown(self):
        shutil.rmtree(self.tmpdir)

    def test_should_enter_simple(self):
        self.assertFalse(self.engine.should_enter_algorithm("Hi"))
        self.assertFalse(self.engine.should_enter_algorithm("What is Python?"))

    def test_should_enter_complex(self):
        self.assertTrue(self.engine.should_enter_algorithm(
            "Build a complete REST API with authentication, database models, "
            "and unit tests for the user management system"
        ))

    def test_start_creates_state(self):
        state = self.engine.start("session-1", "Build a landing page")
        self.assertEqual(state.phase, AlgorithmPhase.OBSERVE)
        self.assertIsNotNone(state.prd_path)
        self.assertTrue(os.path.exists(state.prd_path))

    def test_advance_phase(self):
        self.engine.start("session-2", "Refactor the auth module")
        
        next_phase = self.engine.advance_phase("session-2")
        self.assertEqual(next_phase, AlgorithmPhase.THINK)
        
        next_phase = self.engine.advance_phase("session-2")
        self.assertEqual(next_phase, AlgorithmPhase.PLAN)

    def test_full_lifecycle(self):
        state = self.engine.start("session-3", "Create a dashboard")
        
        for expected_phase in [
            AlgorithmPhase.THINK,
            AlgorithmPhase.PLAN,
            AlgorithmPhase.BUILD,
            AlgorithmPhase.EXECUTE,
            AlgorithmPhase.VERIFY,
            AlgorithmPhase.LEARN,
            AlgorithmPhase.COMPLETE,
        ]:
            phase = self.engine.advance_phase("session-3")
            self.assertEqual(phase, expected_phase)

    def test_get_phase_prompt(self):
        state = self.engine.start("session-4", "Implement user auth")
        prompt = self.engine.get_phase_prompt(state)
        self.assertIn("OBSERVE", prompt)
        self.assertIn("ISC", prompt)

    def test_state_persistence(self):
        self.engine.start("session-5", "Test persistence")
        self.engine.advance_phase("session-5")
        
        # Create new engine instance
        engine2 = AlgorithmEngine(self.tmpdir)
        loaded = engine2.get_state("session-5")
        self.assertIsNotNone(loaded)
        self.assertEqual(loaded.phase, AlgorithmPhase.THINK)

    def test_complete(self):
        self.engine.start("session-6", "Quick task")
        self.engine.complete("session-6")
        state = self.engine.get_state("session-6")
        self.assertIsNotNone(state)
        self.assertEqual(state.phase, AlgorithmPhase.COMPLETE)


if __name__ == "__main__":
    unittest.main()
