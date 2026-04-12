/**
 * WorkCompletionLearning.hook.ts — Learning capture on session end
 * 
 * Analyzes the session for significant work and captures learnings
 * to the MEMORY/LEARNING/ system.
 * 
 * Runs on: SessionEnd
 * Writes to: MEMORY/LEARNING/{SYSTEM|ALGORITHM}/
 * 
 * Adapted from PAI's WorkCompletionLearning.hook.ts
 */

import { readStdin, getMemoryDir, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import {
  isLearningCapture,
  getLearningCategory,
  saveLearning,
  extractStructuredSections
} from './lib/learning-utils';
import { getJSONLTimestamp } from './lib/time';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  try {
    const input = await readStdin();
    if (!input) return safeExit();

    // Try to read the last assistant message from transcript or input
    const lastMessage = input.last_assistant_message || '';
    
    if (!lastMessage || lastMessage.length < 50) {
      // Too short to contain meaningful learning
      return safeExit();
    }

    // Extract structured sections
    const sections = extractStructuredSections(lastMessage);
    
    // Check if this contains learning-worthy content
    if (!isLearningCapture(lastMessage, sections.summary, sections.analysis)) {
      return safeExit();
    }

    // Determine category
    const category = getLearningCategory(lastMessage);

    // Build learning document
    const description = sections.summary
      ? sections.summary.substring(0, 60).replace(/[^a-zA-Z0-9\s]/g, '')
      : 'session-completion-learning';

    const content = [
      `# Session Learning`,
      ``,
      `**Session:** ${input.session_id}`,
      `**Category:** ${category}`,
      `**Timestamp:** ${getJSONLTimestamp()}`,
      ``,
      sections.summary ? `## Summary\n\n${sections.summary}\n` : '',
      sections.analysis ? `## Analysis\n\n${sections.analysis}\n` : '',
      sections.actions ? `## Actions Taken\n\n${sections.actions}\n` : '',
      sections.results ? `## Results\n\n${sections.results}\n` : '',
      sections.next ? `## Next Steps\n\n${sections.next}\n` : '',
      `---`,
      ``,
      `*Automatically captured by WorkCompletionLearning hook*`
    ].filter(Boolean).join('\n');

    // Save the learning
    const filepath = saveLearning(category, description, content);
    
    // Emit event
    appendEvent(
      input.session_id,
      'WorkCompletionLearning',
      EventTypes.LEARNING_CAPTURED,
      { category, filepath }
    );

    console.error(`📚 Learning captured: ${category} → ${filepath}`);

  } catch (error) {
    console.error('WorkCompletionLearning hook error:', error);
  }

  safeExit();
}

main();
