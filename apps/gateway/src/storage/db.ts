import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize a generic SQLite database instance for AG3NT local storage.
export function initDb(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  // Example initialization for a simple key-value store if needed
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );
  `);
  return db;
}
