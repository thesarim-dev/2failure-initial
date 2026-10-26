import type { SetLogRow } from './setHistory';
import { toLocalDateString } from './userStats';

/**
 * The week as dots (trained / rested / today / missed / upcoming) and a recap
 * of last week. Weeks start on Monday in English and Sunday in Hebrew and
 * Arabic, matching local calendars.
 */
const DAY = 86400000;

export function weekStartsSunday(language: string): boolean {
  return language === 'he' || language === 'ar';
}

export function startOfWeek(date: Date, sundayFirst: boolean): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = sundayFirst ? d.getDay() : (d.getDay() + 6) % 7;
  return new Date(d.getTime() - offset * DAY);
}

export type DotState = 'trained' | 'rested' | 'missed' | 'today' | 'todayDone' | 'todayRest' | 'upcoming';

export function weekDots(rows: SetLogRow[], restDays: string[], now: Date, sundayFirst: boolean): { key: string; state: DotState }[] {
  const trained = new Set(rows.map((r) => toLocalDateString(new Date(r.completed_at))));
  const rested = new Set(restDays);
  const start = startOfWeek(now, sundayFirst);
  const today = toLocalDateString(now);
  return Array.from({ length: 7 }, (_, i) => {
    const key = toLocalDateString(new Date(start.getTime() + i * DAY + 12 * 3600000));
    let state: DotState;
    if (key === today) state = trained.has(key) ? 'todayDone' : rested.has(key) ? 'todayRest' : 'today';
    else if (key > today) state = 'upcoming';
    else state = trained.has(key) ? 'trained' : rested.has(key) ? 'rested' : 'missed';
    return { key, state };
  });
}

export type WeekRecap = {
  weekKey: string;
  sets: number;
  days: number;
  records: number;
  best: { id: string; reps: number; kg: number | null } | null;
};

/** Last week's totals, records (beating your previous best) and best set. */
export function lastWeekRecap(rows: SetLogRow[], now: Date, sundayFirst: boolean): WeekRecap | null {
  const thisWeek = startOfWeek(now, sundayFirst);
  const lastWeek = new Date(thisWeek.getTime() - 7 * DAY);
  const inLastWeek = (r: SetLogRow) => {
    const t = new Date(r.completed_at);
    return t >= lastWeek && t < thisWeek;
  };
  const week = rows.filter(inLastWeek);
  if (!week.length) return null;
  const bestBefore = new Map<string, number>();
  let records = 0;
  let best: WeekRecap['best'] = null;
  let bestScore = -1;
  for (const r of rows) {
    const weighted = !!(r.weight_kg && r.weight_kg > 0);
    const value = weighted ? Number(r.weight_kg) : r.reps;
    const prev = bestBefore.get(r.category_id);
    if (inLastWeek(r)) {
      if (prev !== undefined && value > prev) records += 1;
      // The week's standout set: the biggest improvement over your previous best.
      const score = prev !== undefined ? value / Math.max(1, prev) : 0;
      if (score > bestScore && prev !== undefined && value > prev) {
        bestScore = score;
        best = { id: r.category_id, reps: r.reps, kg: weighted ? value : null };
      }
    }
    if (prev === undefined || value > prev) bestBefore.set(r.category_id, value);
  }
  if (!best) {
    const top = week.reduce((a, r) => (r.reps > a.reps ? r : a), week[0]);
    best = { id: top.category_id, reps: top.reps, kg: top.weight_kg && top.weight_kg > 0 ? Number(top.weight_kg) : null };
  }
  return {
    weekKey: toLocalDateString(lastWeek),
    sets: week.length,
    days: new Set(week.map((r) => toLocalDateString(new Date(r.completed_at)))).size,
    records,
    best
  };
}

/** The recap shows on the first two days of a week (tests can force it with window.__forceRecap). */
export function recapDue(now: Date, sundayFirst: boolean): boolean {
  if ((window as unknown as { __forceRecap?: boolean }).__forceRecap) return true;
  const day = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - startOfWeek(now, sundayFirst).getTime()) / DAY);
  return day <= 1;
}
