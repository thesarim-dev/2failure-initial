import { supabase } from './supabase';

export const PUSHUP_DAILY_GOAL = 100;

function localDayStartIso(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function fetchDailyPushupReps(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('workout_set_logs')
    .select('reps')
    .eq('user_id', userId)
    .eq('category_id', 'pushups')
    .gte('completed_at', localDayStartIso());

  if (error) throw error;

  return (data ?? []).reduce((sum, row) => {
    const reps = Number(row.reps);
    return sum + (Number.isFinite(reps) && reps > 0 ? reps : 0);
  }, 0);
}
