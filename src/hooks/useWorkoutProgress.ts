import { useCallback, useEffect, useRef, useState } from 'react';
import { toLocalDateString } from '../lib/userStats';
import { useAuth } from '../context/AuthContext';
import type { DailySetGoal } from './useDailySetGoal';
import {
  emptySetsMap,
  fetchSetsProgress,
  incrementSetProgress,
  sumDailySets
} from '../lib/workoutProgress';

export function useWorkoutProgress(dailySetGoal: DailySetGoal) {
  const { user } = useAuth();
  const [setsCompleted, setSetsCompleted] =
    useState<Record<string, number>>(emptySetsMap);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setsRef = useRef<Record<string, number>>(emptySetsMap());
  const show = useCallback((next: Record<string, number>) => {
    setsRef.current = next;
    setSetsCompleted(next);
  }, []);
  const pendingKey = user?.id ? `2failure-user-${user.id}-pending-set-counts` : null;
  type PendingCount = { categoryId: string; count: number; day: string };
  const readPending = useCallback((): PendingCount[] => {
    try {
      return pendingKey ? (JSON.parse(window.localStorage.getItem(pendingKey) ?? '[]') as PendingCount[]) : [];
    } catch {
      return [];
    }
  }, [pendingKey]);
  const writePending = useCallback(
    (list: PendingCount[]) => {
      try {
        if (pendingKey) window.localStorage.setItem(pendingKey, JSON.stringify(list));
      } catch {
        // Storage blocked.
      }
    },
    [pendingKey]
  );

  const loadProgress = useCallback(async () => {
    if (!user) {
      setSetsCompleted(emptySetsMap());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let progress = await fetchSetsProgress(user.id);
      // Counts that couldn't be saved earlier today (no signal): send them now.
      const today = toLocalDateString();
      const pending = readPending().filter((p) => p.day === today);
      const left: PendingCount[] = [];
      for (const p of pending) {
        try {
          progress = await incrementSetProgress(user.id, p.categoryId, p.count);
        } catch {
          left.push(p);
        }
      }
      writePending(left);
      for (const p of left) progress = { ...progress, [p.categoryId]: Math.max(progress[p.categoryId] ?? 0, p.count) };
      show(progress);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load set progress.'
      );
      show(emptySetsMap());
    } finally {
      setLoading(false);
    }
  }, [user, dailySetGoal, readPending, writePending, show]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const incrementSet = useCallback(
    async (categoryId: string): Promise<number | null> => {
      if (!user) return null;

      setError(null);
      // Count it on screen straight away; save the exact count (so a retry
      // after a lost reply can't count it twice).
      const count = (setsRef.current[categoryId] ?? 0) + 1;
      show({ ...setsRef.current, [categoryId]: count });
      for (const delay of [0, 1500, 4000]) {
        if (delay) await new Promise((r) => setTimeout(r, delay));
        try {
          const saved = await incrementSetProgress(user.id, categoryId, count);
          const merged = { ...setsRef.current };
          for (const [id, n] of Object.entries(saved)) merged[id] = Math.max(merged[id] ?? 0, n);
          show(merged);
          return sumDailySets(merged);
        } catch {
          // Try again.
        }
      }
      // Still no connection: keep it on this device and send it next time.
      writePending([...readPending(), { categoryId, count, day: toLocalDateString() }]);
      return sumDailySets(setsRef.current);
    },
    [user, show, readPending, writePending]
  );

  return {
    setsCompleted,
    loading,
    error,
    refetch: loadProgress,
    incrementSet
  };
}
