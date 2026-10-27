import { storageKeyFor } from './persistedSettings';
import { recordSetReps } from './repProgress';
import { recordWeightedSetReps } from './weightProgress';
import type { WeightUnit } from './weightUnits';
import type { SetRepResult } from '../types/repProgress';

/**
 * Saving a set no longer blocks the receipt. The receipt appears at once with
 * a provisional result (reps and the last known personal best on this
 * device); the real save runs in the background with retries, and if the
 * connection is too weak it is kept on this device and saved next launch.
 */

export type SetSaveJob = (
  | { kind: 'reps'; categoryId: string; reps: number }
  | {
      kind: 'weighted';
      categoryId: string;
      weightKg: number;
      reps: number;
      setNumber: number;
      totalSets: number;
      unit: WeightUnit;
    }
) & {
  /** The set's log is saved (so a retry only finishes the personal bests). */
  logged?: boolean;
  /** Made on the phone when the set is finished: the server logs each id once. */
  clientId?: string;
};

function newSetId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Older browsers: a random v4-shaped id.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

type BestCache = Record<string, { reps: number | null; at: string | null; weightKg?: number | null; weightReps?: number | null }>;

function readJSON<T>(userId: string, key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, key));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(userId: string, key: string, value: unknown) {
  try {
    window.localStorage.setItem(storageKeyFor(userId, key), JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
}

/** Remember confirmed bests so the next receipt can show them instantly. */
export function rememberBest(userId: string, categoryId: string, result: SetRepResult) {
  const cache = readJSON<BestCache>(userId, 'best-cache', {});
  cache[categoryId] = {
    reps: result.personalBest.reps,
    at: result.personalBest.achievedAt,
    weightKg: result.weightPersonalBest?.weightKg ?? cache[categoryId]?.weightKg ?? null,
    weightReps: result.weightPersonalBest?.reps ?? cache[categoryId]?.weightReps ?? null
  };
  writeJSON(userId, 'best-cache', cache);
}

/** A result to show immediately, from what this device already knows. */
export function provisionalResult(userId: string, job: SetSaveJob): SetRepResult {
  const known = readJSON<BestCache>(userId, 'best-cache', {})[job.categoryId];
  const best = known?.reps ?? null;
  const isNew = best !== null && job.reps > best;
  const now = new Date().toISOString();
  const weightKg = job.kind === 'weighted' ? job.weightKg : null;
  const knownWeight = known?.weightKg ?? null;
  const isNewWeight =
    job.kind === 'weighted' && knownWeight !== null && (job.weightKg > knownWeight || (job.weightKg === knownWeight && job.reps > (known?.weightReps ?? 0)));
  return {
    reps: job.reps,
    weightKg,
    personalBest: isNew ? { reps: job.reps, achievedAt: now } : { reps: best, achievedAt: known?.at ?? null },
    weightPersonalBest:
      job.kind === 'weighted'
        ? isNewWeight
          ? { weightKg: job.weightKg, reps: job.reps, achievedAt: now }
          : { weightKg: knownWeight, reps: known?.weightReps ?? null, achievedAt: null }
        : null,
    isNewPersonalBest: isNew,
    isNewWeightPersonalBest: isNewWeight,
    progression: null
  };
}

function runJob(userId: string, job: SetSaveJob): Promise<SetRepResult> {
  return job.kind === 'weighted'
    ? recordWeightedSetReps(userId, job.categoryId, job.weightKg, job.reps, job.setNumber, job.totalSets, job.unit, job)
    : recordSetReps(userId, job.categoryId, job.reps, undefined, undefined, job);
}
/** The server refuses set logs closer than 3 seconds apart. */
const tooFast = (err: unknown) => /too fast/i.test(String((err as { message?: string })?.message ?? err));

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Save with a few quick retries; if it still fails, keep it for next launch. */
export async function saveSetInBackground(userId: string, job: SetSaveJob): Promise<SetRepResult | null> {
  job.clientId ??= newSetId();
  for (const delay of [0, 1500, 4000]) {
    if (delay) await wait(delay);
    try {
      const result = await runJob(userId, job);
      rememberBest(userId, job.categoryId, result);
      return result;
    } catch (err) {
      // Try again (after the server's 3-second spacing if that was the reason).
      if (tooFast(err)) await wait(3200);
    }
  }
  writeJSON(userId, 'pending-sets', [...readJSON<SetSaveJob[]>(userId, 'pending-sets', []), job]);
  return null;
}

/** On launch: save any sets that couldn't be saved earlier (weak signal). */
export async function savePendingSets(userId: string): Promise<void> {
  const pending = readJSON<SetSaveJob[]>(userId, 'pending-sets', []);
  if (!pending.length) return;
  const remaining: SetSaveJob[] = [];
  for (const [i, job] of pending.entries()) {
    // The server takes one set log every 3 seconds.
    if (i > 0) await wait(3200);
    job.clientId ??= newSetId();
    try {
      const result = await runJob(userId, job);
      rememberBest(userId, job.categoryId, result);
    } catch {
      remaining.push(job);
    }
  }
  writeJSON(userId, 'pending-sets', remaining);
}
