import { RECOVERY_STORE_CATEGORY, STORE_CATEGORIES } from '../components/moves';

import { storageKeyFor } from './persistedSettings';
import { hasSeenOnboarding } from './onboarding';

const STORAGE_KEY_BASE = 'owned-variants';

const PROGRAM_VARIANT_IDS = [
  ...STORE_CATEGORIES.flatMap((cat) => cat.variants.map((v) => v.id)),
  ...RECOVERY_STORE_CATEGORY.variants.map((v) => v.id)
];

export const DEFAULT_OWNED = [
  ...STORE_CATEGORIES.flatMap((cat) =>
    cat.variants.filter((variant) => variant.price === 0).map((variant) => variant.id)
  ),
  ...RECOVERY_STORE_CATEGORY.variants.map((variant) => variant.id)
];

const ALL_VARIANT_IDS = new Set(PROGRAM_VARIANT_IDS);

/**
 * These were free before the anywhere-training catalogue and now cost coins.
 * Players who joined before the change keep them.
 */
const LEGACY_FREE_IDS = ['dips', 'pull-ups', 'burpees', 'l-sit', 'leg-raises'];
const CATALOG_MIGRATION_KEY = 'catalog-v2';

function migrateOwnedForCatalogV2(userId?: string | null): void {
  if (!userId) return;
  const markerKey = storageKeyFor(userId, CATALOG_MIGRATION_KEY);
  if (window.localStorage.getItem(markerKey)) return;
  window.localStorage.setItem(markerKey, '1');
  // Onboarding already seen on first load means this player predates the change.
  if (!hasSeenOnboarding(userId)) return;

  const key = storageKeyFor(userId, STORAGE_KEY_BASE);
  let stored: unknown = [];
  try {
    stored = JSON.parse(window.localStorage.getItem(key) ?? '[]');
  } catch {
    stored = [];
  }
  const ids = Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [];
  window.localStorage.setItem(key, JSON.stringify([...new Set([...ids, ...LEGACY_FREE_IDS])]));
}

export function readStoredOwned(userId?: string | null): string[] {
  const merged = new Set(DEFAULT_OWNED);

  if (typeof window === 'undefined') {
    return [...merged];
  }

  try {
    migrateOwnedForCatalogV2(userId);
    const key = storageKeyFor(userId ?? undefined, STORAGE_KEY_BASE);
    const raw = window.localStorage.getItem(key);
    if (!raw) return [...merged];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...merged];

    for (const id of parsed) {
      if (typeof id === 'string' && ALL_VARIANT_IDS.has(id)) {
        merged.add(id);
      }
    }
  } catch {
    // Ignore storage failures.
  }

  return [...merged];
}

export function persistOwned(ids: string[], userId?: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    const unique = [...new Set(ids.filter((id) => ALL_VARIANT_IDS.has(id)))];
    const key = storageKeyFor(userId ?? undefined, STORAGE_KEY_BASE);
    window.localStorage.setItem(key, JSON.stringify(unique));
  } catch {
    // Ignore storage failures.
  }
}
