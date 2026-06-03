import { supabase } from './supabase';
import type { UserStats } from '../types/userStats';
import { USER_STATS_COLUMNS } from '../types/userStats';

export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayLocalDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
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

export function computeStreakAfterWorkout(
  stats: UserStats,
  today = toLocalDateString(new Date())
): Pick<UserStats, 'current_streak' | 'longest_streak' | 'total_workouts' | 'last_workout_date'> {
  const last = stats.last_workout_date;
  let currentStreak = stats.current_streak;

  if (last === today) {
    // Already worked out today — streak unchanged
  } else if (last === yesterdayLocalDateString()) {
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
  const next = computeStreakAfterWorkout(stats);

  const { data, error } = await supabase
    .from('user_stats')
    .update(next)
    .eq('user_id', userId)
    .select(USER_STATS_COLUMNS)
    .single();

  if (error) throw error;
  return normalizeStats(data as UserStats);
}
