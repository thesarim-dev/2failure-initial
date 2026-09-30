import { storageKeyFor } from './persistedSettings';

/**
 * Days recently counted as planned rest for the streak. Kept per user on the
 * device, like the program's own rest days, and trimmed to the last 30 days.
 */
const KEY = 'streak-rest-days';
const KEEP_DAYS = 30;

export function readRestLog(userId: string | undefined): string[] {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, KEY));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((d): d is string => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

export function appendRestLog(userId: string | undefined, days: string[], today: string): string[] {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const next = [...new Set([...readRestLog(userId), ...days])].filter((d) => d >= cutoffKey).sort();
  try {
    window.localStorage.setItem(storageKeyFor(userId, KEY), JSON.stringify(next));
  } catch {
    // Storage full or blocked: the streak still updates, just without the log.
  }
  return next;
}
