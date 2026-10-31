import { supabase } from './supabase';

export type SetLogRow = { category_id: string; reps: number; weight_kg: number | null; completed_at: string };

const PAGE = 1000;

/**
 * Every logged set in the last `days` days, oldest first. The server returns at
 * most 1,000 rows per request, so this reads newest first, page by page, until
 * it has them all (otherwise a busy history would lose its most recent days).
 */
export async function fetchSetHistory(userId: string, days = 180): Promise<SetLogRow[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const rows: SetLogRow[] = [];
  for (let from = 0; from < 50 * PAGE; from += PAGE) {
    const { data, error } = await supabase
      .from('workout_set_logs')
      .select('category_id,reps,weight_kg,completed_at')
      .eq('user_id', userId)
      .gte('completed_at', since)
      .order('completed_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const page = (data ?? []) as SetLogRow[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows.sort((a, b) => a.completed_at.localeCompare(b.completed_at));
}
