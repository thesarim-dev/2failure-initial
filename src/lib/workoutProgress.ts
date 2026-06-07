import { getAllWorkoutCategoryIds } from '../components/moves';
import { supabase } from './supabase';
import { fetchUserStats, toLocalDateString } from './userStats';

export const ABSOLUTE_MAX_DAILY_SETS = 3;

export function emptySetsMap(): Record<string, number> {
  return getAllWorkoutCategoryIds().reduce<Record<string, number>>((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});
}

async function resetDailySets(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_workouts')
    .update({ sets_completed: 0 })
    .eq('user_id', userId);

  if (error) throw error;
}

async function markSetsProgressDate(userId: string, today: string): Promise<void> {
  const { error } = await supabase
    .from('user_stats')
    .update({ sets_progress_date: today })
    .eq('user_id', userId);

  if (error) throw error;
}

async function loadSetsFromWorkouts(
  userId: string,
  maxSets: number
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('user_workouts')
    .select('category_id, sets_completed')
    .eq('user_id', userId);

  if (error) throw error;

  const map = emptySetsMap();
  for (const row of data ?? []) {
    if (row.category_id in map) {
      const count = Number(row.sets_completed);
      map[row.category_id] = Math.min(
        maxSets,
        Math.max(0, Number.isFinite(count) ? count : 0)
      );
    }
  }
  return map;
}

export async function fetchSetsProgress(
  userId: string,
  maxSets: number
): Promise<Record<string, number>> {
  const today = toLocalDateString();
  const stats = await fetchUserStats(userId);
  const progressDate = stats.sets_progress_date ?? null;

  if (progressDate !== today) {
    const isNewDay = progressDate !== null;

    if (isNewDay) {
      await resetDailySets(userId);
    }

    await markSetsProgressDate(userId, today);

    if (isNewDay) {
      return emptySetsMap();
    }
  }

  return loadSetsFromWorkouts(userId, maxSets);
}

export async function incrementSetProgress(
  userId: string,
  categoryId: string,
  maxSets: number
): Promise<Record<string, number>> {
  const today = toLocalDateString();
  const current = await fetchSetsProgress(userId, maxSets);
  const prev = current[categoryId] ?? 0;
  const next = prev >= maxSets ? 0 : prev + 1;

  const { error: workoutError } = await supabase
    .from('user_workouts')
    .update({ sets_completed: next })
    .eq('user_id', userId)
    .eq('category_id', categoryId);

  if (workoutError) throw workoutError;

  await markSetsProgressDate(userId, today);

  return { ...current, [categoryId]: next };
}

/** @deprecated Use ABSOLUTE_MAX_DAILY_SETS or dailySetGoal from settings */
export const MAX_DAILY_SETS = ABSOLUTE_MAX_DAILY_SETS;
