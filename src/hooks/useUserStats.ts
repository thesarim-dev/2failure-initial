import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  completeWorkout,
  fetchUserStats,
  getStreakRestoreCost,
  restoreStreak,
  restoresThisMonth,
  toLocalDateString,
  type StreakRestOptions
} from '../lib/userStats';
import { appendRestLog, readRestLog } from '../lib/restLog';
import type { UserStats } from '../types/userStats';

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
      const row = await fetchUserStats(user.id);
      setStats(row);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load workout stats.'
      );
      setStats(null);
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
      const { stats: updated, restDaysAdded } = await completeWorkout(user.id, options);
      if (restDaysAdded.length) setRecentRestDays(appendRestLog(user.id, restDaysAdded, today));
      setStats(updated);
      setTodayFailures((n) =>
        stats?.last_workout_date === today ? n + 1 : 1
      );
      return updated;
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
