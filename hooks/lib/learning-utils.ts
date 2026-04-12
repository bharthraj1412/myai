/**
 * AG3NT Hook System — Learning Utilities
 * 
 * Shared functions for categorizing and storing learnings.
 * Adapted from PAI's hooks/lib/learning-utils.ts
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getMemoryDir } from './hook-io';
import { getFileTimestamp, getYearMonth } from './time';

export type LearningCategory = 'SYSTEM' | 'ALGORITHM';

/**
 * Determine if text content contains a learning worth capturing.
 */
export function isLearningCapture(
  text: string,
  summary?: string,
  analysis?: string
): boolean {
  const indicators = [
    'learned', 'mistake', 'should have', 'next time',
    'improvement', 'realization', 'discovered', 'insight',
    'root cause', 'lesson', 'takeaway', 'retrospective',
    'what went wrong', 'what went right', 'better approach'
  ];
  
  const combined = `${text} ${summary || ''} ${analysis || ''}`.toLowerCase();
  return indicators.some(indicator => combined.includes(indicator));
}

/**
 * Categorize a learning as SYSTEM (infrastructure) or ALGORITHM (task execution).
 */
export function getLearningCategory(text: string): LearningCategory {
  const systemIndicators = [
    'hook', 'config', 'deploy', 'infrastructure', 'build',
    'install', 'dependency', 'permission', 'settings', 'crash',
    'gateway', 'worker', 'server', 'port', 'timeout'
  ];
  
  const lower = text.toLowerCase();
  return systemIndicators.some(ind => lower.includes(ind)) ? 'SYSTEM' : 'ALGORITHM';
}

/**
 * Save a learning to the appropriate MEMORY/LEARNING/ subdirectory.
 */
export function saveLearning(
  category: LearningCategory,
  description: string,
  content: string
): string {
  const memoryDir = getMemoryDir();
  const yearMonth = getYearMonth();
  const targetDir = join(memoryDir, 'LEARNING', category, yearMonth);
  
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const timestamp = getFileTimestamp();
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 50)
    .replace(/-$/, '');
  
  const filename = `${timestamp}_LEARNING_${slug}.md`;
  const filepath = join(targetDir, filename);
  
  writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

/**
 * Extract structured sections from agent response text.
 * Looks for emoji-prefixed section headers.
 */
export function extractStructuredSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const patterns: Record<string, RegExp> = {
    summary: /📋\s*SUMMARY:\s*([\s\S]*?)(?=(?:🔍|⚡|✅|📊|➡️|🎯)|$)/i,
    analysis: /🔍\s*ANALYSIS:\s*([\s\S]*?)(?=(?:📋|⚡|✅|📊|➡️|🎯)|$)/i,
    actions: /⚡\s*ACTIONS:\s*([\s\S]*?)(?=(?:📋|🔍|✅|📊|➡️|🎯)|$)/i,
    results: /✅\s*RESULTS:\s*([\s\S]*?)(?=(?:📋|🔍|⚡|📊|➡️|🎯)|$)/i,
    status: /📊\s*STATUS:\s*([\s\S]*?)(?=(?:📋|🔍|⚡|✅|➡️|🎯)|$)/i,
    next: /➡️\s*NEXT:\s*([\s\S]*?)(?=(?:📋|🔍|⚡|✅|📊|🎯)|$)/i,
    completed: /🎯\s*COMPLETED:\s*([\s\S]*?)(?=(?:📋|🔍|⚡|✅|📊|➡️)|$)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      sections[key] = match[1].trim();
    }
  }

  return sections;
}
