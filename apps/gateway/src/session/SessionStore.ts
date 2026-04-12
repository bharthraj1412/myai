/**
 * Persistent session storage backed by SQLite.
 *
 * Stores EnhancedSession data with priority, quotas, directives,
 * activation modes, and agent assignment.
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ActivationMode = 'always' | 'mention' | 'reply' | 'keyword' | 'off';

export interface Directive {
  id: string;
  type: 'system' | 'user' | 'channel';
  content: string;
  priority: number;
  active: boolean;
  createdAt: string;
}

export interface SessionQuotas {
  maxTurnsPerHour: number;
  maxTokensPerTurn: number;
  maxConcurrent: number;
}

export interface EnhancedSession {
  id: string;
  channelType: string;
  channelId: string;
  chatId: string;
  priority: number;
  assignedAgent: string | null;
  directives: Directive[];
  quotas: SessionQuotas;
  activationMode: ActivationMode;
  activationKeywords: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SessionFilter {
  channelType?: string;
  channelId?: string;
  chatId?: string;
  activationMode?: ActivationMode;
  assignedAgent?: string;
  minPriority?: number;
  maxPriority?: number;
}

const DEFAULT_QUOTAS: SessionQuotas = {
  maxTurnsPerHour: 60,
  maxTokensPerTurn: 16000,
  maxConcurrent: 3,
};

// ─────────────────────────────────────────────────────────────────
// SessionStore
// ─────────────────────────────────────────────────────────────────

export class SessionStore {
  private db: Database.Database | null;
  private readonly memory = new Map<string, EnhancedSession>();

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      this.db = new Database(dbPath);
      this.migrate();
    } catch (error) {
      this.db = null;
      console.warn('[SessionStore] SQLite unavailable, using in-memory store:', error);
    }
  }

  private migrate(): void {
    const db = this.db;
    if (!db) {
      return;
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        channel_type TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 5,
        assigned_agent TEXT,
        directives TEXT NOT NULL DEFAULT '[]',
        quotas TEXT NOT NULL DEFAULT '{}',
        activation_mode TEXT NOT NULL DEFAULT 'always',
        activation_keywords TEXT NOT NULL DEFAULT '[]',
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_channel
        ON sessions(channel_type, channel_id, chat_id);
    `);
  }

  save(session: EnhancedSession): void {
    if (!this.db) {
      this.memory.set(session.id, { ...session });
      return;
    }

    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, channel_type, channel_id, chat_id, priority,
        assigned_agent, directives, quotas, activation_mode,
        activation_keywords, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        priority = excluded.priority,
        assigned_agent = excluded.assigned_agent,
        directives = excluded.directives,
        quotas = excluded.quotas,
        activation_mode = excluded.activation_mode,
        activation_keywords = excluded.activation_keywords,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      session.id,
      session.channelType,
      session.channelId,
      session.chatId,
      session.priority,
      session.assignedAgent,
      JSON.stringify(session.directives),
      JSON.stringify(session.quotas),
      session.activationMode,
      JSON.stringify(session.activationKeywords),
      JSON.stringify(session.metadata),
      session.createdAt,
      session.updatedAt,
    );
  }

  load(sessionId: string): EnhancedSession | null {
    if (!this.db) {
      return this.memory.get(sessionId) ?? null;
    }

    const row = this.db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(sessionId) as any;

    if (!row) return null;
    return this.rowToSession(row);
  }

  loadByChannel(channelType: string, channelId: string, chatId: string): EnhancedSession | null {
    if (!this.db) {
      for (const session of this.memory.values()) {
        if (
          session.channelType === channelType &&
          session.channelId === channelId &&
          session.chatId === chatId
        ) {
          return session;
        }
      }
      return null;
    }

    const row = this.db
      .prepare('SELECT * FROM sessions WHERE channel_type = ? AND channel_id = ? AND chat_id = ?')
      .get(channelType, channelId, chatId) as any;

    if (!row) return null;
    return this.rowToSession(row);
  }

  list(filter?: SessionFilter): EnhancedSession[] {
    if (!this.db) {
      let sessions = Array.from(this.memory.values());
      if (filter) {
        sessions = sessions.filter((session) => {
          if (filter.channelType && session.channelType !== filter.channelType) return false;
          if (filter.channelId && session.channelId !== filter.channelId) return false;
          if (filter.chatId && session.chatId !== filter.chatId) return false;
          if (filter.activationMode && session.activationMode !== filter.activationMode) return false;
          if (filter.assignedAgent && session.assignedAgent !== filter.assignedAgent) return false;
          if (filter.minPriority !== undefined && session.priority < filter.minPriority) return false;
          if (filter.maxPriority !== undefined && session.priority > filter.maxPriority) return false;
          return true;
        });
      }
      return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    let sql = 'SELECT * FROM sessions WHERE 1=1';
    const params: (string | number)[] = [];

    if (filter) {
      if (filter.channelType) {
        sql += ' AND channel_type = ?';
        params.push(filter.channelType);
      }
      if (filter.channelId) {
        sql += ' AND channel_id = ?';
        params.push(filter.channelId);
      }
      if (filter.chatId) {
        sql += ' AND chat_id = ?';
        params.push(filter.chatId);
      }
      if (filter.activationMode) {
        sql += ' AND activation_mode = ?';
        params.push(filter.activationMode);
      }
      if (filter.assignedAgent) {
        sql += ' AND assigned_agent = ?';
        params.push(filter.assignedAgent);
      }
      if (filter.minPriority !== undefined) {
        sql += ' AND priority >= ?';
        params.push(filter.minPriority);
      }
      if (filter.maxPriority !== undefined) {
        sql += ' AND priority <= ?';
        params.push(filter.maxPriority);
      }
    }

    sql += ' ORDER BY updated_at DESC';

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((row) => this.rowToSession(row));
  }

  delete(sessionId: string): void {
    if (!this.db) {
      this.memory.delete(sessionId);
      return;
    }
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  updateField(sessionId: string, field: string, value: unknown): void {
    const allowedFields: Record<string, string> = {
      priority: 'priority',
      assignedAgent: 'assigned_agent',
      directives: 'directives',
      quotas: 'quotas',
      activationMode: 'activation_mode',
      activationKeywords: 'activation_keywords',
      metadata: 'metadata',
    };

    const column = allowedFields[field];
    if (!column) {
      throw new Error(`Cannot update field: ${field}`);
    }

    if (!this.db) {
      const session = this.memory.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      const now = new Date().toISOString();
      if (field === 'priority') session.priority = Number(value);
      else if (field === 'assignedAgent') session.assignedAgent = (value as string | null) ?? null;
      else if (field === 'directives') session.directives = (value as Directive[]) ?? [];
      else if (field === 'quotas') session.quotas = { ...DEFAULT_QUOTAS, ...(value as Partial<SessionQuotas> || {}) };
      else if (field === 'activationMode') session.activationMode = value as ActivationMode;
      else if (field === 'activationKeywords') session.activationKeywords = (value as string[]) ?? [];
      else if (field === 'metadata') session.metadata = (value as Record<string, unknown>) ?? {};
      session.updatedAt = now;
      this.memory.set(sessionId, session);
      return;
    }

    const serialized = value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
    const now = new Date().toISOString();

    const result = this.db
      .prepare(`UPDATE sessions SET ${column} = ?, updated_at = ? WHERE id = ?`)
      .run(serialized, now, sessionId);

    if (result.changes === 0) {
      throw new Error(`Session not found: ${sessionId}`);
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  private rowToSession(row: any): EnhancedSession {
    return {
      id: row.id,
      channelType: row.channel_type,
      channelId: row.channel_id,
      chatId: row.chat_id,
      priority: row.priority,
      assignedAgent: row.assigned_agent || null,
      directives: JSON.parse(row.directives || '[]'),
      quotas: { ...DEFAULT_QUOTAS, ...JSON.parse(row.quotas || '{}') },
      activationMode: row.activation_mode as ActivationMode,
      activationKeywords: JSON.parse(row.activation_keywords || '[]'),
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

/**
 * Create default EnhancedSession fields for a new session.
 */
export function createDefaultEnhancedSession(
  id: string,
  channelType: string,
  channelId: string,
  chatId: string,
  defaultQuotas?: Partial<SessionQuotas>,
): EnhancedSession {
  const now = new Date().toISOString();
  return {
    id,
    channelType,
    channelId,
    chatId,
    priority: 5,
    assignedAgent: null,
    directives: [],
    quotas: { ...DEFAULT_QUOTAS, ...defaultQuotas },
    activationMode: 'always',
    activationKeywords: [],
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}
