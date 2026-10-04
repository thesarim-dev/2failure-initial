import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { DailySetGoal } from './useDailySetGoal';
import {
  emptySetsMap,
  fetchSetsProgress,
  incrementSetProgress,
  sumDailySets
} from '../lib/workoutProgress';
import { enqueue, readOutbox } from '../lib/outbox';
import { storageKeyFor } from '../lib/persistedSettings';
import { toLocalDateString } from '../lib/userStats';

type ProgressCache = { day: string; sets: Record<string, number> };
function readCache(userId: string): ProgressCache | null {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, 'sets-cache'));
    return raw ? (JSON.parse(raw) as ProgressCache) : null;
  } catch {
    return null;
  }
}
function writeCache(userId: string, sets: Record<string, number>) {
  try {
    window.localStorage.setItem(storageKeyFor(userId, 'sets-cache'), JSON.stringify({ day: toLocalDateString(), sets }));
  } catch {
    // Ignore storage failures.
  }
}
/** Today's sets that are still waiting to sync, by exercise. */
function queuedToday(userId: string): Record<string, number> {
  const today = toLocalDateString();
  const out: Record<string, number> = {};
  for (const item of readOutbox(userId)) {
    if (item.kind === 'progress' && item.day === today) out[item.categoryId] = (out[item.categoryId] ?? 0) + 1;
  }
  return out;
}
function withQueued(sets: Record<string, number>, queued: Record<string, number>): Record<string, number> {
  const next = { ...sets };
  for (const [id, n] of Object.entries(queued)) next[id] = (next[id] ?? 0) + n;
  return next;
}

export function useWorkoutProgress(dailySetGoal: DailySetGoal) {
  const { user } = useAuth();
  const [setsCompleted, setSetsCompleted] =
    useState<Record<string, number>>(emptySetsMap);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!user) {
      setSetsCompleted(emptySetsMap());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const progress = withQueued(await fetchSetsProgress(user.id), queuedToday(user.id));
      setSetsCompleted(progress);
      writeCache(user.id, progress);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load set progress.'
      );
      // Offline: show today's last known progress rather than zeros.
      const cached = readCache(user.id);
      setSetsCompleted(cached && cached.day === toLocalDateString() ? cached.sets : withQueued(emptySetsMap(), queuedToday(user.id)));
    } finally {
      setLoading(false);
    }
  }, [user, dailySetGoal]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const incrementSet = useCallback(
    async (categoryId: string): Promise<number | null> => {
      if (!user) return null;

      setError(null);

      try {
        if (readOutbox(user.id).some((item) => item.kind === 'progress')) {
          throw new Error('queued behind earlier offline sets');
        }
        const updated = await incrementSetProgress(user.id, categoryId);
        setSetsCompleted(updated);
        writeCache(user.id, updated);
        return sumDailySets(updated);
      } catch {
        // No signal: count the set now and sync it later. Never lose it.
        enqueue(user.id, { kind: 'progress', categoryId, day: toLocalDateString() });
        let total = 0;
        setSetsCompleted((prev) => {
          const next = { ...prev, [categoryId]: (prev[categoryId] ?? 0) + 1 };
          total = sumDailySets(next);
          writeCache(user.id, next);
          return next;
        });
        return total;
      }
    },
    [user, dailySetGoal]
  );

  return {
    setsCompleted,
    loading,
    error,
    refetch: loadProgress,
    incrementSet
  };
}
