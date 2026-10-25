import { supabase } from './supabase';

export type SetLogRow = { category_id: string; reps: number; weight_kg: number | null; completed_at: string };

/** Every logged set in the last `days` days, oldest first. */
export async function fetchSetHistory(userId: string, days = 180): Promise<SetLogRow[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('workout_set_logs')
    .select('category_id,reps,weight_kg,completed_at')
    .eq('user_id', userId)
    .gte('completed_at', since);
  if (error) throw error;
  return ((data ?? []) as SetLogRow[]).slice().sort((a, b) => a.completed_at.localeCompare(b.completed_at));
}
