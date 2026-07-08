// ==========================================================================
// JARVIS v4.0 — Formatting utilities
// ==========================================================================

/**
 * Format bytes into a human-readable string.
 * e.g. 1_500_000 → "1.5 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  return `${(bytes / Math.pow(1024, idx)).toFixed(1)} ${units[idx] ?? 'B'}`;
}

/**
 * Format uptime seconds into a human-readable string.
 * e.g. 190_000 → "2d 4h 46m"
 */
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || parts.length === 0) parts.push(`${m}m`);
  return parts.join(' ');
}

/**
 * Format an ISO date string into a readable date.
 * e.g. "2026-05-15T..." → "Friday, May 15, 2026"
 */
export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Format an ISO date string into a readable time.
 * e.g. "2026-05-15T10:00:00" → "10:00 AM"
 */
export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

/**
 * Truncate text to a maximum length, appending ellipsis if truncated.
 */
export function truncate(text: string, max: number = 200): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

/**
 * Format a number as a percentage string.
 * e.g. 0.853 → "85%"
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
