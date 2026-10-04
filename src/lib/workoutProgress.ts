import {
  DEFAULT_LINEUP,
  getAllWorkoutCategoryIds,
  getVariantById
} from '../components/moves';
import { supabase } from './supabase';
import {
  completeWorkout,
  fetchUserStats,
  STREAK_MIN_SETS_PER_DAY,
  toLocalDateString
} from './userStats';

function isDefaultEquipped(categoryId: string): boolean {
  return (
    (DEFAULT_LINEUP.upper as readonly string[]).includes(categoryId) ||
    (DEFAULT_LINEUP.lower as readonly string[]).includes(categoryId) ||
    (DEFAULT_LINEUP.core as readonly string[]).includes(categoryId)
  );
}

/** Ensures a user_workouts row exists (e.g. superman-pulls for pre-migration accounts). */
export async function ensureUserWorkoutRow(
  userId: string,
  categoryId: string
): Promise<void> {
  const variant = getVariantById(categoryId);
  if (!variant) {
    throw new Error(`Unknown workout category: ${categoryId}`);
  }

  const { data, error } = await supabase
    .from('user_workouts')
    .select('id')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .maybeSingle();

  if (error) throw error;
  if (data) return;

  const catalogIndex = getAllWorkoutCategoryIds().indexOf(categoryId);
  const sortOrder = catalogIndex >= 0 ? catalogIndex + 1 : 99;

  const { error: insertError } = await supabase.from('user_workouts').insert({
    user_id: userId,
    category_id: categoryId,
    workout_name: variant.name,
    variant_id: variant.id,
    description: variant.description,
    is_equipped: isDefaultEquipped(categoryId),
    sets_completed: 0,
    sort_order: sortOrder
  });

  if (insertError) throw insertError;
}

export const ABSOLUTE_MAX_DAILY_SETS = 3;

export function emptySetsMap(): Record<string, number> {
  return getAllWorkoutCategoryIds().reduce<Record<string, number>>((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});
}

export function sumDailySets(setsCompleted: Record<string, number>): number {
  return Object.values(setsCompleted).reduce(
    (sum, count) => sum + (Number.isFinite(count) ? count : 0),
    0
  );
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
  userId: string
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
      map[row.category_id] = Math.max(
        0,
        Number.isFinite(count) ? count : 0
      );
    }
  }
  return map;
}

export async function fetchSetsProgress(
  userId: string
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

  return loadSetsFromWorkouts(userId);
}

export async function incrementSetProgress(
  userId: string,
  categoryId: string
): Promise<Record<string, number>> {
  const today = toLocalDateString();
  const current = await fetchSetsProgress(userId);
  const prev = current[categoryId] ?? 0;
  const next = prev + 1;

  await ensureUserWorkoutRow(userId, categoryId);

  const { error: workoutError } = await supabase
    .from('user_workouts')
    .update({ sets_completed: next })
    .eq('user_id', userId)
    .eq('category_id', categoryId);

  if (workoutError) throw workoutError;

  await markSetsProgressDate(userId, today);

  const updated = { ...current, [categoryId]: next };
  if (sumDailySets(updated) >= STREAK_MIN_SETS_PER_DAY) {
    try {
      await completeWorkout(userId);
    } catch {
      // Set is saved; streak is reconciled when stats/sets reload.
    }
  }

  return updated;
}

/** @deprecated Use ABSOLUTE_MAX_DAILY_SETS or dailySetGoal from settings */
export const MAX_DAILY_SETS = ABSOLUTE_MAX_DAILY_SETS;
