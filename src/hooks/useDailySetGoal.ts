import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageKeyFor } from '../lib/persistedSettings';

export type DailySetGoal = 2 | 3;

export const DEFAULT_DAILY_SET_GOAL: DailySetGoal = 3;

function readStoredGoal(key: string): DailySetGoal {
  if (typeof window === 'undefined') return DEFAULT_DAILY_SET_GOAL;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === '2') return 2;
    if (raw === '3') return 3;
  } catch {
    // Ignore storage failures.
  }

  return DEFAULT_DAILY_SET_GOAL;
}

export function useDailySetGoal() {
  const { user } = useAuth();
  const key = storageKeyFor(user?.id, 'daily-set-goal');

  const [dailySetGoal, setDailySetGoalState] = useState<DailySetGoal>(() =>
    readStoredGoal(key)
  );

  const setDailySetGoal = useCallback(
    (goal: DailySetGoal) => {
      setDailySetGoalState(goal);
      try {
        window.localStorage.setItem(key, String(goal));
      } catch {
        // Ignore storage failures.
      }
    },
    [key]
  );

  return { dailySetGoal, setDailySetGoal };
}
