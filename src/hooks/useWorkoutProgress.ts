import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { DailySetGoal } from './useDailySetGoal';
import {
  emptySetsMap,
  fetchSetsProgress,
  incrementSetProgress
} from '../lib/workoutProgress';

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
      const progress = await fetchSetsProgress(user.id);
      setSetsCompleted(progress);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load set progress.'
      );
      setSetsCompleted(emptySetsMap());
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
        const updated = await incrementSetProgress(user.id, categoryId);
        setSetsCompleted(updated);
        return updated[categoryId] ?? 0;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not save set progress.'
        );
        return null;
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
