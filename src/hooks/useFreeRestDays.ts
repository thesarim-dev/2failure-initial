import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageKeyFor } from '../lib/persistedSettings';
import { toLocalDateString } from '../lib/userStats';

/**
 * Rest days for players without the rotating program: up to two in any
 * 7 days (the same rolling window the program uses). A rest day swaps today's
 * lineup for stretches and never breaks the streak.
 */
export const FREE_REST_DAYS_PER_WEEK = 2;
const KEY = 'free-rest-days';

function daysBetween(start: string, end: string): number {
  const [ay, am, ad] = start.split('-').map(Number);
  const [by, bm, bd] = end.split('-').map(Number);
  return Math.round((new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()) / 86_400_000);
}

function read(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
      : [];
  } catch {
    return [];
  }
}

export function useFreeRestDays(enabled: boolean) {
  const { user } = useAuth();
  const key = storageKeyFor(user?.id, KEY);
  const [restDays, setRestDays] = useState<string[]>(() => read(key));
  const today = toLocalDateString();

  useEffect(() => setRestDays(read(key)), [key]);

  const usedThisWeek = useMemo(
    () =>
      restDays.filter((day) => {
        const elapsed = daysBetween(day, today);
        return elapsed >= 0 && elapsed < 7;
      }).length,
    [restDays, today]
  );

  const isRestDayToday = enabled && restDays.includes(today);
  const canTakeRestDay = enabled && !isRestDayToday && usedThisWeek < FREE_REST_DAYS_PER_WEEK;

  const markTodayAsRestDay = useCallback(() => {
    if (!canTakeRestDay) return;
    // Keep only the rolling window, then add today.
    const next = [...restDays.filter((day) => daysBetween(day, today) < 7), today];
    setRestDays(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }, [canTakeRestDay, restDays, today, key]);

  return {
    isRestDayToday,
    canTakeRestDay,
    restDaysRemainingThisWeek: Math.max(0, FREE_REST_DAYS_PER_WEEK - usedThisWeek),
    markTodayAsRestDay
  };
}
