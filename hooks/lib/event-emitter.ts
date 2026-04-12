/**
 * AG3NT Hook System — Event Emitter
 * 
 * Append-only event logging to MEMORY/STATE/events.jsonl.
 * All hooks emit structured events for observability.
 * 
 * Adapted from PAI's hooks/lib/event-emitter.ts
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { getMemoryDir } from './hook-io';
import { getJSONLTimestamp } from './time';

export interface AG3NTEvent {
  timestamp: string;
  session_id: string;
  source: string;        // Hook or component name
  type: string;          // Dot-separated topic (e.g., "algorithm.phase", "rating.captured")
  [key: string]: any;    // Type-specific fields
}

/**
 * Append a structured event to the unified event log.
 * Fire-and-forget — errors are silently swallowed.
 */
export function appendEvent(
  sessionId: string,
  source: string,
  type: string,
  data: Record<string, any> = {}
): void {
  try {
    const eventsPath = join(getMemoryDir(), 'STATE', 'events.jsonl');
    const dir = dirname(eventsPath);
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const event: AG3NTEvent = {
      timestamp: getJSONLTimestamp(),
      session_id: sessionId,
      source,
      type,
      ...data
    };

    appendFileSync(eventsPath, JSON.stringify(event) + '\n');
  } catch {
    // Silent — events.jsonl must never disrupt hook execution
  }
}

/**
 * Common event types for consistency across hooks.
 */
export const EventTypes = {
  // Session lifecycle
  SESSION_START: 'session.start',
  SESSION_END: 'session.end',
  SESSION_NAMED: 'session.named',
  
  // Algorithm
  ALGORITHM_START: 'algorithm.start',
  ALGORITHM_PHASE: 'algorithm.phase',
  ALGORITHM_COMPLETE: 'algorithm.complete',
  
  // Work
  WORK_CREATED: 'work.created',
  WORK_UPDATED: 'work.updated',
  WORK_COMPLETED: 'work.completed',
  
  // Learning
  RATING_CAPTURED: 'rating.captured',
  LEARNING_CAPTURED: 'learning.captured',
  FAILURE_CAPTURED: 'failure.captured',
  
  // Security
  SECURITY_BLOCK: 'security.block',
  SECURITY_ALLOW: 'security.allow',
  
  // Voice
  VOICE_SENT: 'voice.sent',
  
  // Tool
  TOOL_PRE: 'tool.pre',
  TOOL_POST: 'tool.post',
} as const;
