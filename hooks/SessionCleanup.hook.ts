/**
 * SessionCleanup.hook.ts — Session end cleanup
 * 
 * Marks active work as COMPLETED, clears ephemeral state,
 * and performs cleanup operations.
 * 
 * Runs on: SessionEnd
 * Modifies: MEMORY/WORK/PRD.md, MEMORY/STATE/
 * 
 * Adapted from PAI's SessionCleanup.hook.ts
 */

import { readStdin, getMemoryDir, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import { getJSONLTimestamp } from './lib/time';
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

async function main() {
  try {
    const input = await readStdin();
    if (!input) return safeExit();

    const memoryDir = getMemoryDir();
    const stateDir = join(memoryDir, 'STATE');
    const workDir = join(memoryDir, 'WORK');

    // 1. Mark current work as COMPLETED
    const currentWorkPath = join(stateDir, 'current-work.json');
    if (existsSync(currentWorkPath)) {
      try {
        const currentWork = JSON.parse(readFileSync(currentWorkPath, 'utf-8'));
        
        if (currentWork.prd_path && existsSync(currentWork.prd_path)) {
          let prdContent = readFileSync(currentWork.prd_path, 'utf-8');
          
          // Update frontmatter status
          prdContent = prdContent.replace(
            /^(phase:\s*).+$/m,
            `$1complete`
          );
          
          // Add completed_at if not present
          if (!prdContent.includes('completed_at:')) {
            prdContent = prdContent.replace(
              /^(---\s*$)/m,
              `completed_at: ${getJSONLTimestamp()}\n$1`
            );
          }
          
          writeFileSync(currentWork.prd_path, prdContent, 'utf-8');
        }

        // Clear current work
        writeFileSync(currentWorkPath, '{}', 'utf-8');
      } catch {
        // Graceful failure on current-work parse errors
      }
    }

    // 2. Clean up session-specific algorithm state
    const algDir = join(stateDir, 'algorithms');
    if (existsSync(algDir)) {
      const sessionFile = join(algDir, `${input.session_id}.json`);
      if (existsSync(sessionFile)) {
        try {
          unlinkSync(sessionFile);
        } catch {
          // Ignore cleanup failures
        }
      }
    }

    // Emit session end event
    appendEvent(
      input.session_id,
      'SessionCleanup',
      EventTypes.SESSION_END,
      { cleaned: true }
    );

    console.error(`🧹 Session cleanup complete: ${input.session_id}`);

  } catch (error) {
    console.error('SessionCleanup hook error:', error);
  }

  safeExit();
}

main();
