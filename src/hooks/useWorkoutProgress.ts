import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  emptySetsMap,
  fetchSetsProgress,
  incrementSetProgress
} from '../lib/workoutProgress';

export function useWorkoutProgress() {
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
  }, [user]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const incrementSet = useCallback(
    async (categoryId: string) => {
      if (!user) return;

      setError(null);

      try {
        const updated = await incrementSetProgress(user.id, categoryId);
        setSetsCompleted(updated);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not save set progress.'
        );
      }
    },
    [user]
  );

  return {
    setsCompleted,
    loading,
    error,
    refetch: loadProgress,
    incrementSet
  };
}
