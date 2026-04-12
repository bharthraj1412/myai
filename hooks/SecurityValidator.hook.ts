/**
 * SecurityValidator.hook.ts — Pre-tool security validation
 * 
 * Validates tool operations against security patterns before execution.
 * Runs on: PreToolUse (Bash, Write, Edit, Read)
 * 
 * Adapted from PAI's SecurityValidator.hook.ts
 */

import { readStdin, loadSettings, safeExit, getMemoryDir } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { getJSONLTimestamp } from './lib/time';

async function main() {
  try {
    const input = await readStdin();
    if (!input) return safeExit();

    const settings = loadSettings();
    const security = settings.security || {};
    const dangerousCommands: string[] = security.dangerousCommands || [];
    const sensitivePatterns: string[] = security.sensitivePatterns || [];
    const protectedDirs: string[] = security.protectedDirectories || [];

    let blocked = false;
    let reason = '';

    // Check Bash commands against dangerous patterns
    if (input.tool_name === 'Bash' && input.tool_input?.command) {
      const cmd = input.tool_input.command;
      for (const dangerous of dangerousCommands) {
        if (cmd.includes(dangerous)) {
          blocked = true;
          reason = `Dangerous command blocked: "${dangerous}"`;
          break;
        }
      }
    }

    // Check file operations against sensitive patterns
    if (['Write', 'Edit', 'Read'].includes(input.tool_name || '')) {
      const filePath = input.tool_input?.file_path || input.tool_input?.path || '';
      
      // Check sensitive file patterns
      for (const pattern of sensitivePatterns) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\./g, '\\.'));
        if (regex.test(filePath)) {
          blocked = true;
          reason = `Sensitive file access blocked: "${filePath}" matches "${pattern}"`;
          break;
        }
      }

      // Check protected directories
      if (!blocked) {
        for (const protDir of protectedDirs) {
          if (filePath.includes(protDir)) {
            blocked = true;
            reason = `Protected directory access blocked: "${protDir}"`;
            break;
          }
        }
      }
    }

    // Log security event
    const securityDir = join(getMemoryDir(), 'SECURITY');
    if (!existsSync(securityDir)) {
      mkdirSync(securityDir, { recursive: true });
    }

    const event = {
      timestamp: getJSONLTimestamp(),
      session_id: input.session_id,
      tool: input.tool_name,
      input: input.tool_input,
      blocked,
      reason: reason || 'allowed'
    };

    appendFileSync(
      join(securityDir, 'security-events.jsonl'),
      JSON.stringify(event) + '\n'
    );

    // Emit event
    appendEvent(
      input.session_id,
      'SecurityValidator',
      blocked ? EventTypes.SECURITY_BLOCK : EventTypes.SECURITY_ALLOW,
      { tool: input.tool_name, blocked, reason }
    );

    // If blocked, output rejection (the agent should see this)
    if (blocked) {
      console.error(`🛡️ SECURITY: ${reason}`);
      // Output JSON to stdout for the agent to see
      console.log(JSON.stringify({ blocked: true, reason }));
    }

  } catch (error) {
    console.error('SecurityValidator hook error:', error);
  }

  safeExit();
}

main();
