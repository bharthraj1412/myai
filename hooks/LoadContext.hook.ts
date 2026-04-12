/**
 * LoadContext.hook.ts — Context injection on session start
 * 
 * Loads dynamic context (TELOS goals, active work, recent learnings)
 * and injects it into the session as system context.
 * 
 * Runs on: SessionStart
 * Reads from: USER/TELOS/, MEMORY/WORK/, MEMORY/LEARNING/
 * 
 * Adapted from PAI's LoadContext.hook.ts
 */

import { readStdin, getMemoryDir, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import { getIdentity, getPrincipal } from './lib/identity';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

function getProjectRoot(): string {
  // Walk up from hooks/ to find project root
  return join(dirname(dirname(__filename)));
}

function loadTelosSummary(): string {
  const telosDir = join(getProjectRoot(), 'USER', 'TELOS');
  if (!existsSync(telosDir)) return '';

  const keyFiles = ['MISSION.md', 'GOALS.md', 'PROJECTS.md'];
  const summaries: string[] = [];

  for (const file of keyFiles) {
    const filepath = join(telosDir, file);
    if (existsSync(filepath)) {
      const content = readFileSync(filepath, 'utf-8');
      // Skip template-only content
      if (!content.includes('_Define your mission here')) {
        const firstParagraph = content
          .split('\n')
          .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('>')
            && !l.startsWith('---') && !l.startsWith('_'))
          .slice(0, 3)
          .join(' ');
        if (firstParagraph.length > 20) {
          summaries.push(`**${file.replace('.md', '')}:** ${firstParagraph.substring(0, 200)}`);
        }
      }
    }
  }

  return summaries.length > 0
    ? `## TELOS Context\n\n${summaries.join('\n\n')}`
    : '';
}

function loadActiveWork(): string {
  const workDir = join(getMemoryDir(), 'WORK');
  if (!existsSync(workDir)) return '';

  try {
    const entries = readdirSync(workDir)
      .filter(f => statSync(join(workDir, f)).isDirectory())
      .sort()
      .reverse()
      .slice(0, 3);

    if (entries.length === 0) return '';

    const workItems = entries.map(entry => {
      const prdPath = join(workDir, entry, 'PRD.md');
      if (existsSync(prdPath)) {
        const content = readFileSync(prdPath, 'utf-8');
        const taskMatch = content.match(/^task:\s*(.+)$/m);
        const phaseMatch = content.match(/^phase:\s*(.+)$/m);
        const task = taskMatch ? taskMatch[1] : entry;
        const phase = phaseMatch ? phaseMatch[1] : 'unknown';
        return `- **${task}** (${phase})`;
      }
      return `- ${entry}`;
    });

    return `## Recent Work\n\n${workItems.join('\n')}`;
  } catch {
    return '';
  }
}

function loadRecentLearnings(): string {
  const signalsPath = join(getMemoryDir(), 'LEARNING', 'SIGNALS', 'ratings.jsonl');
  if (!existsSync(signalsPath)) return '';

  try {
    const lines = readFileSync(signalsPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .slice(-5);

    if (lines.length === 0) return '';

    const ratings = lines.map(l => {
      try {
        const r = JSON.parse(l);
        return r.rating;
      } catch { return null; }
    }).filter(Boolean);

    if (ratings.length === 0) return '';

    const avg = (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1);
    return `## Rating Trend\n\nRecent average: **${avg}/10** (last ${ratings.length} ratings)`;
  } catch {
    return '';
  }
}

async function main() {
  try {
    const input = await readStdin();
    if (!input) return safeExit();

    const identity = getIdentity();
    const principal = getPrincipal();

    // Build context injection
    const contextParts: string[] = [
      `<system-reminder>`,
      `# ${identity.displayName} Session Context`,
      ``,
      `**Principal:** ${principal.name || 'User'}`,
      `**Timezone:** ${principal.timezone}`,
      `**Session:** ${input.session_id}`,
      ``
    ];

    // Load TELOS summary
    const telos = loadTelosSummary();
    if (telos) contextParts.push(telos, '');

    // Load active work
    const work = loadActiveWork();
    if (work) contextParts.push(work, '');

    // Load rating trend
    const ratings = loadRecentLearnings();
    if (ratings) contextParts.push(ratings, '');

    contextParts.push(`</system-reminder>`);

    // Output context to stdout (injected into session)
    console.log(contextParts.join('\n'));

    // Emit event
    appendEvent(
      input.session_id,
      'LoadContext',
      EventTypes.SESSION_START,
      {
        hasTelos: !!telos,
        hasWork: !!work,
        hasRatings: !!ratings
      }
    );

  } catch (error) {
    console.error('LoadContext hook error:', error);
  }

  safeExit();
}

main();
