import { supabase } from './supabase';
import type { UserStats } from '../types/userStats';
import { USER_STATS_COLUMNS } from '../types/userStats';

const DAY_RESET_HOUR = 3;
export const STREAK_MIN_SETS_PER_DAY = 2;
export const STREAK_RESTORE_BASE_COST = 100;
export const STREAK_RESTORE_MAX_COST = 1600;

export function shouldCountStreakForDay(
  totalSetsCompletedToday: number,
  lastWorkoutDate: string | null,
  today = toLocalDateString()
): boolean {
  return (
    totalSetsCompletedToday >= STREAK_MIN_SETS_PER_DAY &&
    lastWorkoutDate !== today
  );
}

function getDayBucket(date: Date): string {
  const adjustedDate = new Date(date);

  if (adjustedDate.getHours() < DAY_RESET_HOUR) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }

  const y = adjustedDate.getFullYear();
  const m = String(adjustedDate.getMonth() + 1).padStart(2, '0');
  const d = String(adjustedDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toLocalDateString(date: Date = new Date()): string {
  return getDayBucket(date);
}

/** Local ISO timestamp when the current app day started (same 3am boundary as streaks). */
export function toLocalDayStartIso(date: Date = new Date()): string {
  const start = new Date(date);

  if (start.getHours() < DAY_RESET_HOUR) {
    start.setDate(start.getDate() - 1);
  }

  start.setHours(DAY_RESET_HOUR, 0, 0, 0);
  return start.toISOString();
}

export function previousLocalDateString(today = toLocalDateString()): string {
  const [year, month, day] = today.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getRestoreMonthKey(today = toLocalDateString()): string {
  return today.slice(0, 7);
}

export function restoresThisMonth(
  stats: Pick<UserStats, 'streak_restore_month' | 'streak_restore_count'>,
  today = toLocalDateString()
): number {
  return stats.streak_restore_month === getRestoreMonthKey(today)
    ? stats.streak_restore_count
    : 0;
}

export function getStreakRestoreCost(restoresThisMonthCount: number): number {
  const steps = Math.max(0, Math.floor(restoresThisMonthCount));
  return Math.min(STREAK_RESTORE_MAX_COST, STREAK_RESTORE_BASE_COST * 2 ** steps);
}

function normalizeStats(row: UserStats): UserStats {
  return {
    user_id: row.user_id,
    current_streak: Number.isFinite(row.current_streak) ? row.current_streak : 0,
    longest_streak: Number.isFinite(row.longest_streak) ? row.longest_streak : 0,
    total_workouts: Number.isFinite(row.total_workouts) ? row.total_workouts : 0,
    last_workout_date: row.last_workout_date ?? null,
    sets_progress_date: row.sets_progress_date ?? null,
    streak_restore_month: row.streak_restore_month ?? null,
    streak_restore_count: Number.isFinite(row.streak_restore_count)
      ? row.streak_restore_count
      : 0
  };
}

const DEFAULT_STATS = (userId: string): UserStats => ({
  user_id: userId,
  current_streak: 0,
  longest_streak: 0,
  total_workouts: 0,
  last_workout_date: null,
  sets_progress_date: null,
  streak_restore_month: null,
  streak_restore_count: 0
});

/**
 * Rest-aware streaks. Days without training don't break the streak as long as
 * they fit the player's weekly rest allowance (7 minus training days per week,
 * or 7 minus the program split). Rest days count as days on plan.
 */
export type StreakRestOptions = {
  /** Rest days allowed in any 7-day window. */
  restAllowance: number;
  /** Days already counted as rest recently (YYYY-MM-DD). */
  recentRestDays: string[];
};

function shiftLocalDate(day: string, delta: number): string {
  const [year, month, date] = day.split('-').map(Number);
  const d = new Date(year, month - 1, date);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Days strictly between the last workout and today (the days that were skipped). */
export function skippedDays(lastWorkoutDate: string, today: string): string[] {
  const days: string[] = [];
  let day = shiftLocalDate(lastWorkoutDate, 1);
  // Cap the walk: anything this long is broken regardless of allowance.
  while (day < today && days.length < 14) {
    days.push(day);
    day = shiftLocalDate(day, 1);
  }
  return days;
}

/** Whether the skipped days fit the rest allowance of the last 7 days. */
export function restFitsAllowance(
  lastWorkoutDate: string,
  today: string,
  options: StreakRestOptions
): boolean {
  const skipped = skippedDays(lastWorkoutDate, today);
  const windowStart = shiftLocalDate(today, -7);
  const restInWindow = new Set(
    [...options.recentRestDays, ...skipped].filter((day) => day >= windowStart && day < today)
  );
  const skippedOutsideWindow = skipped.filter((day) => day < windowStart).length;
  return restInWindow.size + skippedOutsideWindow <= Math.max(0, options.restAllowance);
}

/**
 * True only when the streak can no longer continue. Not having trained *yet*
 * today does not put the streak at risk, and neither does planned rest.
 */
export function isStreakBroken(
  lastWorkoutDate: string | null,
  today = toLocalDateString(),
  options?: StreakRestOptions
): boolean {
  if (!lastWorkoutDate) return false;
  if (lastWorkoutDate === today || lastWorkoutDate === previousLocalDateString(today)) {
    return false;
  }
  if (options && restFitsAllowance(lastWorkoutDate, today, options)) return false;
  return true;
}

export function canOfferStreakRestore(
  stats: Pick<UserStats, 'current_streak' | 'longest_streak' | 'last_workout_date'>,
  totalSetsCompletedToday: number,
  today = toLocalDateString(),
  options?: StreakRestOptions
): boolean {
  const restoredStreak = Math.max(stats.current_streak, stats.longest_streak);
  return (
    restoredStreak > 0 &&
    isStreakBroken(stats.last_workout_date, today, options) &&
    totalSetsCompletedToday < STREAK_MIN_SETS_PER_DAY
  );
}

export function computeStreakAfterWorkout(
  stats: UserStats,
  today = toLocalDateString(new Date()),
  options?: StreakRestOptions
): Pick<UserStats, 'current_streak' | 'longest_streak' | 'total_workouts' | 'last_workout_date'> & {
  /** Skipped days that were counted as planned rest. Not stored in the database. */
  restDaysAdded: string[];
} {
  const last = stats.last_workout_date;
  let currentStreak = stats.current_streak;
  let restDaysAdded: string[] = [];

  if (last === today) {
    // Already worked out today — streak unchanged
  } else if (last === previousLocalDateString(today)) {
    currentStreak = stats.current_streak + 1;
  } else if (last && options && restFitsAllowance(last, today, options)) {
    // Planned rest: rest days count as days on plan, plus today.
    restDaysAdded = skippedDays(last, today);
    currentStreak = stats.current_streak + restDaysAdded.length + 1;
  } else {
    currentStreak = 1;
  }

  const totalWorkouts = stats.total_workouts + 1;
  const longestStreak = Math.max(stats.longest_streak, currentStreak);

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_workouts: totalWorkouts,
    last_workout_date: today,
    restDaysAdded
  };
}

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from('user_stats')
    .select(USER_STATS_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return normalizeStats(data as UserStats);

  const { data: created, error: insertError } = await supabase
    .from('user_stats')
    .insert(DEFAULT_STATS(userId))
    .select(USER_STATS_COLUMNS)
    .single();

  if (insertError) {
    const { data: existing, error: refetchError } = await supabase
      .from('user_stats')
      .select(USER_STATS_COLUMNS)
      .eq('user_id', userId)
      .single();

    if (refetchError) throw insertError;
    return normalizeStats(existing as UserStats);
  }

  return normalizeStats(created as UserStats);
}

export async function completeWorkout(
  userId: string,
  options?: StreakRestOptions
): Promise<{ stats: UserStats; restDaysAdded: string[] }> {
  const stats = await fetchUserStats(userId);
  const today = toLocalDateString();

  if (stats.last_workout_date === today) {
    return { stats, restDaysAdded: [] };
  }

  const { restDaysAdded, ...next } = computeStreakAfterWorkout(stats, today, options);

  const { data, error } = await supabase
    .from('user_stats')
    .update(next)
    .eq('user_id', userId)
    .select(USER_STATS_COLUMNS)
    .single();

  if (error) throw error;
  return { stats: normalizeStats(data as UserStats), restDaysAdded };
}

export async function restoreStreak(
  userId: string,
  options: { free?: boolean } = {}
): Promise<{ stats: UserStats; cost: number }> {
  const stats = await fetchUserStats(userId);
  const today = toLocalDateString(new Date());
  const restoredStreak = Math.max(stats.current_streak, stats.longest_streak);

  if (restoredStreak <= 0) {
    throw new Error('No streak to restore.');
  }

  if (
    stats.last_workout_date === today &&
    stats.current_streak >= restoredStreak
  ) {
    return { stats, cost: 0 };
  }

  const monthKey = getRestoreMonthKey(today);
  const usage = restoresThisMonth(stats, today);
  // A Lodge streak shield restores for free and doesn't raise next month's price.
  const cost = options.free ? 0 : getStreakRestoreCost(usage);

  const next = {
    current_streak: restoredStreak,
    longest_streak: restoredStreak,
    total_workouts: stats.total_workouts,
    last_workout_date: today,
    streak_restore_month: monthKey,
    streak_restore_count: options.free ? usage : usage + 1
  };

  const { data, error } = await supabase
    .from('user_stats')
    .update(next)
    .eq('user_id', userId)
    .select(USER_STATS_COLUMNS)
    .single();

  if (error) throw error;
  return { stats: normalizeStats(data as UserStats), cost };
}
