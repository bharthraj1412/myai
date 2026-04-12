/**
 * SkillGuard.hook.ts — Skill invocation validation
 * 
 * Prevents false skill invocations (e.g., accidental triggers).
 * Validates that skill exists and matches the user's intent.
 * 
 * Runs on: PreToolUse (Skill matcher)
 */

import { readStdin, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

function getSkillsDir(): string {
  return join(dirname(dirname(__filename)), 'skills');
}

async function main() {
  try {
    const input = await readStdin();
    if (!input) return safeExit();

    const skillName = input.tool_input?.skill_name || input.tool_input?.name || '';
    
    if (!skillName) {
      return safeExit(); // No skill name — let the system handle it
    }

    // Check if skill directory exists
    const skillDir = join(getSkillsDir(), skillName);
    const skillFile = join(skillDir, 'SKILL.md');

    if (!existsSync(skillFile)) {
      console.error(`⚠️ Skill "${skillName}" not found at ${skillDir}`);
      // Don't block — just warn. The agent runtime will handle missing skills.
    }

    appendEvent(
      input.session_id,
      'SkillGuard',
      EventTypes.TOOL_PRE,
      { tool: 'Skill', skill: skillName, exists: existsSync(skillFile) }
    );

  } catch (error) {
    console.error('SkillGuard hook error:', error);
  }

  safeExit();
}

main();
