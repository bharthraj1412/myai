"use client"

import { useState, useCallback } from "react"
import {
  Plus,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Server,
  Key,
  Box,
  Tag,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomModel {
  id: string
  name: string
  provider: string
  baseUrl: string
  apiKey: string
  modelName: string
  createdAt: number
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "ag3nt_custom_models"

export function loadCustomModels(): CustomModel[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCustomModels(models: CustomModel[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models))
  } catch {
    /* quota exceeded */
  }
}

export function addCustomModel(model: CustomModel): void {
  const models = loadCustomModels()
  models.push(model)
  saveCustomModels(models)
}

export function removeCustomModel(id: string): void {
  const models = loadCustomModels().filter((m) => m.id !== id)
  saveCustomModels(models)
}

// ---------------------------------------------------------------------------
// Dialog Component
// ---------------------------------------------------------------------------

type ValidationStatus = "idle" | "testing" | "success" | "error"

interface CustomModelDialogProps {
  open: boolean
  onClose: () => void
  onModelAdded: () => void
}

export function CustomModelDialog({
  open,
  onClose,
  onModelAdded,
}: CustomModelDialogProps) {
  const [providerName, setProviderName] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [modelName, setModelName] = useState("")
  const [status, setStatus] = useState<ValidationStatus>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [latency, setLatency] = useState(0)

  const resetForm = useCallback(() => {
    setProviderName("")
    setBaseUrl("")
    setApiKey("")
    setModelName("")
    setStatus("idle")
    setErrorMsg("")
    setLatency(0)
  }, [])

  const handleValidate = useCallback(async () => {
    if (!baseUrl || !modelName) {
      setErrorMsg("Base URL and Model Name are required")
      setStatus("error")
      return
    }

    setStatus("testing")
    setErrorMsg("")

    try {
      const res = await fetch("/api/models/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey, modelName }),
      })

      const data = await res.json()

      if (data.valid) {
        setStatus("success")
        setLatency(data.latency_ms || 0)
      } else {
        setStatus("error")
        setErrorMsg(data.error || "Validation failed")
      }
    } catch (err) {
      setStatus("error")
      setErrorMsg(
        err instanceof Error ? err.message : "Network error during validation",
      )
    }
  }, [baseUrl, apiKey, modelName])

  const handleAdd = useCallback(() => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const model: CustomModel = {
      id,
      name: providerName || modelName,
      provider: providerName || "Custom",
      baseUrl,
      apiKey,
      modelName,
      createdAt: Date.now(),
    }

    addCustomModel(model)
    onModelAdded()
    resetForm()
    onClose()
  }, [providerName, baseUrl, apiKey, modelName, onModelAdded, onClose, resetForm])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg mx-4 rounded-2xl",
          "bg-[#1a1a1a]/95 backdrop-blur-xl border border-[#2a2a2a]",
          "shadow-2xl shadow-black/50",
          "animate-in fade-in slide-in-from-bottom-4 duration-200",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
              <Plus className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Add Custom Model
              </h2>
              <p className="text-xs text-text-muted">
                OpenAI-compatible endpoints (vLLM, Ollama, LiteLLM, etc.)
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); onClose() }}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#252525] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Provider Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Tag className="h-3.5 w-3.5 text-text-muted" />
              Provider Name
              <span className="text-xs text-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="e.g., My Local Ollama"
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-[#252525] border border-[#3a3a3a] text-text-primary",
                "placeholder:text-text-muted/50",
                "focus:outline-none focus:ring-1 focus:ring-blue-500/50",
              )}
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Server className="h-3.5 w-3.5 text-text-muted" />
              Base URL
              <span className="text-xs text-red-400">*</span>
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => { setBaseUrl(e.target.value); setStatus("idle") }}
              placeholder="https://api.example.com/v1 or http://localhost:11434/v1"
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm font-mono",
                "bg-[#252525] border border-[#3a3a3a] text-text-primary",
                "placeholder:text-text-muted/50",
                "focus:outline-none focus:ring-1 focus:ring-blue-500/50",
              )}
            />
          </div>

          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Key className="h-3.5 w-3.5 text-text-muted" />
              API Key
              <span className="text-xs text-text-muted font-normal">(optional for local)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setStatus("idle") }}
              placeholder="sk-..."
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm font-mono",
                "bg-[#252525] border border-[#3a3a3a] text-text-primary",
                "placeholder:text-text-muted/50",
                "focus:outline-none focus:ring-1 focus:ring-blue-500/50",
              )}
            />
          </div>

          {/* Model Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Box className="h-3.5 w-3.5 text-text-muted" />
              Model Name
              <span className="text-xs text-red-400">*</span>
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => { setModelName(e.target.value); setStatus("idle") }}
              placeholder="e.g., llama3:8b, gpt-4o, mistral-7b"
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm font-mono",
                "bg-[#252525] border border-[#3a3a3a] text-text-primary",
                "placeholder:text-text-muted/50",
                "focus:outline-none focus:ring-1 focus:ring-blue-500/50",
              )}
            />
          </div>

          {/* Validation Status */}
          {status !== "idle" && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm",
                status === "testing" && "bg-blue-500/10 border border-blue-500/20 text-blue-400",
                status === "success" && "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
                status === "error" && "bg-red-500/10 border border-red-500/20 text-red-400",
              )}
            >
              {status === "testing" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing connection...
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Connection successful!
                  {latency > 0 && (
                    <span className="text-xs text-text-muted ml-auto">
                      {latency}ms
                    </span>
                  )}
                </>
              )}
              {status === "error" && (
                <>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-2">{errorMsg}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a2a2a]">
          <button
            onClick={handleValidate}
            disabled={status === "testing" || !baseUrl || !modelName}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              "bg-[#252525] border border-[#3a3a3a] text-text-primary",
              "hover:bg-[#303030] hover:border-[#454545]",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            {status === "testing" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Testing...
              </span>
            ) : (
              "Validate"
            )}
          </button>

          <button
            onClick={handleAdd}
            disabled={status !== "success"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              status === "success"
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-[#252525] border border-[#3a3a3a] text-text-muted cursor-not-allowed opacity-40",
            )}
          >
            Add Model
          </button>
        </div>
      </div>
    </div>
  )
}
