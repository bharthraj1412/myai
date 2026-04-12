"""
AG3NT Algorithm — ISC (Ideal State Criteria) Manager

Manages the creation, validation, and decomposition of
Ideal State Criteria. ISC are atomic, verifiable checkboxes
that define the success criteria for a task.

Adapted from PAI Algorithm v3.7.0 ISC methodology.
"""

import re
from typing import List, Tuple, Optional


class ISCCriterion:
    """A single Ideal State Criterion."""
    
    def __init__(self, id: str, text: str, checked: bool = False, is_anti: bool = False):
        self.id = id          # e.g., "ISC-1" or "ISC-A-1" for anti-criteria
        self.text = text
        self.checked = checked
        self.is_anti = is_anti  # Anti-criteria: what must NOT happen
    
    def to_markdown(self) -> str:
        """Render as markdown checkbox."""
        check = "x" if self.checked else " "
        return f"- [{check}] {self.id}: {self.text}"
    
    @classmethod
    def from_markdown(cls, line: str) -> Optional["ISCCriterion"]:
        """Parse from markdown checkbox line."""
        match = re.match(r'- \[([ x])\] (ISC-A?-?\d+):\s*(.+)', line.strip())
        if match:
            checked = match.group(1) == 'x'
            isc_id = match.group(2)
            text = match.group(3).strip()
            is_anti = isc_id.startswith('ISC-A')
            return cls(isc_id, text, checked, is_anti)
        return None


class ISCManager:
    """
    Manages Ideal State Criteria for Algorithm execution.
    
    Key principles:
    - Each criterion must be ATOMIC (one verifiable thing)
    - Binary testable (pass/fail, no partial credit)
    - 8-12 words, describing end-state not action
    - Anti-criteria (ISC-A prefix) capture what must NOT happen
    """
    
    def validate_criterion(self, text: str) -> List[str]:
        """
        Validate a criterion against the Splitting Test.
        Returns a list of issues found.
        """
        issues = []
        
        # Word count check (8-12 words)
        word_count = len(text.split())
        if word_count < 4:
            issues.append(f"Too short ({word_count} words). Aim for 8-12 words.")
        elif word_count > 20:
            issues.append(f"Too long ({word_count} words). Aim for 8-12 words.")
        
        # "And"/"With" test — compound criteria
        compound_words = ['and', 'with', 'including', 'plus', 'also']
        text_lower = text.lower()
        for word in compound_words:
            if f' {word} ' in text_lower:
                issues.append(f'Contains "{word}" — may be compound. Consider splitting.')
        
        # Scope word test — vague scope
        scope_words = ['all', 'every', 'complete', 'full', 'entire']
        for word in scope_words:
            if word in text_lower.split():
                issues.append(f'Contains scope word "{word}" — enumerate what "{word}" means.')
        
        # Action vs state test
        action_starts = ['create', 'build', 'write', 'implement', 'add', 'make', 'do']
        first_word = text_lower.split()[0] if text.split() else ''
        if first_word in action_starts:
            issues.append(f'Starts with action verb "{first_word}" — use end-state language instead.')
        
        return issues
    
    def parse_criteria_from_prd(self, content: str) -> List[ISCCriterion]:
        """Extract all ISC criteria from PRD content."""
        criteria = []
        for line in content.split('\n'):
            criterion = ISCCriterion.from_markdown(line)
            if criterion:
                criteria.append(criterion)
        return criteria
    
    def count_criteria(self, content: str) -> Tuple[int, int]:
        """Count checked and total criteria in PRD content."""
        criteria = self.parse_criteria_from_prd(content)
        checked = sum(1 for c in criteria if c.checked)
        total = len(criteria)
        return checked, total
    
    def check_isc_floor(self, content: str, effort_level: str) -> Tuple[bool, int, int]:
        """
        Check if criteria count meets the effort level floor.
        
        Returns: (passes, current_count, required_floor)
        """
        floors = {
            "standard": 8,
            "extended": 16,
            "advanced": 24,
            "deep": 40,
            "comprehensive": 64,
        }
        
        floor = floors.get(effort_level, 8)
        _, total = self.count_criteria(content)
        
        return total >= floor, total, floor
    
    def suggest_decomposition(self, text: str) -> List[str]:
        """
        Suggest how to decompose a compound criterion into atomics.
        Returns a list of suggested atomic criteria.
        """
        suggestions = []
        
        # Split on "and"
        if ' and ' in text.lower():
            parts = re.split(r'\s+and\s+', text, flags=re.IGNORECASE)
            for part in parts:
                suggestions.append(part.strip())
        
        # Split on "with"
        elif ' with ' in text.lower():
            parts = re.split(r'\s+with\s+', text, flags=re.IGNORECASE)
            suggestions.append(parts[0].strip())
            for part in parts[1:]:
                suggestions.append(f"Includes {part.strip()}")
        
        else:
            suggestions.append(text)
        
        return suggestions
