"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Wand2,
  Search,
  Grid3x3,
  List,
  RefreshCw,
  FileText,
  ChevronRight,
  Download,
  Globe2,
  Layers3,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  ModuleContainer,
  EmptyModuleState,
  LoadingModuleState,
  ErrorModuleState,
} from "./module-container"
import { useAgentConnection } from "@/hooks/use-agent-connection"
import { FileDocumentViewer, DocumentMeta } from "@/components/shared/file-document-viewer"
import type { ModuleConfig, ModuleInstanceProps } from "@/types/modules"
import type { SkillMeta, SkillViewMode, SkillSearchCriteria } from "@/types/skills"

export const skillsLibraryModuleConfig: ModuleConfig = {
  metadata: {
    id: "skills-library",
    displayName: "Skills Library",
    description: "Browse, search, edit, and manage agent skills",
    icon: "Wand2",
    category: "data",
    version: "1.0.0",
  },
  hasHeader: true,
  initialState: {
    isLoading: false,
    error: null,
    data: { skills: [], selectedSkill: null },
  },
  agentConfig: {
    enabled: true,
    supportedCommands: ["search", "getSkill", "createSkill", "updateSkill", "toggleSkill"],
    emittedEvents: ["skill-selected", "skill-updated", "skill-created", "skill-toggled"],
    contextDescription:
      "Skills library for browsing, editing, and toggling agent skill definitions",
  },
}

interface SkillsLibraryContext {
  totalSkills: number
  selectedSkillId: string | null
  searchQuery: string
  viewMode: SkillViewMode
  activeTab: "local" | "community"
}

// Gateway skill status (enabled/disabled toggle from control panel)
interface GatewaySkill {
  id: string
  name: string
  description: string
  enabled: boolean
}

async function fetchGatewayJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/ag3nt/gateway/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      (data && (data.error || data.detail)) || res.statusText || "Gateway request failed"
    throw new Error(String(msg))
  }
  return data as T
}

export function SkillsLibraryModule({ instanceId, initialData }: ModuleInstanceProps) {
  const [skills, setSkills] = useState<SkillMeta[]>([])
  const [selectedSkill, setSelectedSkill] = useState<SkillMeta | null>(null)
  const [viewMode, setViewMode] = useState<SkillViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [isViewerFullWidth, setIsViewerFullWidth] = useState(false)
  const [activeTab, setActiveTab] = useState<"local" | "community">("local")
  const [communityCategory, setCommunityCategory] = useState("all")

  // Community skills state
  const [communityCategories, setCommunityCategories] = useState<Array<{ id: string; name: string; count: number }>>([])

  // Gateway skill toggle state
  const [gatewaySkills, setGatewaySkills] = useState<Map<string, GatewaySkill>>(new Map())
  const [gatewayLoading, setGatewayLoading] = useState(false)

  const { updateContext, sendEvent, onCommand } = useAgentConnection({
    instanceId: instanceId || `skills-library-${Date.now()}`,
    moduleType: "skills-library",
    autoRegister: true,
    initialContext: {
      totalSkills: 0,
      selectedSkillId: null,
      searchQuery: "",
      viewMode: "grid",
    } as Partial<SkillsLibraryContext>,
  })

  // Load gateway skills for toggle state
  const loadGatewaySkills = useCallback(async () => {
    try {
      setGatewayLoading(true)
      const data = await fetchGatewayJson<any>("skills")
      const list = Array.isArray(data?.skills) ? data.skills : []
      const map = new Map<string, GatewaySkill>()
      list.forEach((s: any) => {
        map.set(String(s.id || s.name), {
          id: String(s.id || s.name),
          name: String(s.name || s.id),
          description: String(s.description || ""),
          enabled: Boolean(s.enabled),
        })
      })
      setGatewaySkills(map)
    } catch {
      // Gateway may be unavailable - toggle feature degrades gracefully
    } finally {
      setGatewayLoading(false)
    }
  }, [])

  const toggleSkill = useCallback(
    async (skillId: string, enabled: boolean) => {
      try {
        await fetchGatewayJson<any>(`skills/${encodeURIComponent(skillId)}/toggle`, {
          method: "POST",
          body: JSON.stringify({ enabled }),
        })
        setGatewaySkills((prev) => {
          const next = new Map(prev)
          const existing = next.get(skillId)
          if (existing) {
            next.set(skillId, { ...existing, enabled })
          }
          return next
        })
        sendEvent("skill-toggled", { skillId, enabled })
      } catch {
        // Refresh to get actual state
        loadGatewaySkills()
      }
    },
    [loadGatewaySkills, sendEvent]
  )

  const loadSkills = useCallback(
    async (criteria?: SkillSearchCriteria, tab: "local" | "community" = activeTab, category: string = communityCategory) => {
      try {
        setIsLoading(true)
        setError(null)
        setSelectedSkill(null)

        const params = new URLSearchParams()
        if (criteria?.search) params.set("search", criteria.search)
        if (criteria?.tags?.length) params.set("tag", criteria.tags[0])
        if (criteria?.limit) params.set("limit", criteria.limit.toString())
        if (criteria?.offset) params.set("offset", criteria.offset.toString())

        if (tab === "community" && category && category !== "all") {
          params.set("category", category)
        }

        const endpoint = tab === "local" ? `/api/skills/list` : `/api/skills/catalog`
        const response = await fetch(`${endpoint}?${params}`)
        if (!response.ok) throw new Error(`Failed to load ${tab} skills`)

        const data = await response.json()
        
        if (tab === "local") {
          setSkills(data.skills)
          setTotal(data.total)
        } else {
          // Adapt community skills to SkillMeta shape so we can reuse components
          const adaptedSkills = data.skills.map((s: any) => ({
            id: s.slug || s.name,
            name: s.name,
            description: s.description,
            tags: [s.category],
            path: s.url, // Store URL in path for now
            isCommunity: true
          }))
          setSkills(adaptedSkills)
          setTotal(data.total)
          setCommunityCategories(data.categories || [])
        }

        updateContext({
          totalSkills: data.total,
          searchQuery: criteria?.search || "",
          activeTab: tab
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load skills")
      } finally {
        setIsLoading(false)
      }
    },
    [activeTab, communityCategory, updateContext]
  )

  useEffect(() => {
    loadSkills()
    loadGatewaySkills()
  }, [loadSkills, loadGatewaySkills])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      loadSkills({ search: query }, activeTab, communityCategory)
    },
    [activeTab, communityCategory, loadSkills]
  )

  const handleSelectSkill = useCallback(
    (skill: SkillMeta) => {
      setSelectedSkill(skill)
      updateContext({ selectedSkillId: skill.id })
      sendEvent("skill-selected", { skillId: skill.id })
    },
    [updateContext, sendEvent]
  )

  const handleRefresh = useCallback(() => {
    loadSkills({ search: searchQuery }, activeTab, communityCategory)
    loadGatewaySkills()
  }, [activeTab, communityCategory, loadSkills, loadGatewaySkills, searchQuery])

  const localCount = activeTab === "local" ? total : 0
  const communityCount = activeTab === "community" ? total : 0

  if (isLoading && skills.length === 0) {
    return (
      <ModuleContainer config={skillsLibraryModuleConfig}>
        <LoadingModuleState message="Loading skills..." />
      </ModuleContainer>
    )
  }

  if (error && skills.length === 0) {
    return (
      <ModuleContainer config={skillsLibraryModuleConfig}>
        <ErrorModuleState error={error} onRetry={() => loadSkills()} />
      </ModuleContainer>
    )
  }

  return (
    <ModuleContainer config={skillsLibraryModuleConfig}>
      <div className="flex flex-col h-full bg-surface">
        {/* Header toolbar */}
        <div className="flex flex-col border-b border-border bg-surface">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <div className="flex gap-4 border-b border-transparent self-end mb-[-9px]">
              <button
                className={cn(
                  "pb-2 text-sm font-medium transition-colors border-b-2",
                  activeTab === "local"
                    ? "text-blue-400 border-blue-400"
                    : "text-text-muted border-transparent hover:text-text-primary"
                )}
                onClick={() => {
                  setActiveTab("local")
                  setCommunityCategory("all")
                  loadSkills({ search: searchQuery }, "local", "all")
                }}
              >
                Local Skills
              </button>
              <button
                className={cn(
                  "pb-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5",
                  activeTab === "community"
                    ? "text-blue-400 border-blue-400"
                    : "text-text-muted border-transparent hover:text-text-primary"
                )}
                onClick={() => {
                  setActiveTab("community")
                  loadSkills({ search: searchQuery }, "community", communityCategory)
                }}
              >
                <Globe2 className="h-3.5 w-3.5" />
                Community
              </button>
            </div>
            
            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder={`Search ${activeTab} skills...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-8 w-64 bg-surface-input border-border text-sm"
                />
              </div>
              {activeTab === "community" && (
                <select
                  value={communityCategory}
                  onChange={(e) => {
                    const next = e.target.value
                    setCommunityCategory(next)
                    loadSkills({ search: searchQuery }, "community", next)
                  }}
                  className="h-8 rounded-md border border-border bg-surface-input px-2 text-xs text-text-primary"
                >
                  <option value="all">All categories</option>
                  {communityCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "list"
                      ? "bg-surface-accent text-blue-400"
                      : "bg-surface-elevated text-text-muted hover:text-text-primary"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "grid"
                      ? "bg-surface-accent text-blue-400"
                      : "bg-surface-elevated text-text-muted hover:text-text-primary"
                  )}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                title="Refresh"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </button>
              <span className="text-xs text-text-muted tabular-nums ml-1">{total} skills</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 px-4 pb-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-[#171717] px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Source</div>
              <div className="mt-1 text-sm font-semibold text-text-primary">
                {activeTab === "community" ? "OpenClaw Community" : "Local Workspace"}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-[#171717] px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Visible</div>
              <div className="mt-1 text-sm font-semibold text-blue-400">{total}</div>
            </div>
            <div className="rounded-lg border border-border bg-[#171717] px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Gateway Sync</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                <Layers3 className={cn("h-4 w-4", gatewayLoading ? "animate-spin text-amber-400" : "text-emerald-400")} />
                <span className={cn(gatewayLoading ? "text-amber-400" : "text-emerald-400")}>
                  {gatewayLoading ? "Updating" : "Ready"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Skills list/grid */}
          {!selectedSkill && (
            <div className="w-full overflow-auto">
              {skills.length === 0 ? (
                <EmptyModuleState
                  icon={Wand2}
                  title="No skills found"
                  description="Skills will appear here once added"
                />
              ) : viewMode === "list" ? (
                <SkillsList
                  skills={skills}
                  selectedSkill={selectedSkill}
                  onSelectSkill={handleSelectSkill}
                  gatewaySkills={gatewaySkills}
                  onToggleSkill={toggleSkill}
                  gatewayLoading={gatewayLoading}
                />
              ) : (
                <SkillsGrid
                  skills={skills}
                  selectedSkill={selectedSkill}
                  onSelectSkill={handleSelectSkill}
                  gatewaySkills={gatewaySkills}
                  onToggleSkill={toggleSkill}
                  gatewayLoading={gatewayLoading}
                />
              )}
            </div>
          )}

          {/* Skill viewer/editor */}
          {selectedSkill && (
            <div className="w-full">
              <SkillDocumentViewer
                skill={selectedSkill}
                onClose={() => {
                  setSelectedSkill(null)
                  setIsViewerFullWidth(false)
                }}
                isFullWidth={isViewerFullWidth}
                onToggleFullWidth={() => setIsViewerFullWidth(!isViewerFullWidth)}
                onSave={() => loadSkills({ search: searchQuery })}
              />
            </div>
          )}
        </div>
      </div>
    </ModuleContainer>
  )
}

// ============================================================================
// Skills List View
// ============================================================================

interface SkillsViewProps {
  skills: SkillMeta[]
  selectedSkill: SkillMeta | null
  onSelectSkill: (skill: SkillMeta) => void
  gatewaySkills: Map<string, GatewaySkill>
  onToggleSkill: (id: string, enabled: boolean) => void
  gatewayLoading: boolean
}

function SkillsList({
  skills,
  selectedSkill,
  onSelectSkill,
  gatewaySkills,
  onToggleSkill,
  gatewayLoading,
}: SkillsViewProps) {
  return (
    <div className="p-3 space-y-2">
      {skills.map((skill) => {
        const gw = gatewaySkills.get(skill.id) || gatewaySkills.get(skill.name)
        const isEnabled = gw?.enabled ?? true
        return (
          <div
            key={skill.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectSkill(skill)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelectSkill(skill)
              }
            }}
            className={cn(
              "w-full text-left p-4 rounded-xl border transition-all group cursor-pointer",
              "hover:bg-surface-elevated hover:border-border-active hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-info/50",
              selectedSkill?.id === skill.id
                ? "bg-surface-elevated border-status-info ring-1 ring-status-info/20"
                : "bg-[#1a1a1a] border-border"
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "p-2.5 rounded-lg shrink-0 transition-colors",
                  isEnabled
                    ? "bg-surface-accent text-blue-400"
                    : "bg-[#1E1E1E] text-text-muted"
                )}
              >
                <Wand2 className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {skill.name}
                  </h3>
                  {gw && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider",
                        isEnabled
                          ? "bg-[#1a2f1a] border border-[#2a4a2a] text-emerald-400"
                          : "bg-[#2f1a1a] border border-[#4a2a2a] text-red-400"
                      )}
                    >
                      {isEnabled ? "Active" : "Disabled"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted line-clamp-1">{skill.description}</p>
                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {skill.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {gw && !(skill as any).isCommunity && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Switch
                      checked={isEnabled}
                      disabled={gatewayLoading}
                      onCheckedChange={(checked) =>
                        onToggleSkill(String(gw.id), checked)
                      }
                    />
                  </div>
                )}
                {(skill as any).isCommunity ? (
                  <Download className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Skills Grid View
// ============================================================================

function SkillsGrid({
  skills,
  selectedSkill,
  onSelectSkill,
  gatewaySkills,
  onToggleSkill,
  gatewayLoading,
}: SkillsViewProps) {
  return (
    <div className="p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {skills.map((skill) => {
        const gw = gatewaySkills.get(skill.id) || gatewaySkills.get(skill.name)
        const isEnabled = gw?.enabled ?? true
        return (
          <div
            key={skill.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectSkill(skill)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelectSkill(skill)
              }
            }}
            className={cn(
              "text-left rounded-xl border transition-all group relative overflow-hidden cursor-pointer",
              "hover:border-border-active hover:shadow-lg hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-info/50",
              selectedSkill?.id === skill.id
                ? "bg-surface-elevated border-status-info ring-1 ring-status-info/20"
                : "bg-[#1a1a1a] border-border hover:bg-surface-elevated"
            )}
          >
            {/* Top accent bar */}
            <div
              className={cn(
                "h-1 w-full",
                isEnabled ? "bg-gradient-to-r from-blue-500/60 to-blue-400/30" : "bg-border"
              )}
            />

            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    (skill as any).isCommunity
                      ? "bg-emerald-500/10 text-emerald-400"
                      : isEnabled
                      ? "bg-surface-accent text-blue-400"
                      : "bg-[#1E1E1E] text-text-muted"
                  )}
                >
                  {(skill as any).isCommunity ? <Globe2 className="h-5 w-5" /> : <Wand2 className="h-5 w-5" />}
                </div>
                {gw && !(skill as any).isCommunity && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Switch
                      checked={isEnabled}
                      disabled={gatewayLoading}
                      onCheckedChange={(checked) =>
                        onToggleSkill(String(gw.id), checked)
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text-primary line-clamp-1 mb-1">
                  {skill.name}
                </h3>
                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {skill.description}
                </p>
              </div>

              {skill.tags && skill.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {skill.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                {(skill as any).isCommunity ? (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                    Community
                  </span>
                ) : gw ? (
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wider",
                      isEnabled ? "text-blue-400" : "text-red-400"
                    )}
                  >
                    {isEnabled ? "Active" : "Disabled"}
                  </span>
                ) : (
                  <span className="text-[10px] text-text-muted">Local</span>
                )}
                {(skill as any).isCommunity ? (
                  <Download className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Skill Document Viewer/Editor
// ============================================================================

interface SkillDocumentViewerProps {
  skill: SkillMeta
  onClose: () => void
  isFullWidth?: boolean
  onToggleFullWidth?: () => void
  onSave?: () => void
}

function SkillDocumentViewer({ skill, onClose, onSave }: SkillDocumentViewerProps) {
  const isCommunity = Boolean((skill as any).isCommunity)
  const truncatedDesc =
    skill.description.length > 80
      ? skill.description.slice(0, 80) + "..."
      : skill.description

  const document: DocumentMeta = {
    id: skill.id,
    title: skill.name,
    contentType: "text/markdown",
    path: skill.path,
    subtitle: truncatedDesc,
  }

  const fetchContent = useCallback(async (): Promise<string> => {
    const response = await fetch(
      `/api/skills?path=${encodeURIComponent(skill.path)}`
    )
    if (!response.ok) throw new Error("Failed to load skill")
    const content = await response.text()
    const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/)
    return match ? match[1] : content
  }, [skill.path])

  const handleSave = useCallback(
    async (content: string): Promise<boolean> => {
      if (isCommunity) return false
      const response = await fetch("/api/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: skill.path, content }),
      })
      return response.ok
    },
    [isCommunity, skill.path]
  )

  return (
    <FileDocumentViewer
      document={document}
      icon={Wand2}
      fetchContent={fetchContent}
      onSave={handleSave}
      editable={!isCommunity}
      onClose={onClose}
      onSaveComplete={onSave}
      headerContent={
        isCommunity ? (
          <a
            href={skill.path}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            Open source page
          </a>
        ) : null
      }
    />
  )
}
