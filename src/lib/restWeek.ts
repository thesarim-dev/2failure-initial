/**
 * Rest days, counted per calendar week (Monday first; Sunday first in Hebrew
 * and Arabic). A plan of P training days gives 7 − P rest days a week, and:
 *
 *  - every day off counts as a rest day, whether you tore the ticket or just
 *    didn't train (one count for the ticket and the streak);
 *  - you can't rest when the days left in the week are all needed to fit your
 *    remaining training days;
 *  - once you've trained your plan's days this week, the rest of the week is
 *    rest (no more training needed; the streak is safe).
 */

export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The first day (YYYY-MM-DD) of the calendar week containing `day`. */
export function weekStartOf(day: string, sundayFirst: boolean): string {
  const [y, m, d] = day.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay(); // 0 = Sunday
  const offset = sundayFirst ? weekday : (weekday + 6) % 7;
  return shiftDay(day, -offset);
}

export type WeekState = {
  /** Training days in the plan, and rest days that leaves (7 − plan). */
  planDays: number;
  allowance: number;
  /** Days this week (before today, plus today if trained) with training. */
  trained: number;
  /** Rest days used this week: past days without training, plus today if declared. */
  restUsed: number;
  /** Rest days still available this week (can be 0 even with allowance left, if every day is needed). */
  restLeft: number;
  /** Training days still needed this week. */
  trainingLeft: number;
  /** The plan's training days are done for the week: the rest of it is rest. */
  weekDone: boolean;
  /** Today is a rest day: declared, or because the week's training is done. */
  restToday: boolean;
  /** Today was made a rest day by finishing the week (not by the ticket). */
  restTodayIsWeekDone: boolean;
  /** Whether you may take today off (tear the ticket). */
  canRestToday: boolean;
};

export function weekState(opts: {
  today: string;
  planDays: number;
  trainedDays: ReadonlySet<string>;
  declaredRest: ReadonlySet<string>;
  sundayFirst: boolean;
  /** The day the plan started: earlier days don't count (a first, partial week). */
  planStart?: string | null;
}): WeekState {
  const { today, trainedDays, declaredRest, sundayFirst } = opts;
  const allowance = 7 - Math.min(7, Math.max(1, opts.planDays));
  const weekStart = weekStartOf(today, sundayFirst);
  // A first, partial week counts from the plan's start, with a training target that fits.
  const start = opts.planStart && opts.planStart > weekStart ? opts.planStart : weekStart;
  const weekLength = 7 - (start > weekStart ? Math.round((new Date(start).getTime() - new Date(weekStart).getTime()) / 86400000) : 0);
  const planDays = start > weekStart ? Math.max(1, Math.min(opts.planDays, weekLength - allowance)) : Math.min(7, Math.max(1, opts.planDays));
  const past: string[] = [];
  for (let d = start; d < today; d = shiftDay(d, 1)) past.push(d);

  const trainedToday = trainedDays.has(today);
  const trainedPast = past.filter((d) => trainedDays.has(d)).length;
  const trained = trainedPast + (trainedToday ? 1 : 0);
  const declaredToday = declaredRest.has(today) && !trainedToday;
  const restUsedPast = past.length - trainedPast;
  const restUsed = restUsedPast + (declaredToday ? 1 : 0);
  const trainingLeft = Math.max(0, planDays - trained);
  const weekDone = trained >= planDays;

  // Days from today to the end of the week that are still open for training.
  const openDays = weekLength - past.length - (trainedToday || declaredToday ? 1 : 0);
  const restLeft = Math.max(0, Math.min(allowance - restUsed, openDays - trainingLeft));

  const restTodayIsWeekDone = weekDone && !trainedToday && !declaredToday;
  const restToday = declaredToday || restTodayIsWeekDone;
  // Taking today off needs a rest day left and enough days after today to fit the training.
  const daysAfterToday = weekLength - past.length - 1;
  const canRestToday =
    !trainedToday && !restToday && allowance - restUsed >= 1 && daysAfterToday >= trainingLeft;

  return { planDays, allowance, trained, restUsed, restLeft, trainingLeft, weekDone, restToday, restTodayIsWeekDone, canRestToday };
}

/**
 * Streak check: do the days off between the last workout and today fit the
 * rest allowance of every calendar week they fall in? `knownRest` adds days
 * already counted as rest (and declared rest days).
 */
export function restFitsWeeks(opts: {
  lastWorkoutDate: string;
  today: string;
  allowance: number;
  knownRest: readonly string[];
  sundayFirst: boolean;
}): boolean {
  const { lastWorkoutDate, today, allowance, knownRest, sundayFirst } = opts;
  const skipped: string[] = [];
  for (let d = shiftDay(lastWorkoutDate, 1); d < today; d = shiftDay(d, 1)) {
    skipped.push(d);
    if (skipped.length > 14) return false;
  }
  if (!skipped.length) return true;
  const rest = new Set([...knownRest, ...skipped].filter((d) => d < today));
  const weeks = new Set(skipped.map((d) => weekStartOf(d, sundayFirst)));
  for (const w of weeks) {
    let count = 0;
    for (const d of rest) if (weekStartOf(d, sundayFirst) === w) count += 1;
    if (count > Math.max(0, allowance)) return false;
  }
  return true;
}
