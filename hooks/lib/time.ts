/**
 * AG3NT Hook System — Time Utilities
 * 
 * Date/time formatting and timezone-aware timestamp generation.
 * Adapted from PAI's hooks/lib/time.ts
 */

/**
 * Get current timestamp in ISO 8601 format with timezone.
 */
export function getISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get timestamp in YYYYMMDD-HHMMSS format for file naming.
 */
export function getFileTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Get current YYYY-MM for directory organization.
 */
export function getYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Get timestamp suitable for JSONL entries.
 */
export function getJSONLTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format duration in human-readable form.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}
