import { supabase } from './supabase';
import { insertWorkoutSetLog, isSchemaColumnError } from './setLogInsert';
import { ensureUserWorkoutRow } from './workoutProgress';
import type { PersonalBest, SetRepResult, WeightPersonalBest } from '../types/repProgress';

import type { Language } from '../i18n/types';

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  he: 'he-IL',
  ar: 'ar'
};

export function formatPersonalBestDate(
  iso: string | null,
  language: Language = 'en'
): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(LOCALE_BY_LANGUAGE[language], {
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

export async function fetchWeightPersonalBest(
  userId: string,
  categoryId: string
): Promise<WeightPersonalBest> {
  const { data, error } = await supabase
    .from('user_workouts')
    .select('best_weight_kg, best_weight_reps, best_weight_at')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .maybeSingle();

  if (error) throw error;

  const weightKg = data?.best_weight_kg;
  const reps = data?.best_weight_reps;
  return {
    weightKg:
      typeof weightKg === 'number' && weightKg > 0 ? weightKg : null,
    reps: typeof reps === 'number' && reps > 0 ? reps : null,
    achievedAt: data?.best_weight_at ?? null
  };
}

function estimated1Rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

function isBetterWeightSet(
  weightKg: number,
  reps: number,
  best: WeightPersonalBest
): boolean {
  if (best.weightKg === null || best.reps === null) return true;
  return estimated1Rm(weightKg, reps) > estimated1Rm(best.weightKg, best.reps);
}

export async function recordSetReps(
  userId: string,
  categoryId: string,
  reps: number,
  weightKg?: number,
  setNumber?: number
): Promise<SetRepResult> {
  await ensureUserWorkoutRow(userId, categoryId);

  const completedAt = new Date().toISOString();
  const currentBest = await fetchPersonalBest(userId, categoryId);
  const isNewPersonalBest =
    currentBest.reps === null || reps > currentBest.reps;

  const logRow: {
    user_id: string;
    category_id: string;
    reps: number;
    completed_at: string;
    weight_kg?: number;
    set_number?: number;
  } = {
    user_id: userId,
    category_id: categoryId,
    reps,
    completed_at: completedAt
  };

  if (weightKg !== undefined && weightKg > 0) {
    logRow.weight_kg = weightKg;
  }
  if (setNumber !== undefined && setNumber > 0) {
    logRow.set_number = setNumber;
  }

  await insertWorkoutSetLog(logRow);

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

  let weightPersonalBest: WeightPersonalBest | null = null;
  let isNewWeightPersonalBest = false;

  if (weightKg !== undefined && weightKg > 0) {
    try {
      const currentWeightBest = await fetchWeightPersonalBest(userId, categoryId);
      isNewWeightPersonalBest = isBetterWeightSet(weightKg, reps, currentWeightBest);
      weightPersonalBest = currentWeightBest;

      if (isNewWeightPersonalBest) {
        const { data: updated, error: updateError } = await supabase
          .from('user_workouts')
          .update({
            best_weight_kg: weightKg,
            best_weight_reps: reps,
            best_weight_at: completedAt
          })
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .select('best_weight_kg, best_weight_reps, best_weight_at')
          .single();

        if (updateError) throw updateError;
        if (!updated) {
          throw new Error('Weight personal best update affected no rows.');
        }

        weightPersonalBest = {
          weightKg: Number(updated.best_weight_kg),
          reps: updated.best_weight_reps,
          achievedAt: updated.best_weight_at
        };
      }
    } catch (weightBestError) {
      if (!isSchemaColumnError(weightBestError)) {
        throw weightBestError;
      }
      // Weight PB columns not migrated yet — set log still saved.
    }
  }

  return {
    reps,
    weightKg: weightKg ?? null,
    personalBest,
    weightPersonalBest,
    isNewPersonalBest,
    isNewWeightPersonalBest
  };
}
