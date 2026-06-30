import { supabase } from './supabase';
import { toLocalDateString } from './userStats';
import { detectSameDayFatigue } from './setPrescription';
import { recordSetReps } from './repProgress';
import { isSchemaColumnError } from './setLogInsert';
import type {
  LastWeightedSet,
  ProgressionHint,
  SetRepResult
} from '../types/repProgress';
import type { WeightUnit } from './weightUnits';
import { bumpPlateKg, roundToPlateKg } from './weightUnits';

function startOfLocalDayIso(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function fetchTodaysWeightedSets(
  userId: string,
  categoryId: string
): Promise<LastWeightedSet[]> {
  const { data, error } = await supabase
    .from('workout_set_logs')
    .select('weight_kg, reps, completed_at')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .not('weight_kg', 'is', null)
    .gte('completed_at', startOfLocalDayIso())
    .order('completed_at', { ascending: true });

  if (error) {
    if (isSchemaColumnError(error)) return [];
    throw error;
  }

  return (data ?? [])
    .map((row) => {
      const weightKg = Number(row.weight_kg);
      const reps = Number(row.reps);
      if (
        !Number.isFinite(weightKg) ||
        !Number.isFinite(reps) ||
        weightKg <= 0 ||
        reps <= 0
      ) {
        return null;
      }
      return {
        weightKg,
        reps,
        completedAt: row.completed_at
      };
    })
    .filter((row): row is LastWeightedSet => row !== null);
}

export async function fetchLastWeightedSetBeforeToday(
  userId: string,
  categoryId: string
): Promise<LastWeightedSet | null> {
  const { data, error } = await supabase
    .from('workout_set_logs')
    .select('weight_kg, reps, completed_at')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .not('weight_kg', 'is', null)
    .lt('completed_at', startOfLocalDayIso())
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isSchemaColumnError(error)) return null;
    throw error;
  }
  if (!data?.weight_kg || !data.reps) return null;

  const weightKg = Number(data.weight_kg);
  const reps = Number(data.reps);
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(reps) ||
    weightKg <= 0 ||
    reps <= 0
  ) {
    return null;
  }

  return {
    weightKg,
    reps,
    completedAt: data.completed_at
  };
}

/** @deprecated Use fetchLastWeightedSetBeforeToday or fetchTodaysWeightedSets */
export async function fetchLastWeightedSet(
  userId: string,
  categoryId: string
): Promise<LastWeightedSet | null> {
  const today = await fetchTodaysWeightedSets(userId, categoryId);
  if (today.length > 0) return today[today.length - 1];
  return fetchLastWeightedSetBeforeToday(userId, categoryId);
}

export function buildProgressionHint(
  lastSessionSet: LastWeightedSet | null,
  weightKg: number,
  reps: number,
  setNumber: number,
  totalSets: number,
  todaysSetsIncludingCurrent: Array<{ weightKg: number; reps: number }>,
  unit: WeightUnit
): ProgressionHint {
  const maintainKg = roundToPlateKg(weightKg, unit);

  if (
    setNumber === totalSets &&
    totalSets >= 3 &&
    detectSameDayFatigue(todaysSetsIncludingCurrent)
  ) {
    return { kind: 'fatigue_maintain', suggestedWeightKg: maintainKg };
  }

  if (!lastSessionSet) {
    return { kind: 'baseline', suggestedWeightKg: maintainKg };
  }

  if (reps >= 8 && weightKg >= lastSessionSet.weightKg - 0.01) {
    return {
      kind: 'increase',
      suggestedWeightKg: bumpPlateKg(weightKg, unit, 1)
    };
  }

  if (reps <= 4 && weightKg <= lastSessionSet.weightKg + 0.01) {
    return {
      kind: 'decrease',
      suggestedWeightKg: bumpPlateKg(weightKg, unit, -1)
    };
  }

  return { kind: 'maintain', suggestedWeightKg: maintainKg };
}

export async function recordWeightedSetReps(
  userId: string,
  categoryId: string,
  weightKg: number,
  reps: number,
  setNumber: number,
  totalSets: number,
  unit: WeightUnit
): Promise<SetRepResult> {
  const todaysBefore = await fetchTodaysWeightedSets(userId, categoryId);
  const lastSession = await fetchLastWeightedSetBeforeToday(userId, categoryId);
  const todaysIncludingCurrent = [...todaysBefore, { weightKg, reps }];

  const progression = buildProgressionHint(
    lastSession,
    weightKg,
    reps,
    setNumber,
    totalSets,
    todaysIncludingCurrent,
    unit
  );

  const result = await recordSetReps(
    userId,
    categoryId,
    reps,
    weightKg,
    setNumber
  );

  return {
    ...result,
    progression
  };
}

/** @deprecated Use formatWeight from weightUnits */
export function formatWeightKg(weightKg: number): string {
  return Number.isInteger(weightKg) ? `${weightKg}` : weightKg.toFixed(1);
}

export { toLocalDateString };
