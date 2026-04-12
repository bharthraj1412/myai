/**
 * RatingCapture.hook.ts — Unified rating detection
 * 
 * Handles both explicit ratings (e.g., "7", "8 - good work") 
 * and implicit sentiment analysis from user prompts.
 * 
 * Runs on: UserPromptSubmit
 * Writes to: MEMORY/LEARNING/SIGNALS/ratings.jsonl
 * 
 * Adapted from PAI's RatingCapture.hook.ts
 */

import { readStdin, getMemoryDir, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import { isLearningCapture, getLearningCategory, saveLearning } from './lib/learning-utils';
import { getJSONLTimestamp } from './lib/time';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Explicit rating patterns (e.g., "7", "8/10", "rating: 9", "8 - good work")
const EXPLICIT_RATING_PATTERNS = [
  /^(\d{1,2})$/,                          // Just a number: "7"
  /^(\d{1,2})\s*\/\s*10/,                 // Fraction: "8/10"
  /^(\d{1,2})\s*[-–—]\s*.+/,             // Number with comment: "8 - good work"
  /rating[:\s]+(\d{1,2})/i,               // "rating: 7"
  /^(\d{1,2})\s*out\s*of\s*10/i,          // "8 out of 10"
];

function extractExplicitRating(prompt: string): number | null {
  const trimmed = prompt.trim();
  
  for (const pattern of EXPLICIT_RATING_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const rating = parseInt(match[1], 10);
      if (rating >= 1 && rating <= 10) {
        return rating;
      }
    }
  }
  
  return null;
}

async function main() {
  try {
    const input = await readStdin();
    if (!input || !input.prompt) return safeExit();

    const prompt = input.prompt;
    const rating = extractExplicitRating(prompt);
    
    if (rating === null) {
      // No explicit rating detected — skip
      // Future: add implicit sentiment analysis here
      return safeExit();
    }

    // Ensure signals directory exists
    const signalsDir = join(getMemoryDir(), 'LEARNING', 'SIGNALS');
    if (!existsSync(signalsDir)) {
      mkdirSync(signalsDir, { recursive: true });
    }

    // Write rating to signals
    const ratingEntry = {
      timestamp: getJSONLTimestamp(),
      session_id: input.session_id,
      rating,
      prompt: prompt.substring(0, 200), // Truncate for storage
      type: 'explicit'
    };

    appendFileSync(
      join(signalsDir, 'ratings.jsonl'),
      JSON.stringify(ratingEntry) + '\n'
    );

    // Emit event
    appendEvent(
      input.session_id,
      'RatingCapture',
      EventTypes.RATING_CAPTURED,
      { rating, type: 'explicit' }
    );

    // Low ratings (1-3) trigger learning capture
    if (rating <= 3) {
      const learningContent = [
        `# Low Rating Learning Capture`,
        ``,
        `**Rating:** ${rating}/10`,
        `**Session:** ${input.session_id}`,
        `**Timestamp:** ${getJSONLTimestamp()}`,
        `**User Comment:** ${prompt}`,
        ``,
        `## Analysis`,
        ``,
        `Low satisfaction detected. This session needs review to identify:`,
        `- What went wrong`,
        `- Root cause of user frustration`,
        `- What should be done differently next time`,
      ].join('\n');

      saveLearning('ALGORITHM', `low-rating-${rating}`, learningContent);

      appendEvent(
        input.session_id,
        'RatingCapture',
        EventTypes.FAILURE_CAPTURED,
        { rating }
      );
    }

    console.error(`📊 Rating captured: ${rating}/10`);

  } catch (error) {
    console.error('RatingCapture hook error:', error);
  }

  safeExit();
}

main();
