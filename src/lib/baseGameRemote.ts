import { supabase } from './supabase';

/**
 * Reads and writes the player's base in Supabase (table `base_games`).
 * The state is stored as JSON; the server stamps `updated_at` on every write.
 */
export type RemoteBase = { state: unknown; updatedAt: number };

export async function fetchRemoteBase(userId: string): Promise<RemoteBase | null> {
  const { data, error } = await supabase
    .from('base_games')
    .select('state, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { state: data.state, updatedAt: Date.parse(data.updated_at) || 0 };
}

/** Saves the base and returns the server's timestamp for it. */
export async function saveRemoteBase(userId: string, state: { version: number }): Promise<number> {
  const { data, error } = await supabase
    .from('base_games')
    .upsert({ user_id: userId, state, version: state.version }, { onConflict: 'user_id' })
    .select('updated_at')
    .single();
  if (error) throw error;
  return Date.parse(data?.updated_at) || Date.now();
}
