/**
 * AG3NT Memory API Routes — Gateway Integration
 * 
 * Provides REST endpoints for the UI dashboard to query
 * the MEMORY system, algorithm state, and TELOS data.
 * 
 * Mounts on: /api/memory/*
 */

import { Router, Request, Response } from 'express';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const router = Router();

// Resolve project root (3 levels up from routes/)
function getProjectRoot(): string {
  return process.env.AG3NT_PROJECT_ROOT || resolve(__dirname, '..', '..', '..', '..');
}

function getMemoryDir(): string {
  return join(getProjectRoot(), 'MEMORY');
}

function getUserDir(): string {
  return join(getProjectRoot(), 'USER');
}

function parseFrontmatter(content: string): Record<string, string> {
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

// GET /api/memory/current-work — Current algorithm work state
router.get('/current-work', (_req: Request, res: Response) => {
  try {
    const cwPath = join(getMemoryDir(), 'STATE', 'current-work.json');
    if (!existsSync(cwPath)) return res.json(null);
    const data = JSON.parse(readFileSync(cwPath, 'utf-8'));
    if (!data.task) return res.json(null);
    res.json(data);
  } catch {
    res.json(null);
  }
});

// GET /api/memory/ratings — Rating signals
router.get('/ratings', (_req: Request, res: Response) => {
  try {
    const ratingsPath = join(getMemoryDir(), 'LEARNING', 'SIGNALS', 'ratings.jsonl');
    if (!existsSync(ratingsPath)) return res.json({ ratings: [], average: null });

    const ratings = readFileSync(ratingsPath, 'utf-8')
      .trim().split('\n').filter(Boolean)
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);

    const recent = ratings.slice(-50);
    const avg = recent.length > 0
      ? Math.round((recent.reduce((s: number, r: any) => s + r.rating, 0) / recent.length) * 10) / 10
      : null;

    res.json({ ratings: recent, average: avg });
  } catch {
    res.json({ ratings: [], average: null });
  }
});

// GET /api/memory/learnings — Recent learnings
router.get('/learnings', (_req: Request, res: Response) => {
  try {
    const learnings: any[] = [];
    const categories = ['SYSTEM', 'ALGORITHM'];

    for (const cat of categories) {
      const catDir = join(getMemoryDir(), 'LEARNING', cat);
      if (!existsSync(catDir)) continue;

      const months = readdirSync(catDir).sort().reverse();
      for (const month of months) {
        const monthDir = join(catDir, month);
        if (!statSync(monthDir).isDirectory()) continue;

        const files = readdirSync(monthDir).filter(f => f.endsWith('.md')).sort().reverse();
        for (const file of files) {
          learnings.push({
            category: cat,
            timestamp: file.substring(0, 15),
            title: file.replace(/^\d{8}-\d{6}_LEARNING_/, '').replace('.md', '').replace(/-/g, ' '),
            filepath: join(monthDir, file),
          });
          if (learnings.length >= 20) break;
        }
        if (learnings.length >= 20) break;
      }
    }

    res.json({ learnings });
  } catch {
    res.json({ learnings: [] });
  }
});

// GET /api/memory/work-history — Recent work items
router.get('/work-history', (_req: Request, res: Response) => {
  try {
    const workDir = join(getMemoryDir(), 'WORK');
    if (!existsSync(workDir)) return res.json({ items: [] });

    const items = readdirSync(workDir)
      .filter(f => statSync(join(workDir, f)).isDirectory())
      .sort().reverse().slice(0, 20)
      .map(entry => {
        const prdPath = join(workDir, entry, 'PRD.md');
        if (!existsSync(prdPath)) return null;
        const content = readFileSync(prdPath, 'utf-8');
        const fm = parseFrontmatter(content);
        const checked = (content.match(/- \[x\]/g) || []).length;
        const total = (content.match(/- \[[ x]\]/g) || []).length;
        return { slug: entry, task: fm.task || entry, phase: fm.phase || 'unknown', effort: fm.effort || 'standard', progress: `${checked}/${total}` };
      })
      .filter(Boolean);

    res.json({ items });
  } catch {
    res.json({ items: [] });
  }
});

// GET /api/memory/events — Recent system events
router.get('/events', (_req: Request, res: Response) => {
  try {
    const eventsPath = join(getMemoryDir(), 'STATE', 'events.jsonl');
    if (!existsSync(eventsPath)) return res.json({ events: [] });

    const events = readFileSync(eventsPath, 'utf-8')
      .trim().split('\n').filter(Boolean)
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean).slice(-100);

    res.json({ events });
  } catch {
    res.json({ events: [] });
  }
});

// GET /api/memory/telos — TELOS files
router.get('/telos', (_req: Request, res: Response) => {
  try {
    const telosDir = join(getUserDir(), 'TELOS');
    if (!existsSync(telosDir)) return res.json({ files: [] });

    const TELOS_META: Record<string, string> = {
      MISSION: '🎯', GOALS: '🏆', PROJECTS: '📁', BELIEFS: '💎',
      STRATEGIES: '♟️', MODELS: '🧩', LEARNED: '📖', CHALLENGES: '⚔️',
      IDEAS: '💡', NARRATIVES: '📜',
    };

    const files = readdirSync(telosDir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const name = f.replace('.md', '');
        const content = readFileSync(join(telosDir, f), 'utf-8');
        const isTemplate = content.includes('_Define your') || content.includes('_e.g.,') || content.includes('_Goal 1:');
        return {
          name,
          icon: TELOS_META[name] || '📄',
          content: content.substring(0, 2000),
          populated: !isTemplate && content.trim().length > 100,
        };
      });

    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
});

// GET /api/memory/agents — Agent personalities
router.get('/agents', (_req: Request, res: Response) => {
  try {
    const agentsDir = join(getProjectRoot(), 'agents');
    if (!existsSync(agentsDir)) return res.json({ agents: [] });

    const agents = readdirSync(agentsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const content = readFileSync(join(agentsDir, f), 'utf-8');
        const name = f.replace('.md', '');
        const specMatch = content.match(/\*\*Specialization:\*\*\s*(.+)/);
        return {
          name,
          specialization: specMatch ? specMatch[1].trim() : '',
          filename: f,
        };
      });

    res.json({ agents });
  } catch {
    res.json({ agents: [] });
  }
});

// GET /api/memory/stats — System-wide statistics
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const memDir = getMemoryDir();
    const projectRoot = getProjectRoot();

    // Count skills
    const skillsDir = join(projectRoot, 'skills');
    const skillCount = existsSync(skillsDir) ? readdirSync(skillsDir).filter(f => statSync(join(skillsDir, f)).isDirectory()).length : 0;

    // Count hooks
    const hooksDir = join(projectRoot, 'hooks');
    const hookCount = existsSync(hooksDir) ? readdirSync(hooksDir).filter(f => f.endsWith('.hook.ts')).length : 0;

    // Count agents
    const agentsDir = join(projectRoot, 'agents');
    const agentCount = existsSync(agentsDir) ? readdirSync(agentsDir).filter(f => f.endsWith('.md')).length : 0;

    // Count learnings
    let learningCount = 0;
    for (const cat of ['SYSTEM', 'ALGORITHM']) {
      const catDir = join(memDir, 'LEARNING', cat);
      if (existsSync(catDir)) {
        for (const month of readdirSync(catDir)) {
          const monthDir = join(catDir, month);
          if (existsSync(monthDir) && statSync(monthDir).isDirectory()) {
            learningCount += readdirSync(monthDir).filter(f => f.endsWith('.md')).length;
          }
        }
      }
    }

    // Rating count
    const ratingsPath = join(memDir, 'LEARNING', 'SIGNALS', 'ratings.jsonl');
    const ratingCount = existsSync(ratingsPath) ? readFileSync(ratingsPath, 'utf-8').trim().split('\n').filter(Boolean).length : 0;

    res.json({
      skills: skillCount,
      hooks: hookCount,
      agents: agentCount,
      learnings: learningCount,
      ratings: ratingCount,
    });
  } catch {
    res.json({ skills: 0, hooks: 0, agents: 0, learnings: 0, ratings: 0 });
  }
});

export default router;
