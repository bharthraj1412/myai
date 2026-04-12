/**
 * AG3NT Hook System — Shared I/O Utilities
 * 
 * Provides stdin reading, JSON parsing, and output helpers
 * for all hooks in the AG3NT lifecycle system.
 * 
 * Adapted from PAI's hooks/lib/hook-io.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface HookInput {
  session_id: string;
  transcript_path?: string;
  hook_event_name: string;
  prompt?: string;              // UserPromptSubmit only
  tool_name?: string;           // PreToolUse/PostToolUse
  tool_input?: any;             // PreToolUse
  tool_output?: any;            // PostToolUse
  last_assistant_message?: string; // Stop event
  cwd?: string;
}

/**
 * Read and parse JSON from stdin with timeout protection.
 */
export async function readStdin(timeoutMs: number = 2000): Promise<HookInput | null> {
  try {
    const chunks: Buffer[] = [];
    
    const stdinPromise = new Promise<string>((resolve, reject) => {
      process.stdin.on('data', (chunk) => chunks.push(chunk));
      process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      process.stdin.on('error', reject);
    });

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('stdin timeout')), timeoutMs);
    });

    const raw = await Promise.race([stdinPromise, timeoutPromise]);
    return JSON.parse(raw) as HookInput;
  } catch {
    return null;
  }
}

/**
 * Get the AG3NT base directory from environment.
 */
export function getAG3NTDir(): string {
  return process.env.AG3NT_DIR || join(process.env.HOME || process.env.USERPROFILE || '', '.ag3nt');
}

/**
 * Get the MEMORY directory path.
 */
export function getMemoryDir(): string {
  return process.env.AG3NT_MEMORY_DIR || join(getAG3NTDir(), 'MEMORY');
}

/**
 * Load settings.json from the config directory.
 */
export function loadSettings(): any {
  const settingsPath = join(getAG3NTDir(), 'config', 'settings.json');
  if (existsSync(settingsPath)) {
    return JSON.parse(readFileSync(settingsPath, 'utf-8'));
  }
  return {};
}

/**
 * Safe process exit — always exit 0 to never block the agent.
 */
export function safeExit(code: number = 0): never {
  process.exit(0); // Always 0 — hooks must never block
}
