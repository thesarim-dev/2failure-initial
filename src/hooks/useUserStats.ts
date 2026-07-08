import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  completeWorkout,
  fetchUserStats,
  restoreStreak,
  toLocalDateString
} from '../lib/userStats';
import type { UserStats } from '../types/userStats';

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [restoringStreak, setRestoringStreak] = useState(false);
  const [todayFailures, setTodayFailures] = useState(0);

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

  const recordWorkoutComplete = useCallback(async () => {
    if (!user) return null;

    setCompleting(true);
    setError(null);

    try {
      const today = toLocalDateString();
      const updated = await completeWorkout(user.id);
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

  const restoreUserStreak = useCallback(async () => {
    if (!user) return null;

    setRestoringStreak(true);
    setError(null);

    try {
      const updated = await restoreStreak(user.id);
      setStats(updated);
      return updated;
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
    loading,
    completing,
    restoringStreak,
    error,
    refetch: loadStats,
    recordWorkoutComplete,
    restoreStreak: restoreUserStreak
  };
}
