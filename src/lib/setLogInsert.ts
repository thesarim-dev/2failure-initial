import { supabase } from './supabase';

type SetLogInsert = {
  user_id: string;
  category_id: string;
  reps: number;
  completed_at: string;
  weight_kg?: number;
  set_number?: number;
};

function isMissingColumnError(error: { message?: string } | null, column: string): boolean {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  return message.includes(column.toLowerCase()) || message.includes('schema cache');
}

export async function insertWorkoutSetLog(logRow: SetLogInsert): Promise<void> {
  // The server checks the numbers are plausible (see 20261027120000_server_economy.sql).
  const { error: rpcError } = await supabase.rpc('log_set_entry', {
    p_category_id: logRow.category_id,
    p_reps: logRow.reps,
    p_weight_kg: logRow.weight_kg ?? null,
    p_set_number: logRow.set_number ?? null
  });
  if (!rpcError) return;
  const missing = rpcError.code === 'PGRST202' || /could not find the function|does not exist/i.test(rpcError.message ?? '');
  if (!missing) throw rpcError;
  // Until the migration is applied: the old direct insert.
  const { error } = await supabase.from('workout_set_logs').insert(logRow);

  if (!error) return;

  if (
    logRow.set_number !== undefined &&
    isMissingColumnError(error, 'set_number')
  ) {
    const { set_number: _omit, ...withoutSetNumber } = logRow;
    const { error: retryError } = await supabase
      .from('workout_set_logs')
      .insert(withoutSetNumber);
    if (!retryError) return;
    if (isMissingColumnError(retryError, 'weight_kg')) {
      throw new Error(
        'Weight logging is not set up on the server yet. Apply the latest Supabase migrations.'
      );
    }
    throw retryError;
  }

  if (isMissingColumnError(error, 'weight_kg')) {
    throw new Error(
      'Weight logging is not set up on the server yet. Apply the latest Supabase migrations.'
    );
  }

  throw error;
}

export function isSchemaColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('message' in error)) return false;
  const message = String(error.message).toLowerCase();
  return (
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('could not find')
  );
}
