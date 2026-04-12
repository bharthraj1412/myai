/**
 * PRDSync.hook.ts — PRD frontmatter → work state sync
 * 
 * Fires after Write/Edit to PRD files in MEMORY/WORK/.
 * Syncs PRD frontmatter to current-work.json for the dashboard.
 * 
 * Runs on: PostToolUse (Write, Edit)
 */

import { readStdin, getMemoryDir, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  try {
    const input = await readStdin();
    if (!input) return safeExit();

    // Only process writes to PRD.md files in MEMORY/WORK/
    const filePath = input.tool_input?.file_path || input.tool_input?.path || '';
    
    if (!filePath.includes('MEMORY') || !filePath.includes('WORK') || !filePath.endsWith('PRD.md')) {
      return safeExit();
    }

    if (!existsSync(filePath)) {
      return safeExit();
    }

    // Parse PRD frontmatter
    const content = readFileSync(filePath, 'utf-8');
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
      return safeExit();
    }

    const frontmatter: Record<string, string> = {};
    for (const line of frontmatterMatch[1].split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();
        frontmatter[key] = value;
      }
    }

    // Count criteria
    const checkedCount = (content.match(/- \[x\]/g) || []).length;
    const totalCount = (content.match(/- \[[ x]\]/g) || []).length;

    // Update current-work.json
    const stateDir = join(getMemoryDir(), 'STATE');
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }

    const currentWork = {
      prd_path: filePath,
      task: frontmatter.task || '',
      slug: frontmatter.slug || '',
      effort: frontmatter.effort || 'standard',
      phase: frontmatter.phase || 'unknown',
      progress: `${checkedCount}/${totalCount}`,
      mode: frontmatter.mode || 'interactive',
      started: frontmatter.started || '',
      updated: frontmatter.updated || new Date().toISOString(),
      session_id: input.session_id
    };

    writeFileSync(
      join(stateDir, 'current-work.json'),
      JSON.stringify(currentWork, null, 2),
      'utf-8'
    );

    // Emit event
    appendEvent(
      input.session_id,
      'PRDSync',
      EventTypes.WORK_UPDATED,
      { phase: currentWork.phase, progress: currentWork.progress }
    );

  } catch (error) {
    console.error('PRDSync hook error:', error);
  }

  safeExit();
}

main();
