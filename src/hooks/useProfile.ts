import { useCallback, useEffect, useRef, useState } from 'react';
import { storageKeyFor } from '../lib/persistedSettings';
import { enqueue, flushOutbox, pendingCoinDelta, readOutbox } from '../lib/outbox';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

const PROFILE_COLUMNS = 'id, display_name, coins, current_streak, updated_at';

function toSafeProfile(row: Profile | null): Profile | null {
  if (!row) return null;
  return {
    ...row,
    coins: Number.isFinite(row.coins) ? row.coins : 0,
    current_streak: Number.isFinite(row.current_streak) ? row.current_streak : 0
  };
}

/** Last known profile, so the app still shows real coins when it opens offline. */
function readCachedProfile(userId: string): Profile | null {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, 'profile-cache'));
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}
function writeCachedProfile(userId: string, profile: Profile) {
  try {
    window.localStorage.setItem(storageKeyFor(userId, 'profile-cache'), JSON.stringify(profile));
  } catch {
    // Ignore storage failures.
  }
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The latest coin balance, updated synchronously so rapid changes stack
  // instead of overwriting each other.
  const coinsRef = useRef(0);

  const applyProfile = useCallback(
    (next: Profile) => {
      coinsRef.current = next.coins;
      setProfile(next);
      if (user) writeCachedProfile(user.id, next);
    },
    [user]
  );

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      // Offline or server trouble: keep showing the last known balance.
      setError(fetchError.message);
      const cached = readCachedProfile(user.id);
      if (cached) {
        applyProfile({ ...cached, coins: Math.max(0, cached.coins) });
      }
      setLoading(false);
      return;
    }

    const safe = toSafeProfile(data as Profile | null);
    if (safe) {
      // Coins earned or spent offline are still on their way to the server.
      applyProfile({ ...safe, coins: Math.max(0, safe.coins + pendingCoinDelta(user.id)) });
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [user, applyProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const setCoins = useCallback(
    async (nextCoins: number | ((prev: number) => number)) => {
      if (!user) return;

      const previous = coinsRef.current;
      const resolved = typeof nextCoins === 'function' ? nextCoins(previous) : nextCoins;
      const safeCoins = Math.max(0, Math.floor(resolved));
      const delta = safeCoins - previous;
      if (delta === 0) return;

      const base: Profile = profile ?? {
        id: user.id,
        display_name: null,
        coins: 0,
        current_streak: 0,
        updated_at: new Date().toISOString()
      };
      applyProfile({ ...base, coins: safeCoins });

      // If anything is already waiting to sync, queue this change behind it
      // (writing an absolute balance now would double-count the queued coins).
      if (readOutbox(user.id).length > 0) {
        enqueue(user.id, { kind: 'coins', delta });
        void flushOutbox(user.id);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: safeCoins })
        .eq('id', user.id);

      if (updateError) {
        // Keep the coins; send the change when the connection is back.
        enqueue(user.id, { kind: 'coins', delta });
      }
    },
    [user, profile, applyProfile]
  );

  return {
    profile,
    coins: profile?.coins ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    loading,
    error,
    refetch: fetchProfile,
    setCoins
  };
}
