import { useCallback, useState } from 'react';

export type DailySetGoal = 2 | 3;

const STORAGE_KEY = '2failure-daily-set-goal';
export const DEFAULT_DAILY_SET_GOAL: DailySetGoal = 3;

function readStoredGoal(): DailySetGoal {
  if (typeof window === 'undefined') return DEFAULT_DAILY_SET_GOAL;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === '2') return 2;
    if (raw === '3') return 3;
  } catch {
    // Ignore storage failures.
  }

  return DEFAULT_DAILY_SET_GOAL;
}

export function useDailySetGoal() {
  const [dailySetGoal, setDailySetGoalState] = useState<DailySetGoal>(
    readStoredGoal
  );

  const setDailySetGoal = useCallback((goal: DailySetGoal) => {
    setDailySetGoalState(goal);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(goal));
    } catch {
      // Ignore storage failures.
    }
  }, []);

  return { dailySetGoal, setDailySetGoal };
}
