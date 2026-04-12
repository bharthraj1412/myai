/**
 * AG3NT Hook Manager — Gateway Integration
 * 
 * Central orchestrator that reads hook configuration from settings.json
 * and executes hooks at the appropriate lifecycle events.
 * 
 * Hooks run as child processes, receive JSON on stdin, and must
 * exit within the configured timeout (default 5000ms).
 */

import { spawn, ChildProcess } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { EventEmitter } from 'events';

export interface HookConfig {
  type: 'command';
  command: string;
}

export interface HookMatcher {
  matcher?: string;
  hooks: HookConfig[];
}

export interface HookEvent {
  session_id: string;
  hook_event_name: string;
  transcript_path?: string;
  prompt?: string;
  tool_name?: string;
  tool_input?: any;
  tool_output?: any;
  last_assistant_message?: string;
  cwd?: string;
}

export type HookEventName = 
  | 'SessionStart'
  | 'SessionEnd'
  | 'UserPromptSubmit'
  | 'Stop'
  | 'PreToolUse'
  | 'PostToolUse';

export class HookManager extends EventEmitter {
  private hookConfig: Record<string, HookMatcher[]> = {};
  private settingsPath: string;
  private ag3ntDir: string;
  private hookTimeout: number;
  
  constructor(settingsPath?: string, timeout: number = 5000) {
    super();
    
    this.ag3ntDir = process.env.AG3NT_DIR || 
      join(process.env.HOME || process.env.USERPROFILE || '', '.ag3nt');
    
    this.settingsPath = settingsPath || 
      join(this.ag3ntDir, 'config', 'settings.json');
    
    this.hookTimeout = timeout;
    this.loadHookConfig();
  }
  
  /**
   * Load hook configuration from settings.json.
   */
  loadHookConfig(): void {
    try {
      if (existsSync(this.settingsPath)) {
        const settings = JSON.parse(readFileSync(this.settingsPath, 'utf-8'));
        this.hookConfig = settings.hooks || {};
        this.emit('config-loaded', Object.keys(this.hookConfig));
      }
    } catch (error) {
      console.error('[HookManager] Failed to load settings:', error);
      this.hookConfig = {};
    }
  }
  
  /**
   * Fire hooks for a given event.
   * Hooks run asynchronously and failures are caught gracefully.
   */
  async fireEvent(
    eventName: HookEventName, 
    eventData: HookEvent,
    toolMatcher?: string
  ): Promise<void> {
    const matchers = this.hookConfig[eventName];
    if (!matchers || matchers.length === 0) return;
    
    const hookPromises: Promise<void>[] = [];
    
    for (const matcherGroup of matchers) {
      // Check if this matcher group applies
      if (matcherGroup.matcher && toolMatcher && matcherGroup.matcher !== toolMatcher) {
        continue;
      }
      
      // If no matcher specified on the group, or matcher matches
      if (!matcherGroup.matcher || matcherGroup.matcher === toolMatcher || !toolMatcher) {
        for (const hook of matcherGroup.hooks) {
          hookPromises.push(
            this.executeHook(hook, eventData, eventName)
          );
        }
      }
    }
    
    // Execute all matching hooks in parallel
    await Promise.allSettled(hookPromises);
  }
  
  /**
   * Execute a single hook as a child process.
   */
  private async executeHook(
    hook: HookConfig, 
    eventData: HookEvent,
    eventName: string
  ): Promise<void> {
    return new Promise<void>((resolvePromise) => {
      try {
        // Resolve command path (replace ${AG3NT_DIR} with actual path)
        const command = this.resolveCommand(hook.command);
        const parts = command.split(/\s+/);
        const executable = parts[0];
        const args = parts.slice(1);
        
        // Determine how to run the script
        let proc: ChildProcess;
        
        if (executable.endsWith('.ts')) {
          // TypeScript files — run with ts-node or node --loader
          proc = spawn('npx', ['ts-node', executable, ...args], {
            cwd: this.ag3ntDir,
            env: { ...process.env, AG3NT_DIR: this.ag3ntDir },
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        } else if (executable.endsWith('.py')) {
          proc = spawn('python', [executable, ...args], {
            cwd: this.ag3ntDir,
            env: { ...process.env, AG3NT_DIR: this.ag3ntDir },
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        } else {
          proc = spawn(executable, args, {
            cwd: this.ag3ntDir,
            env: { ...process.env, AG3NT_DIR: this.ag3ntDir },
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
          });
        }
        
        // Send event data on stdin
        const inputJson = JSON.stringify(eventData);
        proc.stdin?.write(inputJson);
        proc.stdin?.end();
        
        // Capture output
        let stdout = '';
        let stderr = '';
        
        proc.stdout?.on('data', (data) => { stdout += data.toString(); });
        proc.stderr?.on('data', (data) => { stderr += data.toString(); });
        
        // Timeout protection
        const timeout = setTimeout(() => {
          proc.kill('SIGTERM');
          this.emit('hook-timeout', { eventName, command: hook.command });
          resolvePromise();
        }, this.hookTimeout);
        
        proc.on('close', (code) => {
          clearTimeout(timeout);
          
          if (code !== 0 && code !== null) {
            this.emit('hook-error', { 
              eventName, 
              command: hook.command, 
              code, 
              stderr 
            });
          }
          
          if (stdout.trim()) {
            this.emit('hook-output', { 
              eventName, 
              command: hook.command, 
              output: stdout.trim() 
            });
          }
          
          resolvePromise();
        });
        
        proc.on('error', (error) => {
          clearTimeout(timeout);
          this.emit('hook-error', { 
            eventName, 
            command: hook.command, 
            error: error.message 
          });
          resolvePromise();
        });
        
      } catch (error) {
        this.emit('hook-error', { 
          eventName, 
          command: hook.command, 
          error: String(error) 
        });
        resolvePromise();
      }
    });
  }
  
  /**
   * Resolve command path, replacing environment variables.
   */
  private resolveCommand(command: string): string {
    return command
      .replace(/\$\{AG3NT_DIR\}/g, this.ag3ntDir)
      .replace(/\$\{HOME\}/g, process.env.HOME || process.env.USERPROFILE || '')
      .replace(/\$\{PAI_DIR\}/g, this.ag3ntDir);
  }
  
  /**
   * Get all configured hook event names.
   */
  getConfiguredEvents(): string[] {
    return Object.keys(this.hookConfig);
  }
  
  /**
   * Get hook count for an event.
   */
  getHookCount(eventName: string): number {
    const matchers = this.hookConfig[eventName] || [];
    return matchers.reduce((count, m) => count + m.hooks.length, 0);
  }
  
  /**
   * Get total hook count across all events.
   */
  getTotalHookCount(): number {
    return Object.keys(this.hookConfig).reduce(
      (total, event) => total + this.getHookCount(event), 
      0
    );
  }
}

export default HookManager;
