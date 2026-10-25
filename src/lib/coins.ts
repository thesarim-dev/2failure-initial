import { supabase } from './supabase';

/**
 * Coins are earned and spent on the server (see the migration
 * 20261026120000_server_coin_rewards.sql): the app reports what happened and
 * the server decides the amount and checks it's plausible.
 *
 * Until that migration is applied, the functions don't exist; callers fall
 * back to the old client-side path so nothing breaks in between.
 */
export type ServerCoinResult = { ok: true; balance: number; earned?: number } | { ok: false; missing: boolean; message: string };

function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return error.code === 'PGRST202' || error.code === '42883' || msg.includes('could not find the function') || msg.includes('does not exist');
}

export async function earnSetCoins(categoryId: string, seconds: number, tier: string): Promise<ServerCoinResult> {
  const { data, error } = await supabase.rpc('log_set_reward', {
    p_category_id: categoryId,
    p_seconds: Math.round(seconds),
    p_tier: tier
  });
  if (error) return { ok: false, missing: isMissingFunction(error), message: error.message };
  const row = (Array.isArray(data) ? data[0] : data) as { earned: number; balance: number } | null;
  return row ? { ok: true, balance: row.balance, earned: row.earned } : { ok: false, missing: false, message: 'no result' };
}

export async function spendServerCoins(amount: number, reason: string): Promise<ServerCoinResult> {
  const { data, error } = await supabase.rpc('spend_coins', { p_amount: Math.round(amount), p_reason: reason });
  if (error) return { ok: false, missing: isMissingFunction(error), message: error.message };
  return { ok: true, balance: Number(data) };
}
