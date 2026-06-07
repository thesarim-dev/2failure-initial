import {
  CORE_STORE_CATEGORY,
  MOVE_CATEGORIES
} from '../components/moves';

const STORAGE_KEY = '2failure-owned-variants';

export const DEFAULT_OWNED = [
  ...MOVE_CATEGORIES.map((cat) => cat.variants[0].id),
  ...CORE_STORE_CATEGORY.variants
    .filter((variant) => variant.price === 0)
    .map((variant) => variant.id)
];

const ALL_VARIANT_IDS = new Set([
  ...MOVE_CATEGORIES.flatMap((cat) => cat.variants.map((v) => v.id)),
  ...CORE_STORE_CATEGORY.variants.map((v) => v.id)
]);

export function readStoredOwned(): string[] {
  const merged = new Set(DEFAULT_OWNED);

  if (typeof window === 'undefined') {
    return [...merged];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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

export function persistOwned(ids: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    const unique = [...new Set(ids.filter((id) => ALL_VARIANT_IDS.has(id)))];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // Ignore storage failures.
  }
}
