import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchSetHistory } from '../lib/setHistory';
import { STREAK_MIN_SETS_PER_DAY, toLocalDateString } from '../lib/userStats';
import { getLineupSlot } from '../components/moves';

/**
 * Days you trained (YYYY-MM-DD): days with at least STREAK_MIN_SETS_PER_DAY
 * sets, the same bar the streak uses, so the plan, rest days and the streak
 * always agree. From your set history on the server, plus a local copy
 * (instant on load, works offline, includes hold-only days). Stretches don't
 * count as training.
 */
export function useTrainedDays() {
  const { user } = useAuth();
  const key = user?.id ? `2failure-user-${user.id}-trained-days` : null;
  const read = useCallback((): string[] => {
    try {
      return key ? (JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]) : [];
    } catch {
      return [];
    }
  }, [key]);
  const write = useCallback(
    (days: Set<string>) => {
      try {
        if (!key) return;
        const cutoff = toLocalDateString(new Date(Date.now() - 60 * 86400000));
        window.localStorage.setItem(key, JSON.stringify([...days].filter((d) => d >= cutoff).sort()));
      } catch {
        // Storage blocked: the server history still counts.
      }
    },
    [key]
  );
  const [trainedDays, setTrainedDays] = useState<Set<string>>(() => new Set(read()));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTrainedDays(new Set(read()));
    if (!user?.id) return;
    let alive = true;
    fetchSetHistory(user.id, 45)
      .then((rows) => {
        if (!alive) return;
        setTrainedDays((prev) => {
          const next = new Set(prev);
          const perDay = new Map<string, number>();
          for (const r of rows) {
            if (getLineupSlot(r.category_id) === 'recovery') continue;
            const day = toLocalDateString(new Date(r.completed_at));
            perDay.set(day, (perDay.get(day) ?? 0) + 1);
          }
          for (const [day, n] of perDay) if (n >= STREAK_MIN_SETS_PER_DAY) next.add(day);
          write(next);
          return next;
        });
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [user?.id, read, write]);

  /** Call once today has enough sets to count as a training day. */
  const markToday = useCallback(() => {
    const today = toLocalDateString();
    setTrainedDays((prev) => {
      if (prev.has(today)) return prev;
      const next = new Set(prev).add(today);
      write(next);
      return next;
    });
  }, [write]);

  return { trainedDays, loaded, markToday };
}
