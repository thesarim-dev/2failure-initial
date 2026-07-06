export const COIN_EARNING_CAP_SECONDS = 120;

const COIN_REWARD_MAX_BY_TIER = {
  BASE: 10,
  PRO: 20,
  ELITE: 30
} as const;

export type CoinRewardTier = keyof typeof COIN_REWARD_MAX_BY_TIER;

export function calculateCoinsEarned(
  durationSeconds: number,
  tier: CoinRewardTier = 'BASE'
): number {
  const safeDuration = Math.max(0, durationSeconds);
  if (safeDuration === 0) return 0;

  const earningDuration = Math.min(safeDuration, COIN_EARNING_CAP_SECONDS);
  const maxPoints = COIN_REWARD_MAX_BY_TIER[tier] ?? COIN_REWARD_MAX_BY_TIER.BASE;

  return Math.min(maxPoints, Math.ceil((earningDuration / COIN_EARNING_CAP_SECONDS) * maxPoints));
}

export function isCoinEarningCapped(durationSeconds: number): boolean {
  return durationSeconds > COIN_EARNING_CAP_SECONDS;
}
