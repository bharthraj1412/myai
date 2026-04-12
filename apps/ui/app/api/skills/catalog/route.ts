import { NextResponse } from "next/server"
import { readFileSync, readdirSync, existsSync } from "fs"
import { join, resolve } from "path"

/**
 * GET /api/skills/catalog
 *
 * Serves the OpenClaw community skills catalog parsed from the
 * awesome-openclaw-skills markdown files.
 *
 * Query params:
 *   - search: text search across name + description
 *   - category: filter by category ID (e.g. "ai-and-llms")
 *   - limit: max results (default 50)
 *   - offset: pagination offset (default 0)
 */

interface SkillEntry {
  name: string
  slug: string
  description: string
  category: string
  url: string
}

interface CategoryInfo {
  id: string
  name: string
  count: number
}

// In-memory cache
let _cachedSkills: SkillEntry[] | null = null
let _cachedCategories: CategoryInfo[] | null = null

const CATEGORY_NAMES: Record<string, string> = {
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

const SKILL_REGEX = /^-\s+\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*-\s*(.+)$/gm

function findCatalogDir(): string | null {
  // Resolve relative to the project root
  const projectRoot = resolve(process.cwd(), "..", "..")
  const candidates = [
    join(projectRoot, "awesome-openclaw-skills-main", "awesome-openclaw-skills-main", "categories"),
    join(projectRoot, "awesome-openclaw-skills-main", "categories"),
    join(process.cwd(), "..", "..", "awesome-openclaw-skills-main", "awesome-openclaw-skills-main", "categories"),
  ]

  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }

  return null
}

function parseCatalog(): { skills: SkillEntry[]; categories: CategoryInfo[] } {
  if (_cachedSkills && _cachedCategories) {
    return { skills: _cachedSkills, categories: _cachedCategories }
  }

  const catalogDir = findCatalogDir()
  if (!catalogDir) {
    return { skills: [], categories: [] }
  }

  const allSkills: SkillEntry[] = []
  const categories: CategoryInfo[] = []

  const files = readdirSync(catalogDir).filter((f) => f.endsWith(".md")).sort()

  for (const file of files) {
    const categoryId = file.replace(".md", "")
    const categoryName = CATEGORY_NAMES[categoryId] || categoryId.replace(/-/g, " ")
    const filePath = join(catalogDir, file)

    try {
      const content = readFileSync(filePath, "utf-8")
      const entries: SkillEntry[] = []
      let match: RegExpExecArray | null

      // Reset lastIndex for global regex
      SKILL_REGEX.lastIndex = 0
      while ((match = SKILL_REGEX.exec(content)) !== null) {
        const name = match[1].trim()
        const url = match[2].trim()
        const description = match[3].trim()
        const slug = url.split("/").pop() || name

        entries.push({ name, slug, description, category: categoryName, url })
      }

      if (entries.length > 0) {
        categories.push({ id: categoryId, name: categoryName, count: entries.length })
        allSkills.push(...entries)
      }
    } catch {
      // Skip unreadable files
    }
  }

  _cachedSkills = allSkills
  _cachedCategories = categories

  return { skills: allSkills, categories }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || ""
  const limit = parseInt(searchParams.get("limit") || "50", 10)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  const { skills, categories } = parseCatalog()

  let filtered = skills

  // Filter by category
  if (category) {
    const categoryName = CATEGORY_NAMES[category] || category
    filtered = filtered.filter((s) => s.category === categoryName)
  }

  // Search filter
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    )
  }

  const total = filtered.length
  const page = filtered.slice(offset, offset + limit)

  return NextResponse.json({
    skills: page,
    total,
    categories,
    limit,
    offset,
  })
}
