/**
 * AG3NT Memory Manager — Gateway Integration
 * 
 * Provides CRUD operations on the MEMORY/ directory system.
 * Used by gateway API routes to expose memory data to the UI.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface WorkItem {
  slug: string;
  task: string;
  phase: string;
  effort: string;
  progress: string;
  started: string;
  updated: string;
  prdPath: string;
}

export interface RatingEntry {
  timestamp: string;
  session_id: string;
  rating: number;
  prompt: string;
  type: string;
}

export interface LearningEntry {
  filepath: string;
  category: string;
  timestamp: string;
  title: string;
}

export class MemoryManager {
  private memoryDir: string;

  constructor(memoryDir?: string) {
    this.memoryDir = memoryDir || 
      join(process.env.AG3NT_DIR || join(process.env.HOME || process.env.USERPROFILE || '', '.ag3nt'), 'MEMORY');
  }

  // --- Current Work ---

  getCurrentWork(): WorkItem | null {
    const cwPath = join(this.memoryDir, 'STATE', 'current-work.json');
    if (!existsSync(cwPath)) return null;
    try {
      const data = JSON.parse(readFileSync(cwPath, 'utf-8'));
      if (!data.task) return null;
      return {
        slug: data.slug || '',
        task: data.task || '',
        phase: data.phase || 'unknown',
        effort: data.effort || 'standard',
        progress: data.progress || '0/0',
        started: data.started || '',
        updated: data.updated || '',
        prdPath: data.prd_path || '',
      };
    } catch {
      return null;
    }
  }

  // --- Work History ---

  getRecentWork(limit: number = 10): WorkItem[] {
    const workDir = join(this.memoryDir, 'WORK');
    if (!existsSync(workDir)) return [];

    try {
      return readdirSync(workDir)
        .filter(f => statSync(join(workDir, f)).isDirectory())
        .sort().reverse()
        .slice(0, limit)
        .map(entry => {
          const prdPath = join(workDir, entry, 'PRD.md');
          if (!existsSync(prdPath)) return null;
          
          const content = readFileSync(prdPath, 'utf-8');
          const fm = this.parseFrontmatter(content);
          
          return {
            slug: entry,
            task: fm.task || entry,
            phase: fm.phase || 'unknown',
            effort: fm.effort || 'standard',
            progress: fm.progress || '0/0',
            started: fm.started || '',
            updated: fm.updated || '',
            prdPath,
          };
        })
        .filter(Boolean) as WorkItem[];
    } catch {
      return [];
    }
  }

  // --- Ratings ---

  getRecentRatings(limit: number = 50): RatingEntry[] {
    const ratingsPath = join(this.memoryDir, 'LEARNING', 'SIGNALS', 'ratings.jsonl');
    if (!existsSync(ratingsPath)) return [];

    try {
      return readFileSync(ratingsPath, 'utf-8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try { return JSON.parse(line); } catch { return null; }
        })
        .filter(Boolean)
        .slice(-limit) as RatingEntry[];
    } catch {
      return [];
    }
  }

  getRatingAverage(count: number = 20): number | null {
    const ratings = this.getRecentRatings(count);
    if (ratings.length === 0) return null;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  // --- Learnings ---

  getRecentLearnings(limit: number = 10): LearningEntry[] {
    const learnings: LearningEntry[] = [];
    const categories = ['SYSTEM', 'ALGORITHM'];

    for (const category of categories) {
      const catDir = join(this.memoryDir, 'LEARNING', category);
      if (!existsSync(catDir)) continue;

      try {
        const months = readdirSync(catDir).sort().reverse();
        for (const month of months) {
          const monthDir = join(catDir, month);
          if (!statSync(monthDir).isDirectory()) continue;

          const files = readdirSync(monthDir)
            .filter(f => f.endsWith('.md'))
            .sort().reverse();

          for (const file of files) {
            const filepath = join(monthDir, file);
            learnings.push({
              filepath,
              category,
              timestamp: file.substring(0, 15), // YYYYMMDD-HHMMSS
              title: file.replace(/^\d{8}-\d{6}_LEARNING_/, '').replace('.md', '').replace(/-/g, ' '),
            });

            if (learnings.length >= limit) break;
          }
          if (learnings.length >= limit) break;
        }
      } catch {
        continue;
      }
    }

    return learnings.slice(0, limit);
  }

  // --- Events ---

  getRecentEvents(limit: number = 50): any[] {
    const eventsPath = join(this.memoryDir, 'STATE', 'events.jsonl');
    if (!existsSync(eventsPath)) return [];

    try {
      return readFileSync(eventsPath, 'utf-8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try { return JSON.parse(line); } catch { return null; }
        })
        .filter(Boolean)
        .slice(-limit);
    } catch {
      return [];
    }
  }

  // --- Session Names ---

  getSessionNames(): Record<string, string> {
    const namesPath = join(this.memoryDir, 'STATE', 'session-names.json');
    if (!existsSync(namesPath)) return {};
    try {
      return JSON.parse(readFileSync(namesPath, 'utf-8'));
    } catch {
      return {};
    }
  }

  // --- Utils ---

  private parseFrontmatter(content: string): Record<string, string> {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return {};
    
    const fm: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        fm[line.substring(0, colonIdx).trim()] = line.substring(colonIdx + 1).trim();
      }
    }
    return fm;
  }
}

export default MemoryManager;
