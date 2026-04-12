/**
 * AgentExecutionGuard.hook.ts — Agent spawning validation
 * 
 * Validates agent spawning (Task tool) against execution policies.
 * Prevents runaway agent creation and enforces limits.
 * 
 * Runs on: PreToolUse (Task matcher)
 */

import { readStdin, loadSettings, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';

const MAX_CONCURRENT_AGENTS = 10;
let activeAgentCount = 0;

async function main() {
  try {
    const input = await readStdin();
    if (!input) return safeExit();

    // Basic guard: prevent spawning too many agents
    if (activeAgentCount >= MAX_CONCURRENT_AGENTS) {
      console.error(`🛡️ Agent limit reached (${MAX_CONCURRENT_AGENTS}). Wait for existing agents to complete.`);
      console.log(JSON.stringify({
        blocked: true,
        reason: `Maximum concurrent agent limit (${MAX_CONCURRENT_AGENTS}) reached`
      }));
      return safeExit();
    }

    activeAgentCount++;

    appendEvent(
      input.session_id,
      'AgentExecutionGuard',
      EventTypes.TOOL_PRE,
      { tool: 'Task', agentCount: activeAgentCount }
    );

  } catch (error) {
    console.error('AgentExecutionGuard hook error:', error);
  }

  safeExit();
}

main();
