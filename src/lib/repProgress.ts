import { supabase } from './supabase';
import type { PersonalBest, SetRepResult } from '../types/repProgress';

export function formatPersonalBestDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export async function fetchPersonalBest(
  userId: string,
  categoryId: string
): Promise<PersonalBest> {
  const { data, error } = await supabase
    .from('user_workouts')
    .select('best_reps, best_reps_at')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .maybeSingle();

  if (error) throw error;

  const reps = data?.best_reps;
  return {
    reps: typeof reps === 'number' && reps > 0 ? reps : null,
    achievedAt: data?.best_reps_at ?? null
  };
}

export async function recordSetReps(
  userId: string,
  categoryId: string,
  reps: number
): Promise<SetRepResult> {
  const completedAt = new Date().toISOString();
  const currentBest = await fetchPersonalBest(userId, categoryId);
  const isNewPersonalBest =
    currentBest.reps === null || reps > currentBest.reps;

  const { error: logError } = await supabase.from('workout_set_logs').insert({
    user_id: userId,
    category_id: categoryId,
    reps,
    completed_at: completedAt
  });

  if (logError) throw logError;

  let personalBest = currentBest;

  if (isNewPersonalBest) {
    const { data: updated, error: updateError } = await supabase
      .from('user_workouts')
      .update({
        best_reps: reps,
        best_reps_at: completedAt
      })
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .select('best_reps, best_reps_at')
      .single();

    if (updateError) throw updateError;
    if (!updated) {
      throw new Error('Personal best update affected no rows.');
    }

    personalBest = {
      reps: updated.best_reps,
      achievedAt: updated.best_reps_at
    };
  }

  return {
    reps,
    personalBest,
    isNewPersonalBest
  };
}
