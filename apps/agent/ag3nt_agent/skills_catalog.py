"""
OpenClaw Community Skills Catalog for AG3NT.

Parses the awesome-openclaw-skills markdown catalog to provide
browsable, searchable community skills that can be installed.
"""

from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional

logger = logging.getLogger("ag3nt.skills_catalog")

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class SkillCatalogEntry:
    """A single community skill from the OpenClaw catalog."""
    name: str
    slug: str
    description: str
    category: str
    url: str
    github_url: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class SkillCategory:
    """A category grouping of skills."""
    id: str
    name: str
    count: int

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------

# Pattern to match skill entries like:
# - [skill-name](https://clawskills.sh/skills/author-skill) - Description text.
_SKILL_PATTERN = re.compile(
    r"^-\s+\[([^\]]+)\]\((https?://[^\)]+)\)\s*-\s*(.+)$",
    re.MULTILINE,
)

# Pattern to extract category name from the heading
_CATEGORY_HEADING = re.compile(r"^#\s+(.+)$", re.MULTILINE)

# Map filename to human-readable category name
_CATEGORY_NAMES = {
    "ai-and-llms": "AI & LLMs",
    "apple-apps-and-services": "Apple Apps & Services",
    "browser-and-automation": "Browser & Automation",
    "calendar-and-scheduling": "Calendar & Scheduling",
    "clawdbot-tools": "Clawdbot Tools",
    "cli-utilities": "CLI Utilities",
    "coding-agents-and-ides": "Coding Agents & IDEs",
    "communication": "Communication",
    "data-and-analytics": "Data & Analytics",
    "devops-and-cloud": "DevOps & Cloud",
    "gaming": "Gaming",
    "git-and-github": "Git & GitHub",
    "health-and-fitness": "Health & Fitness",
    "image-and-video-generation": "Image & Video Generation",
    "ios-and-macos-development": "iOS & macOS Development",
    "marketing-and-sales": "Marketing & Sales",
    "media-and-streaming": "Media & Streaming",
    "moltbook": "Moltbook",
    "notes-and-pkm": "Notes & PKM",
    "pdf-and-documents": "PDF & Documents",
    "personal-development": "Personal Development",
    "productivity-and-tasks": "Productivity & Tasks",
    "search-and-research": "Search & Research",
    "security-and-passwords": "Security & Passwords",
    "self-hosted-and-automation": "Self-Hosted & Automation",
    "shopping-and-e-commerce": "Shopping & E-commerce",
    "smart-home-and-iot": "Smart Home & IoT",
    "speech-and-transcription": "Speech & Transcription",
    "transportation": "Transportation",
    "web-and-frontend-development": "Web & Frontend Development",
}


def _find_catalog_dir() -> Path | None:
    """Locate the awesome-openclaw-skills categories directory."""
    # Check common locations relative to the project
    candidates = [
        Path(__file__).resolve().parent.parent.parent.parent
        / "awesome-openclaw-skills-main"
        / "awesome-openclaw-skills-main"
        / "categories",
        Path(__file__).resolve().parent.parent.parent.parent
        / "awesome-openclaw-skills-main"
        / "categories",
        Path.home() / ".ag3nt" / "skills-catalog" / "categories",
    ]

    for path in candidates:
        if path.exists() and path.is_dir():
            return path

    return None


def _parse_category_file(filepath: Path, category_id: str) -> list[SkillCatalogEntry]:
    """Parse a single category markdown file and extract skill entries."""
    entries: list[SkillCatalogEntry] = []

    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception as e:
        logger.warning(f"Failed to read {filepath}: {e}")
        return entries

    category_name = _CATEGORY_NAMES.get(category_id, category_id.replace("-", " ").title())

    for match in _SKILL_PATTERN.finditer(content):
        name = match.group(1).strip()
        url = match.group(2).strip()
        description = match.group(3).strip()

        # Extract slug from the URL
        # e.g. https://clawskills.sh/skills/author-skill-name -> author-skill-name
        slug = url.rstrip("/").split("/")[-1] if "/" in url else name

        entries.append(SkillCatalogEntry(
            name=name,
            slug=slug,
            description=description,
            category=category_name,
            url=url,
        ))

    return entries


# ---------------------------------------------------------------------------
# In-memory cache
# ---------------------------------------------------------------------------

_cached_skills: list[SkillCatalogEntry] | None = None
_cached_categories: list[SkillCategory] | None = None


def _ensure_loaded() -> tuple[list[SkillCatalogEntry], list[SkillCategory]]:
    """Load and cache the skills catalog from disk."""
    global _cached_skills, _cached_categories

    if _cached_skills is not None and _cached_categories is not None:
        return _cached_skills, _cached_categories

    catalog_dir = _find_catalog_dir()
    if catalog_dir is None:
        logger.warning("Skills catalog directory not found")
        _cached_skills = []
        _cached_categories = []
        return _cached_skills, _cached_categories

    all_skills: list[SkillCatalogEntry] = []
    categories: list[SkillCategory] = []

    for md_file in sorted(catalog_dir.glob("*.md")):
        category_id = md_file.stem  # e.g., "ai-and-llms"
        entries = _parse_category_file(md_file, category_id)

        if entries:
            category_name = _CATEGORY_NAMES.get(
                category_id, category_id.replace("-", " ").title()
            )
            categories.append(SkillCategory(
                id=category_id,
                name=category_name,
                count=len(entries),
            ))
            all_skills.extend(entries)

    _cached_skills = all_skills
    _cached_categories = categories

    logger.info(
        f"Loaded {len(all_skills)} community skills across "
        f"{len(categories)} categories"
    )

    return _cached_skills, _cached_categories


def invalidate_cache() -> None:
    """Clear the in-memory cache, forcing a reload on next access."""
    global _cached_skills, _cached_categories
    _cached_skills = None
    _cached_categories = None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def list_categories() -> list[dict]:
    """List all skill categories with counts."""
    _, categories = _ensure_loaded()
    return [c.to_dict() for c in categories]


def get_skills_by_category(category_id: str) -> list[dict]:
    """Get all skills in a specific category."""
    skills, _ = _ensure_loaded()
    category_name = _CATEGORY_NAMES.get(
        category_id, category_id.replace("-", " ").title()
    )
    return [s.to_dict() for s in skills if s.category == category_name]


def search_catalog(
    query: str = "",
    category: str = "",
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """Search the community skills catalog.

    Args:
        query: Search term to match against skill name and description
        category: Filter by category ID (e.g., "ai-and-llms")
        limit: Maximum number of results to return
        offset: Number of results to skip (for pagination)

    Returns:
        Dictionary with 'skills', 'total', 'categories' keys
    """
    skills, categories = _ensure_loaded()

    filtered = skills

    # Filter by category
    if category:
        category_name = _CATEGORY_NAMES.get(
            category, category.replace("-", " ").title()
        )
        filtered = [s for s in filtered if s.category == category_name]

    # Filter by search query
    if query:
        query_lower = query.lower()
        filtered = [
            s for s in filtered
            if query_lower in s.name.lower()
            or query_lower in s.description.lower()
            or query_lower in s.category.lower()
        ]

    total = len(filtered)
    page = filtered[offset : offset + limit]

    return {
        "skills": [s.to_dict() for s in page],
        "total": total,
        "categories": [c.to_dict() for c in categories],
        "limit": limit,
        "offset": offset,
    }


def get_total_count() -> int:
    """Get the total number of community skills."""
    skills, _ = _ensure_loaded()
    return len(skills)
