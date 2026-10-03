/**
 * Coins per finished set. Every real set pays a solid base, with a little
 * extra for effort (longer sets) and for harder moves, so a typical set earns
 * about 25–30 coins — enough to both upgrade the base and buy new exercises.
 * Sets under MIN seconds pay nothing (no tap-farming).
 */
export const COIN_EARNING_CAP_SECONDS = 120;

const MIN_SET_SECONDS = 10;
const BASE_COINS = 20;
const EFFORT_BONUS_MAX = 10;
/** Seconds at which the effort bonus is full. */
const EFFORT_FULL_SECONDS = 60;

const TIER_BONUS = {
  BASE: 0,
  PRO: 5,
  ELITE: 10
} as const;

export type CoinRewardTier = keyof typeof TIER_BONUS;

export function calculateCoinsEarned(durationSeconds: number, tier: CoinRewardTier = 'BASE'): number {
  const seconds = Math.max(0, durationSeconds);
  if (seconds < MIN_SET_SECONDS) return 0;
  const effort = Math.round(EFFORT_BONUS_MAX * Math.min(1, seconds / EFFORT_FULL_SECONDS));
  return BASE_COINS + effort + (TIER_BONUS[tier] ?? 0);
}

export function isCoinEarningCapped(durationSeconds: number): boolean {
  return durationSeconds > COIN_EARNING_CAP_SECONDS;
}
