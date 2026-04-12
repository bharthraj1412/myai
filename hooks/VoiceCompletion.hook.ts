/**
 * VoiceCompletion.hook.ts — Voice TTS on task completion
 * 
 * Sends a voice notification when the agent completes a response.
 * Only fires for main sessions (not sub-agents).
 * 
 * Runs on: Stop
 * Calls: Voice server at localhost:8888
 * 
 * Adapted from PAI's VoiceCompletion.hook.ts
 */

import { readStdin, loadSettings, safeExit } from './lib/hook-io';
import { appendEvent, EventTypes } from './lib/event-emitter';
import { getIdentity } from './lib/identity';

async function main() {
  try {
    const input = await readStdin();
    if (!input) return safeExit();

    const settings = loadSettings();
    const notifications = settings.notifications || {};
    const voiceConfig = notifications.voice || {};

    // Check if voice is enabled
    if (!voiceConfig.enabled) {
      return safeExit();
    }

    const identity = getIdentity();
    const voicePort = voiceConfig.serverPort || 8888;

    // Extract a brief completion message from the last response
    const lastMessage = input.last_assistant_message || '';
    let completionMessage = 'Task complete.';

    // Try to extract the 🎯 COMPLETED line
    const completedMatch = lastMessage.match(/🎯\s*COMPLETED:\s*(.+?)(?:\n|$)/);
    if (completedMatch) {
      completionMessage = completedMatch[1].trim();
    } else if (lastMessage.length > 0) {
      // Use first sentence or first 100 chars
      const firstSentence = lastMessage.match(/^[^.!?\n]+[.!?]/);
      completionMessage = firstSentence
        ? firstSentence[0].substring(0, 100)
        : lastMessage.substring(0, 100);
    }

    // Send to voice server (fire-and-forget)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      await fetch(`http://localhost:${voicePort}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: identity.name,
          message: completionMessage,
          voice_enabled: true,
          voice_id: identity.voiceId || voiceConfig.voiceId || ''
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
    } catch {
      // Voice server may be offline — fail silently
    }

    // Emit event
    appendEvent(
      input.session_id,
      'VoiceCompletion',
      EventTypes.VOICE_SENT,
      { message: completionMessage.substring(0, 100) }
    );

  } catch (error) {
    console.error('VoiceCompletion hook error:', error);
  }

  safeExit();
}

main();
