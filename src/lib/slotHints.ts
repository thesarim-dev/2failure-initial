import { toLocalDateString } from './userStats';

/**
 * Which plan slot each of today's sets was logged for, kept on this device
 * (per user, per day). Lets slot progress follow an exercise switch exactly;
 * without it (another device), the plan's ladder rule decides.
 */
type Hints = Record<string, Record<string, number>>;

const keyFor = (userId: string) => `2failure-user-${userId}-slot-sets-${toLocalDateString()}`;

export function readSlotHints(userId: string | undefined): Hints {
  if (!userId) return {};
  try {
    return JSON.parse(window.localStorage.getItem(keyFor(userId)) ?? '{}') as Hints;
  } catch {
    return {};
  }
}

export function addSlotHint(userId: string | undefined, exerciseId: string, slotKey: string): void {
  if (!userId) return;
  const hints = readSlotHints(userId);
  hints[exerciseId] = { ...(hints[exerciseId] ?? {}), [slotKey]: (hints[exerciseId]?.[slotKey] ?? 0) + 1 };
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(hints));
  } catch {
    // Storage full or blocked: the ladder rule still attributes the set.
  }
}
