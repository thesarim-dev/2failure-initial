import { storageKeyFor } from './persistedSettings';
import { toLocalDateString, completeWorkoutOnDay, type StreakRestOptions } from './userStats';
import { incrementSetProgress } from './workoutProgress';
import { recordSetReps } from './repProgress';
import { recordWeightedSetReps } from './weightProgress';
import { supabase } from './supabase';
import type { WeightUnit } from './weightUnits';

/**
 * The outbox keeps anything that failed to save (usually: no signal in the
 * park) on this phone and syncs it later, so a logged set, its coins and the
 * day's streak are never lost. Items are applied in order; coin changes are
 * merged into one delta on top of the server's current balance.
 */

export type OutboxItem =
  | { id: string; kind: 'reps'; categoryId: string; reps: number; createdAt: string }
  | {
      id: string;
      kind: 'weighted';
      categoryId: string;
      weightKg: number;
      reps: number;
      setNumber: number;
      totalSets: number;
      unit: WeightUnit;
      createdAt: string;
    }
  | { id: string; kind: 'progress'; categoryId: string; day: string; createdAt: string }
  | { id: string; kind: 'streak'; day: string; options: StreakRestOptions; createdAt: string }
  | { id: string; kind: 'coins'; delta: number; createdAt: string };

type NewItem =
  | Omit<Extract<OutboxItem, { kind: 'reps' }>, 'id' | 'createdAt'>
  | Omit<Extract<OutboxItem, { kind: 'weighted' }>, 'id' | 'createdAt'>
  | Omit<Extract<OutboxItem, { kind: 'progress' }>, 'id' | 'createdAt'>
  | Omit<Extract<OutboxItem, { kind: 'streak' }>, 'id' | 'createdAt'>
  | Omit<Extract<OutboxItem, { kind: 'coins' }>, 'id' | 'createdAt'>;

const KEY = 'outbox';
const listeners = new Set<() => void>();

export function readOutbox(userId: string | undefined): OutboxItem[] {
  if (!userId) return [];
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, KEY));
    return raw ? (JSON.parse(raw) as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(userId: string, items: OutboxItem[]) {
  try {
    window.localStorage.setItem(storageKeyFor(userId, KEY), JSON.stringify(items));
  } catch {
    // Storage full: nothing more we can do on this device.
  }
  listeners.forEach((fn) => fn());
}

export function enqueue(userId: string | undefined, item: NewItem) {
  if (!userId) return;
  const full = { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString() } as OutboxItem;
  writeOutbox(userId, [...readOutbox(userId), full]);
}

export function subscribeOutbox(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Coins earned or spent on this phone that haven't reached the server yet. */
export function pendingCoinDelta(userId: string | undefined): number {
  return readOutbox(userId).reduce((sum, item) => (item.kind === 'coins' ? sum + item.delta : sum), 0);
}

/** Sets waiting to sync (for the "saved on this phone" notice). */
export function pendingSetCount(userId: string | undefined): number {
  // Each set queues a progress item and (usually) a reps item: count sets, not parts.
  const items = readOutbox(userId);
  const progress = items.filter((item) => item.kind === 'progress').length;
  const logs = items.filter((item) => item.kind === 'reps' || item.kind === 'weighted').length;
  return Math.max(progress, logs);
}

let flushing = false;

/**
 * Try to send everything. Stops at the first failure (still offline) and
 * keeps the rest for next time. Returns true when the outbox is empty.
 */
export async function flushOutbox(userId: string | undefined): Promise<boolean> {
  if (!userId || flushing) return readOutbox(userId).length === 0;
  flushing = true;
  try {
    const today = toLocalDateString();
    for (const item of readOutbox(userId)) {
      if (item.kind === 'coins') continue;
      if (item.kind === 'reps') {
        await recordSetReps(userId, item.categoryId, item.reps);
      } else if (item.kind === 'weighted') {
        await recordWeightedSetReps(userId, item.categoryId, item.weightKg, item.reps, item.setNumber, item.totalSets, item.unit);
      } else if (item.kind === 'progress') {
        // Daily set counts only matter for their own day.
        if (item.day === today) await incrementSetProgress(userId, item.categoryId);
      } else if (item.kind === 'streak') {
        await completeWorkoutOnDay(userId, item.day, item.options);
      }
      writeOutbox(userId, readOutbox(userId).filter((it) => it.id !== item.id));
    }
    // Coins last, merged: server balance + everything earned/spent offline.
    const delta = pendingCoinDelta(userId);
    if (delta !== 0) {
      const { data, error } = await supabase.from('profiles').select('coins').eq('id', userId).single();
      if (error) throw error;
      const next = Math.max(0, Math.floor((data?.coins ?? 0) + delta));
      const { error: writeError } = await supabase.from('profiles').update({ coins: next }).eq('id', userId);
      if (writeError) throw writeError;
      writeOutbox(userId, readOutbox(userId).filter((it) => it.kind !== 'coins'));
    }
    return readOutbox(userId).length === 0;
  } catch {
    return false;
  } finally {
    flushing = false;
  }
}
