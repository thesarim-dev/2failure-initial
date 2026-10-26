import { supabase } from './supabase';
import { toLocalDateString } from './userStats';

export type LastSet = { reps: number; weightKg: number | null; today: boolean };

/** Your most recent logged set of an exercise (for "Last time: 14 reps"). */
export async function fetchLastSet(userId: string, categoryId: string): Promise<LastSet | null> {
  const { data, error } = await supabase
    .from('workout_set_logs')
    .select('reps,weight_kg,completed_at')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .order('completed_at', { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  const row = data[0] as { reps: number; weight_kg: number | null; completed_at: string };
  return {
    reps: row.reps,
    weightKg: row.weight_kg && row.weight_kg > 0 ? Number(row.weight_kg) : null,
    today: toLocalDateString(new Date(row.completed_at)) === toLocalDateString()
  };
}
