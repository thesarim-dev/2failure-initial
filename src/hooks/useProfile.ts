import { useCallback, useEffect, useState } from 'react';
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

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(fetchError.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(toSafeProfile(data as Profile | null));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const setCoins = useCallback(
    async (nextCoins: number | ((prev: number) => number)) => {
      if (!user) return;

      const resolved =
        typeof nextCoins === 'function' ?
        nextCoins(profile?.coins ?? 0) :
        nextCoins;

      const safeCoins = Math.max(0, Math.floor(resolved));

      setProfile((prev) =>
      prev ?
      { ...prev, coins: safeCoins } :
      {
        id: user.id,
        display_name: null,
        coins: safeCoins,
        current_streak: 0,
        updated_at: new Date().toISOString()
      }
      );

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: safeCoins })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        await fetchProfile();
      }
    },
    [user, profile?.coins, fetchProfile]
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
