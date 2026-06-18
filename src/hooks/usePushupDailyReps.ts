import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDailyPushupReps } from '../lib/pushupDailyProgress';

export function usePushupDailyReps() {
  const { user } = useAuth();
  const [pushupRepsToday, setPushupRepsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setPushupRepsToday(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setPushupRepsToday(await fetchDailyPushupReps(user.id));
    } catch {
      setPushupRepsToday(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const addReps = useCallback((reps: number) => {
    if (!Number.isFinite(reps) || reps <= 0) return;
    setPushupRepsToday((prev) => prev + reps);
  }, []);

  return { pushupRepsToday, loading, refetch, addReps };
}
