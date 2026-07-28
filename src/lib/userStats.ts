import { supabase } from './supabase';
import type { UserStats } from '../types/userStats';
import { USER_STATS_COLUMNS } from '../types/userStats';

const DAY_RESET_HOUR = 3;
export const STREAK_RESTORE_COST = 150;
export const STREAK_RESTORE_MIN_LENGTH = 14;
export const STREAK_MIN_SETS_PER_DAY = 2;

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

function normalizeStats(row: UserStats): UserStats {
  return {
    user_id: row.user_id,
    current_streak: Number.isFinite(row.current_streak) ? row.current_streak : 0,
    longest_streak: Number.isFinite(row.longest_streak) ? row.longest_streak : 0,
    total_workouts: Number.isFinite(row.total_workouts) ? row.total_workouts : 0,
    last_workout_date: row.last_workout_date ?? null,
    sets_progress_date: row.sets_progress_date ?? null
  };
}

const DEFAULT_STATS = (userId: string): UserStats => ({
  user_id: userId,
  current_streak: 0,
  longest_streak: 0,
  total_workouts: 0,
  last_workout_date: null,
  sets_progress_date: null
});

/**
 * True only when a full day was missed, meaning the next workout would reset
 * the streak. Not having trained *yet* today does not put the streak at risk.
 */
export function isStreakBroken(
  lastWorkoutDate: string | null,
  today = toLocalDateString()
): boolean {
  if (!lastWorkoutDate) return false;
  return (
    lastWorkoutDate !== today &&
    lastWorkoutDate !== previousLocalDateString(today)
  );
}

export function computeStreakAfterWorkout(
  stats: UserStats,
  today = toLocalDateString(new Date())
): Pick<UserStats, 'current_streak' | 'longest_streak' | 'total_workouts' | 'last_workout_date'> {
  const last = stats.last_workout_date;
  let currentStreak = stats.current_streak;

  if (last === today) {
    // Already worked out today — streak unchanged
  } else if (last === previousLocalDateString(today)) {
    currentStreak = stats.current_streak + 1;
  } else {
    currentStreak = 1;
  }

  const totalWorkouts = stats.total_workouts + 1;
  const longestStreak = Math.max(stats.longest_streak, currentStreak);

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_workouts: totalWorkouts,
    last_workout_date: today
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

export async function completeWorkout(userId: string): Promise<UserStats> {
  const stats = await fetchUserStats(userId);
  const today = toLocalDateString();

  if (stats.last_workout_date === today) {
    return stats;
  }

  const next = computeStreakAfterWorkout(stats, today);

  const { data, error } = await supabase
    .from('user_stats')
    .update(next)
    .eq('user_id', userId)
    .select(USER_STATS_COLUMNS)
    .single();

  if (error) throw error;
  return normalizeStats(data as UserStats);
}

export async function restoreStreak(userId: string): Promise<UserStats> {
  const stats = await fetchUserStats(userId);
  const today = toLocalDateString(new Date());

  if (stats.current_streak <= 0) {
    throw new Error('No streak to restore.');
  }

  if (stats.current_streak < STREAK_RESTORE_MIN_LENGTH) {
    throw new Error('Only longer streaks can be restored.');
  }

  if (stats.last_workout_date === today) {
    return stats;
  }

  if (!isStreakBroken(stats.last_workout_date, today)) {
    throw new Error('Streak is not broken — just train today to keep it going.');
  }

  const next = {
    current_streak: Math.max(stats.current_streak, stats.longest_streak),
    longest_streak: Math.max(stats.longest_streak, stats.current_streak),
    total_workouts: stats.total_workouts,
    last_workout_date: today
  };

  const { data, error } = await supabase
    .from('user_stats')
    .update(next)
    .eq('user_id', userId)
    .select(USER_STATS_COLUMNS)
    .single();

  if (error) throw error;
  return normalizeStats(data as UserStats);
}
