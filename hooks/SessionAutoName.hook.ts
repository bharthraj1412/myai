/**
 * SessionAutoName.hook.ts — Automatic session naming
 * 
 * Generates a short descriptive name for the session from
 * the first substantive user prompt.
 * 
 * Runs on: UserPromptSubmit
 * Writes to: MEMORY/STATE/session-names.json
 * 
 * Adapted from PAI's SessionAutoName.hook.ts
 */

import { readStdin, getMemoryDir, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Generate a short session name from a user prompt.
 * Uses simple heuristic extraction (no inference needed).
 */
function generateSessionName(prompt: string): string {
  // Remove common filler words and extract key terms
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'can', 'shall',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me',
    'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they',
    'please', 'help', 'want', 'need', 'like', 'just', 'also'
  ]);

  const words = prompt
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .slice(0, 4);

  if (words.length === 0) return 'unnamed-session';

  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

async function main() {
  try {
    const input = await readStdin();
    if (!input || !input.prompt) return safeExit();

    const prompt = input.prompt.trim();
    
    // Skip very short prompts, ratings, or single-word responses
    if (prompt.length < 10 || /^\d{1,2}$/.test(prompt)) {
      return safeExit();
    }

    const stateDir = join(getMemoryDir(), 'STATE');
    const namesPath = join(stateDir, 'session-names.json');

    // Load existing names
    let names: Record<string, string> = {};
    if (existsSync(namesPath)) {
      try {
        names = JSON.parse(readFileSync(namesPath, 'utf-8'));
      } catch {
        names = {};
      }
    }

    // Only name sessions once (first substantive prompt)
    if (names[input.session_id]) {
      return safeExit();
    }

    // Generate name
    const sessionName = generateSessionName(prompt);
    names[input.session_id] = sessionName;

    // Save
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }
    writeFileSync(namesPath, JSON.stringify(names, null, 2), 'utf-8');

    // Emit event
    appendEvent(
      input.session_id,
      'SessionAutoName',
      EventTypes.SESSION_NAMED,
      { name: sessionName }
    );

    console.error(`🏷️ Session named: "${sessionName}"`);

  } catch (error) {
    console.error('SessionAutoName hook error:', error);
  }

  safeExit();
}

main();
