import { useCallback, useEffect, useState } from 'react';
import {
  CORE_EQUIP_COUNT,
  CORE_STORE_CATEGORY,
  DEFAULT_EQUIPPED_CORE,
  isCoreExerciseId
} from '../components/moves';
import {
  fetchEquippedCore,
  saveEquippedCore
} from '../lib/equippedCoreProgress';

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

function writeStoredEquipped(ids: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage failures.
  }
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

    const sanitized = sanitizeEquippedCore(
      parsed.filter((id): id is string => typeof id === 'string')
    );
    return sanitized.length > 0 ? sanitized : [...DEFAULT_EQUIPPED_CORE];
  } catch {
    return [...DEFAULT_EQUIPPED_CORE];
  }
}

export function useEquippedCore(userId?: string | null) {
  const [equippedCore, setEquippedCore] = useState<string[]>(readStoredEquipped);
  const [ready, setReady] = useState(!userId);

  useEffect(() => {
    if (!userId) {
      setReady(true);
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      try {
        const remote = await fetchEquippedCore(userId);
        if (cancelled) return;

        if (remote && remote.length > 0) {
          const normalized = sanitizeEquippedCore(remote);
          setEquippedCore(normalized);
          writeStoredEquipped(normalized);
        } else {
          const local = readStoredEquipped();
          setEquippedCore(local);
          if (local.length > 0) {
            void saveEquippedCore(userId, local).catch(() => {});
          }
        }
      } catch {
        if (!cancelled) {
          setEquippedCore(readStoredEquipped());
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    (next: string[]) => {
      const normalized = sanitizeEquippedCore(next);
      setEquippedCore(normalized);
      writeStoredEquipped(normalized);

      if (userId) {
        void saveEquippedCore(userId, normalized).catch(() => {});
      }

      return normalized;
    },
    [userId]
  );

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

  return { equippedCore, toggleEquipCore, setEquippedCore: persist, ready };
}
