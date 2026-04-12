/**
 * Message storage with SQLite persistence.
 *
 * Provides persistent storage for session message history,
 * enabling session resume and message retrieval.
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
}

export interface GetMessagesOptions {
  limit?: number;
  before?: Date;
  after?: Date;
}

export class MessageStore {
  private db: Database.Database | null;
  private readonly dbPath: string;
  private readonly memory = new Map<string, Message[]>();

  constructor(dbPath?: string) {
    const defaultPath = path.join(os.homedir(), '.ag3nt', 'messages.db');
    this.dbPath = dbPath || defaultPath;

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      this.db = new Database(this.dbPath);
      this.initialize();
    } catch (error) {
      this.db = null;
      console.warn('[MessageStore] SQLite unavailable, using in-memory store:', error);
    }
  }

  private initialize(): void {
    const db = this.db;
    if (!db) {
      return;
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        tool_calls TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session
        ON messages(session_id, timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_messages_timestamp
        ON messages(timestamp DESC);
    `);
  }

  /**
   * Add a message to a session.
   */
  addMessage(
    sessionId: string,
    message: Omit<Message, 'id' | 'sessionId' | 'timestamp'>,
  ): Message {
    const id = randomUUID();
    const timestamp = new Date();

    if (!this.db) {
      const next: Message = {
        id,
        sessionId,
        role: message.role,
        content: message.content,
        timestamp,
        toolCalls: message.toolCalls,
      };
      const existing = this.memory.get(sessionId) || [];
      this.memory.set(sessionId, [...existing, next]);
      return next;
    }

    const stmt = this.db.prepare(`
      INSERT INTO messages (id, session_id, role, content, timestamp, tool_calls)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sessionId,
      message.role,
      message.content,
      timestamp.toISOString(),
      message.toolCalls ? JSON.stringify(message.toolCalls) : null,
    );

    return {
      id,
      sessionId,
      role: message.role,
      content: message.content,
      timestamp,
      toolCalls: message.toolCalls,
    };
  }

  /**
   * Get messages for a session with optional pagination.
   */
  getMessages(sessionId: string, options: GetMessagesOptions = {}): Message[] {
    const { limit = 50, before, after } = options;

    if (!this.db) {
      let rows = [...(this.memory.get(sessionId) || [])];
      if (before) rows = rows.filter((m) => m.timestamp < before);
      if (after) rows = rows.filter((m) => m.timestamp > after);
      rows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      return rows.slice(-limit);
    }

    let sql = 'SELECT * FROM messages WHERE session_id = ?';
    const params: (string | number)[] = [sessionId];

    if (before) {
      sql += ' AND timestamp < ?';
      params.push(before.toISOString());
    }
    if (after) {
      sql += ' AND timestamp > ?';
      params.push(after.toISOString());
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows
      .map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        role: row.role as 'user' | 'assistant' | 'system',
        content: row.content,
        timestamp: new Date(row.timestamp),
        toolCalls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
      }))
      .reverse(); // Reverse to get chronological order
  }

  /**
   * Get count of messages for a session.
   */
  getMessageCount(sessionId: string): number {
    if (!this.db) {
      return (this.memory.get(sessionId) || []).length;
    }

    const result = this.db
      .prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?')
      .get(sessionId) as { count: number };
    return result.count;
  }

  /**
   * Delete all messages for a session.
   */
  deleteSessionMessages(sessionId: string): number {
    if (!this.db) {
      const existing = this.memory.get(sessionId) || [];
      this.memory.delete(sessionId);
      return existing.length;
    }

    const result = this.db
      .prepare('DELETE FROM messages WHERE session_id = ?')
      .run(sessionId);
    return result.changes;
  }

  /**
   * Get the database file path.
   */
  getDbPath(): string {
    return this.dbPath;
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

