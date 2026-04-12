/**
 * AG3NT Voice Engine — Human-like Text-to-Speech
 *
 * Uses the browser-native Web Speech API with a prosody engine
 * for natural-sounding sentence delivery: pitch variation,
 * pause insertion, and smart chunking.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceSettings {
  /** Selected voice URI (from speechSynthesis.getVoices()) */
  voiceURI: string;
  /** Speech rate: 0.5 → 2.0, default 1.0 */
  rate: number;
  /** Pitch: 0.5 → 2.0, default 1.0 */
  pitch: number;
  /** Auto-speak AI responses */
  autoSpeak: boolean;
  /** Skip code blocks when speaking */
  skipCodeBlocks: boolean;
  /** Volume: 0.0 → 1.0, default 0.9 */
  volume: number;
}

export interface VoiceState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentMessageId: string | null;
  /** Progress through current speech: 0.0 → 1.0 */
  progress: number;
}

type VoiceStateListener = (state: VoiceState) => void;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: VoiceSettings = {
  voiceURI: "",
  rate: 1.0,
  pitch: 1.0,
  autoSpeak: false,
  skipCodeBlocks: true,
  volume: 0.9,
};

const STORAGE_KEY = "ag3nt_voice_settings";

// Sentence boundary patterns for chunking
const SENTENCE_SPLITTER =
  /(?<=[.!?])\s+(?=[A-Z\u00C0-\u024F"])|(?<=[.!?])$/g;

// Code block patterns to strip
const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]+`/g;

// Markdown formatting to strip
const MARKDOWN_PATTERNS = [
  /\*\*([^*]+)\*\*/g,     // bold
  /\*([^*]+)\*/g,          // italic
  /__([^_]+)__/g,          // bold alt
  /_([^_]+)_/g,            // italic alt
  /~~([^~]+)~~/g,          // strikethrough
  /^#{1,6}\s+/gm,          // headings
  /^\s*[-*+]\s+/gm,        // unordered lists
  /^\s*\d+\.\s+/gm,        // ordered lists
  /\[([^\]]+)\]\([^)]+\)/g, // links → text only
  /!\[([^\]]*)\]\([^)]+\)/g, // images → alt text
  /^>\s+/gm,               // blockquotes
  /\n{3,}/g,                // excess newlines
];

// ---------------------------------------------------------------------------
// Prosody Engine — Makes speech sound more natural
// ---------------------------------------------------------------------------

interface ProsodyChunk {
  text: string;
  rate: number;
  pitch: number;
  /**
   * Pause in ms BEFORE this chunk.
   * Used after sentence-ending punctuation for breath simulation.
   */
  pauseBefore: number;
}

function analyzeProsody(
  sentence: string,
  baseRate: number,
  basePitch: number,
): ProsodyChunk {
  let rate = baseRate;
  let pitch = basePitch;
  let pauseBefore = 100; // Default inter-sentence pause

  const trimmed = sentence.trim();
  if (!trimmed) return { text: trimmed, rate, pitch, pauseBefore: 0 };

  // Questions — slight pitch rise
  if (trimmed.endsWith("?")) {
    pitch = Math.min(2.0, basePitch + 0.15);
  }

  // Exclamations — slight emphasis
  if (trimmed.endsWith("!")) {
    pitch = Math.min(2.0, basePitch + 0.1);
    rate = Math.max(0.5, baseRate - 0.05);
  }

  // Longer sentences — slightly faster to maintain engagement
  if (trimmed.length > 150) {
    rate = Math.min(2.0, baseRate + 0.08);
  }

  // Short responses — slower, more deliberate
  if (trimmed.length < 30) {
    rate = Math.max(0.5, baseRate - 0.05);
  }

  // After period/semicolon — longer breath pause
  if (trimmed.endsWith(".") || trimmed.endsWith(";")) {
    pauseBefore = 180;
  }

  // After colon — moderate pause (introducing a list/explanation)
  if (trimmed.endsWith(":")) {
    pauseBefore = 250;
  }

  // Comma-heavy sentences — gentle pace
  const commaCount = (trimmed.match(/,/g) || []).length;
  if (commaCount >= 3) {
    rate = Math.max(0.5, baseRate - 0.05);
  }

  return { text: trimmed, rate, pitch, pauseBefore };
}

// ---------------------------------------------------------------------------
// Text Preprocessing
// ---------------------------------------------------------------------------

function preprocessForSpeech(text: string, skipCode: boolean): string {
  let processed = text;

  // Strip code blocks
  if (skipCode) {
    processed = processed.replace(CODE_BLOCK_PATTERN, " (code block omitted) ");
    processed = processed.replace(INLINE_CODE_PATTERN, (match) => {
      // Keep short inline code as-is (variable names, etc.)
      const inner = match.slice(1, -1);
      return inner.length < 20 ? inner : "(code omitted)";
    });
  }

  // Strip markdown formatting, keeping text content
  for (const pattern of MARKDOWN_PATTERNS) {
    processed = processed.replace(pattern, "$1");
  }

  // Clean up whitespace
  processed = processed.replace(/\n+/g, ". ");
  processed = processed.replace(/\s+/g, " ");
  processed = processed.trim();

  return processed;
}

function chunkIntoSentences(text: string): string[] {
  // First try splitting on sentence boundaries
  const sentences = text.split(SENTENCE_SPLITTER).filter((s) => s.trim());

  if (sentences.length <= 1) {
    // If no natural boundaries, split on commas/semicolons for long text
    if (text.length > 200) {
      return text
        .split(/(?<=[,;])\s+/)
        .filter((s) => s.trim())
        .map((s) => s.trim());
    }
    return [text.trim()];
  }

  return sentences.map((s) => s.trim());
}

// ---------------------------------------------------------------------------
// Voice Engine Class
// ---------------------------------------------------------------------------

class VoiceEngine {
  private settings: VoiceSettings;
  private state: VoiceState;
  private listeners: Set<VoiceStateListener> = new Set();
  private utteranceQueue: SpeechSynthesisUtterance[] = [];
  private currentChunkIndex: number = 0;
  private totalChunks: number = 0;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  constructor() {
    this.settings = this.loadSettings();
    this.state = {
      isSpeaking: false,
      isPaused: false,
      currentMessageId: null,
      progress: 0,
    };

    // Load voices (they may load asynchronously)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.loadVoices();
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        this.loadVoices();
      });
    }
  }

  // ---- Settings persistence ----

  private loadSettings(): VoiceSettings {
    if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {
      /* ignore corrupted data */
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      /* quota exceeded, ignore */
    }
  }

  // ---- Voice loading ----

  private loadVoices(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this.availableVoices = voices;
      this.voicesLoaded = true;

      // Auto-select a good default voice if none is set
      if (!this.settings.voiceURI) {
        const preferred = this.selectBestVoice(voices);
        if (preferred) {
          this.settings.voiceURI = preferred.voiceURI;
          this.saveSettings();
        }
      }
    }
  }

  private selectBestVoice(
    voices: SpeechSynthesisVoice[],
  ): SpeechSynthesisVoice | null {
    // Preference order: en-US natural/premium > en-US default > en > any
    const priorities = [
      (v: SpeechSynthesisVoice) =>
        v.lang.startsWith("en") &&
        (v.name.toLowerCase().includes("natural") ||
          v.name.toLowerCase().includes("premium") ||
          v.name.toLowerCase().includes("neural")),
      (v: SpeechSynthesisVoice) =>
        v.lang.startsWith("en-US") && v.localService,
      (v: SpeechSynthesisVoice) =>
        v.lang.startsWith("en-GB") && v.localService,
      (v: SpeechSynthesisVoice) => v.lang.startsWith("en"),
      (v: SpeechSynthesisVoice) => v.default,
    ];

    for (const predicate of priorities) {
      const match = voices.find(predicate);
      if (match) return match;
    }

    return voices[0] || null;
  }

  private getSelectedVoice(): SpeechSynthesisVoice | null {
    if (!this.settings.voiceURI) return null;
    return (
      this.availableVoices.find(
        (v) => v.voiceURI === this.settings.voiceURI,
      ) || null
    );
  }

  // ---- State management ----

  private updateState(partial: Partial<VoiceState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((fn) => fn(this.state));
  }

  subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    // Emit current state immediately
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): VoiceState {
    return { ...this.state };
  }

  // ---- Public API ----

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * Speak the given text with human-like prosody.
   * Cancels any current speech first.
   */
  speak(text: string, messageId?: string): void {
    if (!this.isSupported()) return;

    // Cancel current speech
    this.stop();

    // Preprocess text
    const cleaned = preprocessForSpeech(text, this.settings.skipCodeBlocks);
    if (!cleaned) return;

    // Chunk into sentences
    const sentences = chunkIntoSentences(cleaned);
    this.totalChunks = sentences.length;
    this.currentChunkIndex = 0;

    this.updateState({
      isSpeaking: true,
      isPaused: false,
      currentMessageId: messageId || null,
      progress: 0,
    });

    // Build prosody-enhanced utterances
    const chunks = sentences.map((sentence) =>
      analyzeProsody(sentence, this.settings.rate, this.settings.pitch),
    );

    this.speakChunks(chunks);
  }

  private speakChunks(chunks: ProsodyChunk[]): void {
    if (chunks.length === 0 || !this.state.isSpeaking) {
      this.updateState({
        isSpeaking: false,
        isPaused: false,
        progress: 1.0,
      });
      return;
    }

    const chunk = chunks[0];
    const remaining = chunks.slice(1);

    // Apply inter-sentence pause
    const startSpeaking = () => {
      const utterance = new SpeechSynthesisUtterance(chunk.text);

      // Apply voice
      const voice = this.getSelectedVoice();
      if (voice) utterance.voice = voice;

      // Apply prosody
      utterance.rate = chunk.rate;
      utterance.pitch = chunk.pitch;
      utterance.volume = this.settings.volume;

      utterance.onend = () => {
        this.currentChunkIndex++;
        this.updateState({
          progress: this.currentChunkIndex / this.totalChunks,
        });

        // Speak next chunk
        this.speakChunks(remaining);
      };

      utterance.onerror = (event) => {
        // 'canceled' is expected when stop() is called
        if (event.error !== "canceled") {
          console.warn("[VoiceEngine] Speech error:", event.error);
        }
        this.updateState({
          isSpeaking: false,
          isPaused: false,
        });
      };

      window.speechSynthesis.speak(utterance);
    };

    if (chunk.pauseBefore > 0) {
      setTimeout(startSpeaking, chunk.pauseBefore);
    } else {
      startSpeaking();
    }
  }

  /**
   * Stop all current and queued speech.
   */
  stop(): void {
    if (!this.isSupported()) return;

    window.speechSynthesis.cancel();
    this.utteranceQueue = [];
    this.currentChunkIndex = 0;
    this.totalChunks = 0;

    this.updateState({
      isSpeaking: false,
      isPaused: false,
      currentMessageId: null,
      progress: 0,
    });
  }

  /**
   * Pause current speech.
   */
  pause(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.pause();
    this.updateState({ isPaused: true });
  }

  /**
   * Resume paused speech.
   */
  resume(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.resume();
    this.updateState({ isPaused: false });
  }

  /**
   * Toggle pause/resume.
   */
  togglePause(): void {
    if (this.state.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Speak a preview sentence with current settings.
   */
  preview(): void {
    this.speak(
      "Hello! I'm your AG3NT assistant. How can I help you today?",
      "__preview__",
    );
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _instance: VoiceEngine | null = null;

export function getVoiceEngine(): VoiceEngine {
  if (!_instance) {
    _instance = new VoiceEngine();
  }
  return _instance;
}

export type { VoiceEngine };
