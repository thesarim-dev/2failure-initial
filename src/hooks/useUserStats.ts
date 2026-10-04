import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  completeWorkout,
  computeStreakAfterWorkout,
  fetchUserStats,
  getStreakRestoreCost,
  restoreStreak,
  restoresThisMonth,
  toLocalDateString,
  type StreakRestOptions
} from '../lib/userStats';
import { appendRestLog, readRestLog } from '../lib/restLog';
import type { UserStats } from '../types/userStats';
import { enqueue, readOutbox } from '../lib/outbox';
import { storageKeyFor } from '../lib/persistedSettings';

function readStatsCache(userId: string): UserStats | null {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, 'stats-cache'));
    return raw ? (JSON.parse(raw) as UserStats) : null;
  } catch {
    return null;
  }
}
function writeStatsCache(userId: string, stats: UserStats) {
  try {
    window.localStorage.setItem(storageKeyFor(userId, 'stats-cache'), JSON.stringify(stats));
  } catch {
    // Ignore storage failures.
  }
}
/** Apply streak days still waiting to sync, so the flame is right offline. */
function withQueuedStreak(userId: string, stats: UserStats): UserStats {
  let next = stats;
  for (const item of readOutbox(userId)) {
    if (item.kind !== 'streak') continue;
    if (next.last_workout_date && next.last_workout_date >= item.day) continue;
    const { restDaysAdded: _r, ...updated } = computeStreakAfterWorkout(next, item.day, item.options);
    void _r;
    next = { ...next, ...updated };
  }
  return next;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [restoringStreak, setRestoringStreak] = useState(false);
  const [todayFailures, setTodayFailures] = useState(0);
  const [recentRestDays, setRecentRestDays] = useState<string[]>(() => readRestLog(user?.id));

  useEffect(() => {
    setRecentRestDays(readRestLog(user?.id));
  }, [user?.id]);

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const row = withQueuedStreak(user.id, await fetchUserStats(user.id));
      setStats(row);
      writeStatsCache(user.id, row);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load workout stats.'
      );
      // Offline: keep showing the last known streak, never a false zero.
      const cached = readStatsCache(user.id);
      setStats(cached ? withQueuedStreak(user.id, cached) : null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!stats) {
      setTodayFailures(0);
      return;
    }
    const today = toLocalDateString();
    if (stats.last_workout_date === today) {
      setTodayFailures((n) => (n === 0 ? 1 : n));
    } else {
      setTodayFailures(0);
    }
  }, [stats]);

  /** `restAllowance`: rest days per 7 days that keep the streak alive. */
  const recordWorkoutComplete = useCallback(async (restAllowance = 0) => {
    if (!user) return null;

    setCompleting(true);
    setError(null);

    try {
      const today = toLocalDateString();
      const options: StreakRestOptions = { restAllowance, recentRestDays: readRestLog(user.id) };
      try {
        if (readOutbox(user.id).some((item) => item.kind === 'streak')) throw new Error('queued');
        const { stats: updated, restDaysAdded } = await completeWorkout(user.id, options);
        if (restDaysAdded.length) setRecentRestDays(appendRestLog(user.id, restDaysAdded, today));
        setStats(updated);
        writeStatsCache(user.id, updated);
        setTodayFailures((n) =>
          stats?.last_workout_date === today ? n + 1 : 1
        );
        return updated;
      } catch {
        // No signal: count today now (same rest-aware rule) and sync later.
        enqueue(user.id, { kind: 'streak', day: today, options });
        const base = stats ?? readStatsCache(user.id);
        if (!base || base.last_workout_date === today) return base;
        const { restDaysAdded, ...next } = computeStreakAfterWorkout(base, today, options);
        if (restDaysAdded.length) setRecentRestDays(appendRestLog(user.id, restDaysAdded, today));
        const updated = { ...base, ...next };
        setStats(updated);
        writeStatsCache(user.id, updated);
        return updated;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save workout stats.'
      );
      return null;
    } finally {
      setCompleting(false);
    }
  }, [user]);

  const restoreUserStreak = useCallback(async (options: { free?: boolean } = {}) => {
    if (!user) return null;

    setRestoringStreak(true);
    setError(null);

    try {
      const result = await restoreStreak(user.id, options);
      setStats(result.stats);
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not restore streak.'
      );
      return null;
    } finally {
      setRestoringStreak(false);
    }
  }, [user]);

  return {
    stats,
    currentStreak: stats?.current_streak ?? 0,
    longestStreak: stats?.longest_streak ?? 0,
    totalWorkouts: stats?.total_workouts ?? 0,
    todayFailures,
    lastWorkoutDate: stats?.last_workout_date ?? null,
    recentRestDays,
    restoreStreakCost: stats ? getStreakRestoreCost(restoresThisMonth(stats)) : getStreakRestoreCost(0),
    loading,
    completing,
    restoringStreak,
    error,
    refetch: loadStats,
    recordWorkoutComplete,
    restoreStreak: restoreUserStreak
  };
}
