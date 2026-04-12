"""
AG3NT Algorithm — PRD (Product Requirements Document) Manager

Manages creation, reading, updating, and parsing of PRD.md files
in the MEMORY/WORK/ directory. PRD is the single source of truth
for each work item.

Adapted from PAI's PRD system.
"""

import os
import re
import json
from datetime import datetime
from typing import Optional, Dict, Any, List


class PRDManager:
    """Manages PRD documents in MEMORY/WORK/."""
    
    def __init__(self, memory_dir: str):
        self.memory_dir = memory_dir
        self.work_dir = os.path.join(memory_dir, "WORK")
        os.makedirs(self.work_dir, exist_ok=True)
    
    def generate_slug(self, task: str) -> str:
        """Generate a kebab-case slug from a task description."""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        slug_words = re.sub(r'[^a-zA-Z0-9\s]', '', task.lower()).split()[:6]
        slug_text = '-'.join(slug_words)
        return f"{timestamp}_{slug_text}"
    
    def create_prd(
        self,
        task: str,
        slug: str,
        effort: str = "standard",
        mode: str = "interactive",
    ) -> str:
        """
        Create a new PRD.md with frontmatter.
        Returns the path to the created PRD.
        """
        prd_dir = os.path.join(self.work_dir, slug)
        os.makedirs(prd_dir, exist_ok=True)
        
        prd_path = os.path.join(prd_dir, "PRD.md")
        now = datetime.now().isoformat()
        
        content = f"""---
task: {task[:100]}
slug: {slug}
effort: {effort}
phase: observe
progress: 0/0
mode: {mode}
started: {now}
updated: {now}
---

## Context

{task}

## Criteria

_ISC criteria will be generated during OBSERVE phase._

## Decisions

_Non-obvious technical decisions will be logged here._

## Verification

_Verification evidence will be added during VERIFY phase._
"""
        
        with open(prd_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return prd_path
    
    def read_prd(self, prd_path: str) -> Dict[str, Any]:
        """Read and parse a PRD file, returning frontmatter and body."""
        if not os.path.exists(prd_path):
            return {}
        
        with open(prd_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        result = {"path": prd_path, "raw": content}
        
        # Parse frontmatter
        fm_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if fm_match:
            frontmatter = {}
            for line in fm_match.group(1).split('\n'):
                colon_idx = line.find(':')
                if colon_idx > 0:
                    key = line[:colon_idx].strip()
                    value = line[colon_idx + 1:].strip()
                    frontmatter[key] = value
            result["frontmatter"] = frontmatter
        
        # Count criteria
        checked = len(re.findall(r'- \[x\]', content))
        total = len(re.findall(r'- \[[ x]\]', content))
        result["criteria"] = {"checked": checked, "total": total}
        
        return result
    
    def update_phase(self, prd_path: str, phase: str) -> None:
        """Update the phase in PRD frontmatter."""
        if not os.path.exists(prd_path):
            return
        
        with open(prd_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        content = re.sub(
            r'^(phase:\s*).+$',
            lambda m: f"{m.group(1)}{phase}",
            content,
            flags=re.MULTILINE
        )
        content = re.sub(
            r'^(updated:\s*).+$',
            lambda m: f"{m.group(1)}{datetime.now().isoformat()}",
            content,
            flags=re.MULTILINE
        )
        
        with open(prd_path, "w", encoding="utf-8") as f:
            f.write(content)
    
    def update_progress(self, prd_path: str) -> str:
        """Recount criteria and update progress in frontmatter."""
        if not os.path.exists(prd_path):
            return "0/0"
        
        with open(prd_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        checked = len(re.findall(r'- \[x\]', content))
        total = len(re.findall(r'- \[[ x]\]', content))
        progress = f"{checked}/{total}"
        
        content = re.sub(
            r'^(progress:\s*).+$',
            lambda m: f"{m.group(1)}{progress}",
            content,
            flags=re.MULTILINE
        )
        
        with open(prd_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return progress
    
    def list_recent_work(self, limit: int = 10) -> List[Dict[str, Any]]:
        """List recent work items from MEMORY/WORK/."""
        if not os.path.exists(self.work_dir):
            return []
        
        items = []
        for entry in sorted(os.listdir(self.work_dir), reverse=True)[:limit]:
            entry_path = os.path.join(self.work_dir, entry)
            if os.path.isdir(entry_path):
                prd_path = os.path.join(entry_path, "PRD.md")
                if os.path.exists(prd_path):
                    prd_data = self.read_prd(prd_path)
                    items.append({
                        "slug": entry,
                        "prd_path": prd_path,
                        **prd_data.get("frontmatter", {}),
                        "criteria": prd_data.get("criteria", {}),
                    })
        
        return items
