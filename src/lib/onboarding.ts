const STORAGE_PREFIX = '2failure-onboarding-seen';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function hasSeenOnboarding(userId: string): boolean {
  if (typeof window === 'undefined') return true;

  try {
    return window.localStorage.getItem(storageKey(userId)) === 'true';
  } catch {
    return true;
  }
}

export function markOnboardingSeen(userId: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey(userId), 'true');
  } catch {
    // Ignore storage failures.
  }
}
