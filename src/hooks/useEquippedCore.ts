import { useCallback, useState } from 'react';
import {
  CORE_EQUIP_COUNT,
  CORE_STORE_CATEGORY,
  DEFAULT_EQUIPPED_CORE,
  isCoreExerciseId
} from '../components/moves';

const STORAGE_KEY = '2failure-equipped-core';

/** Filter valid owned core IDs and cap count. Does not auto-fill slots. */
export function sanitizeEquippedCore(
  ids: string[],
  ownedIds?: string[]
): string[] {
  const ownedSet = ownedIds ? new Set(ownedIds) : null;
  return [
    ...new Set(
      ids.filter(
        (id) =>
          isCoreExerciseId(id) && (ownedSet === null || ownedSet.has(id))
      )
    )
  ].slice(0, CORE_EQUIP_COUNT);
}

/** Fill missing slots for first load / empty storage only. */
export function resolveEquippedCore(
  ids: string[],
  ownedIds?: string[]
): string[] {
  const sanitized = sanitizeEquippedCore(ids, ownedIds);
  if (sanitized.length >= CORE_EQUIP_COUNT) {
    return sanitized;
  }

  const ownedSet = ownedIds ? new Set(ownedIds) : null;
  const padded = [...sanitized];
  for (const variant of CORE_STORE_CATEGORY.variants) {
    if (padded.includes(variant.id)) continue;
    if (ownedSet && !ownedSet.has(variant.id)) continue;
    padded.push(variant.id);
    if (padded.length >= CORE_EQUIP_COUNT) break;
  }

  if (padded.length >= CORE_EQUIP_COUNT) {
    return padded.slice(0, CORE_EQUIP_COUNT);
  }

  for (const id of DEFAULT_EQUIPPED_CORE) {
    if (padded.includes(id)) continue;
    if (ownedSet && !ownedSet.has(id)) continue;
    padded.push(id);
    if (padded.length >= CORE_EQUIP_COUNT) break;
  }

  return padded.slice(0, CORE_EQUIP_COUNT);
}

/** @deprecated Use sanitizeEquippedCore or resolveEquippedCore explicitly. */
export function normalizeEquippedCore(
  ids: string[],
  ownedIds?: string[]
): string[] {
  return sanitizeEquippedCore(ids, ownedIds);
}

function readStoredEquipped(): string[] {
  if (typeof window === 'undefined') {
    return [...DEFAULT_EQUIPPED_CORE];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_EQUIPPED_CORE];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_EQUIPPED_CORE];
    return resolveEquippedCore(
      parsed.filter((id) => typeof id === 'string')
    );
  } catch {
    return [...DEFAULT_EQUIPPED_CORE];
  }
}

export function useEquippedCore() {
  const [equippedCore, setEquippedCore] = useState<string[]>(readStoredEquipped);

  const persist = useCallback((next: string[]) => {
    const normalized = sanitizeEquippedCore(next);
    setEquippedCore(normalized);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore storage failures.
    }
    return normalized;
  }, []);

  const toggleEquipCore = useCallback(
    (exerciseId: string) => {
      if (!isCoreExerciseId(exerciseId)) return equippedCore;

      if (equippedCore.includes(exerciseId)) {
        return persist(equippedCore.filter((id) => id !== exerciseId));
      }

      if (equippedCore.length >= CORE_EQUIP_COUNT) {
        return equippedCore;
      }

      return persist([...equippedCore, exerciseId]);
    },
    [equippedCore, persist]
  );

  return { equippedCore, toggleEquipCore, setEquippedCore: persist };
}
