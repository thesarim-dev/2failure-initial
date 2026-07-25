import { supabase } from './supabase';
import { toLocalDayStartIso } from './userStats';

export const PUSHUP_DAILY_GOAL = 100;

export async function fetchDailyPushupReps(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('workout_set_logs')
    .select('reps')
    .eq('user_id', userId)
    .eq('category_id', 'pushups')
    .gte('completed_at', toLocalDayStartIso());

  if (error) throw error;

  return (data ?? []).reduce((sum, row) => {
    const reps = Number(row.reps);
    return sum + (Number.isFinite(reps) && reps > 0 ? reps : 0);
  }, 0);
}
