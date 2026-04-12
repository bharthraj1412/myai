"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Volume2,
  VolumeX,
  Play,
  Settings2,
  X,
  Gauge,
  Music2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getVoiceEngine, type VoiceSettings } from "@/lib/voice-engine"

interface VoiceSettingsDialogProps {
  open: boolean
  onClose: () => void
}

export function VoiceSettingsDialog({ open, onClose }: VoiceSettingsDialogProps) {
  const engine = getVoiceEngine()
  const [settings, setSettings] = useState<VoiceSettings>(engine.getSettings())
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isPreviewing, setIsPreviewing] = useState(false)

  // Load available voices
  useEffect(() => {
    if (!open) return

    const loadVoices = () => {
      const available = engine.getAvailableVoices()
      if (available.length > 0) {
        setVoices(available)
      }
    }

    loadVoices()

    // Voices may load asynchronously
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
      }
    }
  }, [open, engine])

  // Subscribe to voice state for preview tracking
  useEffect(() => {
    if (!open) return
    const unsub = engine.subscribe((state) => {
      setIsPreviewing(
        state.isSpeaking && state.currentMessageId === "__preview__",
      )
    })
    return unsub
  }, [open, engine])

  const updateSetting = useCallback(
    <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
      const updated = { ...settings, [key]: value }
      setSettings(updated)
      engine.updateSettings({ [key]: value })
    },
    [settings, engine],
  )

  const handlePreview = useCallback(() => {
    if (isPreviewing) {
      engine.stop()
    } else {
      engine.preview()
    }
  }, [isPreviewing, engine])

  if (!open) return null

  const isSupported = engine.isSupported()

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
          "relative z-10 w-full max-w-md mx-4 rounded-2xl",
          "bg-[#1a1a1a]/95 backdrop-blur-xl border border-[#2a2a2a]",
          "shadow-2xl shadow-black/50",
          "animate-in fade-in slide-in-from-bottom-4 duration-200",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Settings2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Voice Settings
              </h2>
              <p className="text-xs text-text-muted">
                Configure AI speech output
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#252525] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isSupported ? (
          <div className="px-6 py-8 text-center">
            <VolumeX className="h-10 w-10 mx-auto mb-3 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Speech synthesis is not supported in this browser.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Try Chrome, Edge, or Safari for voice features.
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Auto-speak Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-primary">
                  Auto-speak responses
                </div>
                <div className="text-xs text-text-muted">
                  Reads AI responses aloud automatically
                </div>
              </div>
              <button
                onClick={() => updateSetting("autoSpeak", !settings.autoSpeak)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-all duration-200",
                  settings.autoSpeak
                    ? "bg-blue-500"
                    : "bg-[#3a3a3a]",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                    settings.autoSpeak
                      ? "translate-x-[22px]"
                      : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {/* Skip Code Blocks Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-primary">
                  Skip code blocks
                </div>
                <div className="text-xs text-text-muted">
                  Don&apos;t read code aloud
                </div>
              </div>
              <button
                onClick={() =>
                  updateSetting("skipCodeBlocks", !settings.skipCodeBlocks)
                }
                className={cn(
                  "relative w-11 h-6 rounded-full transition-all duration-200",
                  settings.skipCodeBlocks
                    ? "bg-blue-500"
                    : "bg-[#3a3a3a]",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                    settings.skipCodeBlocks
                      ? "translate-x-[22px]"
                      : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {/* Voice Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Music2 className="h-3.5 w-3.5 text-text-muted" />
                Voice
              </label>
              <select
                value={settings.voiceURI}
                onChange={(e) => updateSetting("voiceURI", e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm",
                  "bg-[#252525] border border-[#3a3a3a] text-text-primary",
                  "focus:outline-none focus:ring-1 focus:ring-blue-500/50",
                  "cursor-pointer appearance-none",
                )}
              >
                {voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name}{" "}
                    {voice.lang ? `(${voice.lang})` : ""}
                    {voice.localService ? "" : " ☁️"}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Slider */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Gauge className="h-3.5 w-3.5 text-text-muted" />
                  Speed
                </span>
                <span className="text-xs font-mono text-text-muted">
                  {settings.rate.toFixed(1)}x
                </span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.rate}
                onChange={(e) =>
                  updateSetting("rate", parseFloat(e.target.value))
                }
                className="w-full h-1.5 rounded-full appearance-none bg-[#3a3a3a] accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Pitch Slider */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-text-muted" />
                  Pitch
                </span>
                <span className="text-xs font-mono text-text-muted">
                  {settings.pitch.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.pitch}
                onChange={(e) =>
                  updateSetting("pitch", parseFloat(e.target.value))
                }
                className="w-full h-1.5 rounded-full appearance-none bg-[#3a3a3a] accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>
            </div>

            {/* Volume Slider */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  {settings.volume > 0 ? (
                    <Volume2 className="h-3.5 w-3.5 text-text-muted" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-text-muted" />
                  )}
                  Volume
                </span>
                <span className="text-xs font-mono text-text-muted">
                  {Math.round(settings.volume * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={settings.volume}
                onChange={(e) =>
                  updateSetting("volume", parseFloat(e.target.value))
                }
                className="w-full h-1.5 rounded-full appearance-none bg-[#3a3a3a] accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Preview Button */}
            <button
              onClick={handlePreview}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                "text-sm font-medium transition-all duration-200",
                isPreviewing
                  ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                  : "bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30",
              )}
            >
              {isPreviewing ? (
                <>
                  <div className="flex items-center gap-0.5">
                    <span className="w-0.5 h-3 bg-red-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                    <span className="w-0.5 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                  </div>
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Preview Voice
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
