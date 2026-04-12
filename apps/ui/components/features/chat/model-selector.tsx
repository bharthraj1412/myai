"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, Plus, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomModelDialog, loadCustomModels, removeCustomModel, type CustomModel } from "./custom-model-dialog"

// Available models - model IDs (Anthropic direct or OpenRouter)
export const AVAILABLE_MODELS = [
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "Anthropic" },
  { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5", provider: "Anthropic" },
  { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic" },
  { id: "openrouter/free", name: "OpenRouter Free", provider: "OpenRouter" },
  { id: "deepseek/deepseek-v3.2-speciale", name: "DeepSeek V3.2 Speciale", provider: "DeepSeek" },
  { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2", provider: "DeepSeek" },
  { id: "z-ai/glm-4.7-flash", name: "GLM 4.7 Flash", provider: "Z-AI" },
  { id: "z-ai/glm-4.7", name: "GLM 4.7", provider: "Z-AI" },
  { id: "x-ai/grok-4.1-fast", name: "Grok 4.1 Fast", provider: "xAI" },
  { id: "x-ai/grok-code-fast-1", name: "Grok Code Fast 1", provider: "xAI" },
  { id: "qwen/qwen-2.5-coder-32b-instruct", name: "Qwen2.5 Coder 32B", provider: "Qwen" },
  { id: "moonshotai/kimi-k2.5", name: "Kimi K2.5", provider: "Moonshot" },
  { id: "moonshotai/kimi-k2-thinking", name: "Kimi K2 Thinking", provider: "Moonshot" },
] as const

export type ModelId = typeof AVAILABLE_MODELS[number]["id"] | string

/** Get all models including custom ones from localStorage */
export function getAllModels(): Array<{ id: string; name: string; provider: string; isCustom?: boolean }> {
  const builtIn = AVAILABLE_MODELS.map((m) => ({ ...m, isCustom: false }))
  const custom = loadCustomModels().map((m) => ({
    id: m.id,
    name: m.name || m.modelName,
    provider: m.provider || "Custom",
    isCustom: true,
  }))
  return [...builtIn, ...custom]
}

/** Get the set of all valid model IDs (built-in + custom) */
export function getValidModelIds(): Set<string> {
  return new Set(getAllModels().map((m) => m.id))
}

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  className?: string
  disabled?: boolean
  compact?: boolean  // Compact mode for inline display
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  className,
  disabled = false,
  compact = false,
}: ModelSelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [customModels, setCustomModels] = useState<CustomModel[]>([])

  // Load custom models on mount
  useEffect(() => {
    setCustomModels(loadCustomModels())
  }, [])

  const allModels = getAllModels()
  const currentModel = allModels.find(m => m.id === selectedModel) || allModels[0]

  const handleChange = useCallback((value: string) => {
    if (value === "__add_custom__") {
      setShowAddDialog(true)
      return
    }
    onModelChange(value)
  }, [onModelChange])

  const handleModelAdded = useCallback(() => {
    const updated = loadCustomModels()
    setCustomModels(updated)
    // Auto-select the newly added model
    if (updated.length > 0) {
      onModelChange(updated[updated.length - 1].id)
    }
  }, [onModelChange])

  const handleRemoveCustom = useCallback((modelId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    removeCustomModel(modelId)
    const updated = loadCustomModels()
    setCustomModels(updated)
    // If we removed the currently selected model, switch to default
    if (selectedModel === modelId) {
      onModelChange(AVAILABLE_MODELS[0].id)
    }
  }, [selectedModel, onModelChange])

  return (
    <>
      <div className={cn("relative", compact ? "min-w-0 flex-1" : "inline-block", className)}>
        <select
          value={selectedModel}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          aria-label="Select AI model"
          className={cn(
            "appearance-none bg-surface-elevated border border-interactive-border rounded-md cursor-pointer",
            "hover:bg-interactive-hover focus:outline-none focus:ring-1 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            compact
              ? "w-full pl-2 pr-6 py-1 text-xs text-text-secondary truncate"
              : "pl-3 pr-8 py-1.5 text-sm text-text-primary"
          )}
        >
          {/* Built-in Models */}
          <optgroup label="Built-in Models">
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {compact ? model.name : `${model.name} (${model.provider})`}
              </option>
            ))}
          </optgroup>

          {/* Custom Models */}
          {customModels.length > 0 && (
            <optgroup label="Custom Models">
              {customModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {compact
                    ? `⚡ ${model.name || model.modelName}`
                    : `⚡ ${model.name || model.modelName} (${model.provider || "Custom"})`}
                </option>
              ))}
            </optgroup>
          )}

          {/* Add Custom Option */}
          <optgroup label="───────────">
            <option value="__add_custom__">＋ Add Custom Model...</option>
          </optgroup>
        </select>
        <ChevronDown className={cn(
          "absolute top-1/2 -translate-y-1/2 text-text-muted pointer-events-none",
          compact ? "right-1 h-3 w-3" : "right-2 h-4 w-4"
        )} />
      </div>

      {/* Add Custom Model Dialog */}
      <CustomModelDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onModelAdded={handleModelAdded}
      />
    </>
  )
}

