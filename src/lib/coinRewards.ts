export const COIN_EARNING_CAP_SECONDS = 120;

export function calculateCoinsEarned(durationSeconds: number): number {
  const safeDuration = Math.max(0, durationSeconds);
  const earningDuration = Math.min(safeDuration, COIN_EARNING_CAP_SECONDS);
  return Math.max(10, Math.floor(earningDuration / 2));
}

export function isCoinEarningCapped(durationSeconds: number): boolean {
  return durationSeconds > COIN_EARNING_CAP_SECONDS;
}
