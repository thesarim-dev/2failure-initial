import { useCallback, useState } from 'react';
import {
  CORE_EQUIP_COUNT,
  CORE_STORE_CATEGORY,
  DEFAULT_EQUIPPED_CORE,
  isCoreExerciseId
} from '../components/moves';

const STORAGE_KEY = '2failure-equipped-core';

export function normalizeEquippedCore(
  ids: string[],
  ownedIds?: string[]
): string[] {
  const ownedSet = ownedIds ? new Set(ownedIds) : null;
  const unique = [
    ...new Set(
      ids.filter(
        (id) =>
          isCoreExerciseId(id) && (ownedSet === null || ownedSet.has(id))
      )
    )
  ];
  if (unique.length >= CORE_EQUIP_COUNT) {
    return unique.slice(0, CORE_EQUIP_COUNT);
  }

  const padded = [...unique];
  for (const variant of CORE_STORE_CATEGORY.variants) {
    if (padded.includes(variant.id)) continue;
    if (ownedSet && !ownedSet.has(variant.id)) continue;
    padded.push(variant.id);
    if (padded.length >= CORE_EQUIP_COUNT) break;
  }

  return padded.length >= CORE_EQUIP_COUNT
    ? padded.slice(0, CORE_EQUIP_COUNT)
    : [...DEFAULT_EQUIPPED_CORE];
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
    return normalizeEquippedCore(
      parsed.filter((id) => typeof id === 'string')
    );
  } catch {
    return [...DEFAULT_EQUIPPED_CORE];
  }
}

export function useEquippedCore() {
  const [equippedCore, setEquippedCore] = useState<string[]>(readStoredEquipped);

  const persist = useCallback((next: string[]) => {
    const normalized = normalizeEquippedCore(next);
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
