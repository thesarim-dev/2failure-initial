import { supabase } from './supabase';

/**
 * Friends, base visits, cheers and the weekly squad challenge. Everything goes
 * through checked server functions (see 20261101120000_social.sql).
 */
export type Friend = {
  id: string;
  name: string;
  status: 'pending' | 'accepted';
  /** A request they sent you (accept or decline). */
  incoming: boolean;
  streak: number;
  hqLevel: number;
  setsThisWeek: number;
  cheeredToday: boolean;
};
export type SquadStatus = { squadId: string | null; goal: number; total: number; mySets: number; members: number; claimed: boolean };
export type SquadMember = { id: string; name: string; status: 'joined' | 'invited'; sets: number; isMe: boolean };
export type SquadInvite = { squadId: string; from: string; members: string[] };
/** People in a squad, you included. */
export const SQUAD_MAX = 4;
export type AddResult = 'sent' | 'accepted' | 'already' | 'pending' | 'self' | 'not_found' | 'limit' | 'error';

/** Sets each squad member contributes to the weekly goal; you need 10 yourself to claim. */
export const SQUAD_SETS_EACH = 30;
export const SQUAD_MIN_TO_CLAIM = 10;
export const SQUAD_REWARD = { coins: 300, materials: 40 };

export async function myFriendCode(): Promise<string | null> {
  const { data, error } = await supabase.rpc('my_friend_code');
  return error ? null : ((data as string | null) ?? null);
}

export async function addFriend(code: string): Promise<AddResult> {
  const { data, error } = await supabase.rpc('send_friend_request', { p_code: code });
  return error ? 'error' : ((data as AddResult) ?? 'error');
}

export async function respondToRequest(friendId: string, accept: boolean): Promise<void> {
  await supabase.rpc('respond_friend_request', { p_friend: friendId, p_accept: accept });
}

export async function removeFriend(friendId: string): Promise<void> {
  await supabase.rpc('remove_friend', { p_friend: friendId });
}

export async function friendsOverview(): Promise<Friend[]> {
  const { data, error } = await supabase.rpc('friends_overview');
  if (error || !Array.isArray(data)) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.friend_id),
    name: String(r.display_name ?? 'Athlete'),
    status: r.status === 'accepted' ? 'accepted' : 'pending',
    incoming: !!r.incoming,
    streak: Number(r.current_streak ?? 0),
    hqLevel: Number(r.hq_level ?? 1),
    setsThisWeek: Number(r.sets_this_week ?? 0),
    cheeredToday: !!r.cheered_today
  }));
}

export async function friendBase(friendId: string): Promise<unknown | null> {
  const { data, error } = await supabase.rpc('get_friend_base', { p_friend: friendId });
  return error ? null : data;
}

export async function cheerFriend(friendId: string): Promise<'cheered' | 'already' | 'not_friends' | 'error'> {
  const { data, error } = await supabase.rpc('cheer_friend', { p_friend: friendId });
  return error ? 'error' : ((data as 'cheered' | 'already' | 'not_friends') ?? 'error');
}

export async function squadStatus(): Promise<SquadStatus | null> {
  const { data, error } = await supabase.rpc('squad_status');
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (error || !row) return null;
  return {
    squadId: row.squad_id ? String(row.squad_id) : null,
    goal: Number(row.goal ?? 0),
    total: Number(row.total ?? 0),
    mySets: Number(row.my_sets ?? 0),
    members: Number(row.members ?? 1),
    claimed: !!row.claimed
  };
}

export async function claimSquadReward(): Promise<{ ok: true; balance: number } | { ok: false; reason: string }> {
  const { data, error } = await supabase.rpc('claim_squad_reward');
  if (error) return { ok: false, reason: error.message };
  const row = (Array.isArray(data) ? data[0] : data) as { balance: number } | null;
  return row ? { ok: true, balance: Number(row.balance) } : { ok: false, reason: 'no result' };
}

export async function squadMembers(): Promise<SquadMember[]> {
  const { data, error } = await supabase.rpc('squad_members_status');
  if (error || !Array.isArray(data)) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.user_id),
    name: String(r.display_name ?? 'Athlete'),
    status: r.status === 'joined' ? 'joined' : 'invited',
    sets: Number(r.sets_this_week ?? 0),
    isMe: !!r.is_me
  }));
}

export async function squadInvites(): Promise<SquadInvite[]> {
  const { data, error } = await supabase.rpc('my_squad_invites');
  if (error || !Array.isArray(data)) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    squadId: String(r.squad_id),
    from: String(r.from_name ?? 'Athlete'),
    members: Array.isArray(r.members) ? (r.members as string[]) : []
  }));
}

/** Start this week's squad with 1–3 friends (they get invites). */
export async function createSquad(friendIds: string[]): Promise<boolean> {
  const { error } = await supabase.rpc('create_squad', { p_friends: friendIds });
  return !error;
}

export async function inviteToSquad(friendId: string): Promise<string> {
  const { data, error } = await supabase.rpc('invite_to_squad', { p_friend: friendId });
  return error ? 'error' : String(data);
}

export async function respondSquadInvite(squadId: string, accept: boolean): Promise<string> {
  const { data, error } = await supabase.rpc('respond_squad_invite', { p_squad: squadId, p_accept: accept });
  return error ? 'error' : String(data);
}

export async function leaveSquad(): Promise<void> {
  await supabase.rpc('leave_squad');
}
