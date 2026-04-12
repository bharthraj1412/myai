/**
 * Tests for db module.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const execMock = vi.fn();
const closeMock = vi.fn();

vi.mock('better-sqlite3', () => {
  class MockDatabase {
    constructor(dbPath: string) {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, '');
      }
    }

    exec = execMock;
    close = closeMock;
  }

  return { default: MockDatabase };
});

import { initDb } from './db.js';

describe('initDb', () => {
  beforeEach(() => {
    execMock.mockClear();
    closeMock.mockClear();
  });

  it('creates parent directory and initializes kv_store table', () => {
    const dbPath = path.join(os.tmpdir(), 'ag3nt-db-test', `${Date.now()}.sqlite`);

    const db = initDb(dbPath);

    expect(fs.existsSync(path.dirname(dbPath))).toBe(true);
    expect(fs.existsSync(dbPath)).toBe(true);
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS kv_store');
    db.close();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('accepts relative paths', () => {
    const dbPath = path.join('.', 'tmp', 'local-database.sqlite');

    const db = initDb(dbPath);

    expect(db).toBeDefined();
    db.close();
  });
});

