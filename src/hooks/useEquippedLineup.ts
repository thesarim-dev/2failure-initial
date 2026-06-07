import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_EQUIPPED_CORE,
  DEFAULT_EQUIPPED_LOWER,
  DEFAULT_EQUIPPED_UPPER,
  LINEUP_EQUIP_COUNT,
  LineupSlot,
  canEquipUpperExercise,
  hasBalancedUpperSelection,
  isCoreExerciseId,
  isLowerExerciseId,
  isUpperExerciseId
} from '../components/moves';
import {
  fetchEquippedLineup,
  saveEquippedLineup
} from '../lib/lineupEquipProgress';

const STORAGE_KEYS: Record<LineupSlot, string> = {
  upper: '2failure-equipped-upper',
  lower: '2failure-equipped-lower',
  core: '2failure-equipped-core'
};

const DEFAULTS: Record<LineupSlot, readonly string[]> = {
  upper: DEFAULT_EQUIPPED_UPPER,
  lower: DEFAULT_EQUIPPED_LOWER,
  core: DEFAULT_EQUIPPED_CORE
};

const LEGACY_LINEUP_IDS: Record<string, string> = {
  'pull-ups': 'superman-pulls',
  'inverted-rows': 'inverted-floor-rows',
  'chin-ups': 'doorway-rows',
  'archer-pull-ups': 'superman-pulls',
  'archer-pushups': 'diamond-pushups'
};

function remapLegacyLineupIds(ids: string[]): string[] {
  return ids.map((id) => LEGACY_LINEUP_IDS[id] ?? id);
}

function isDefaultLineup(slot: LineupSlot, ids: string[]): boolean {
  const defaults = DEFAULTS[slot];
  return (
    ids.length === defaults.length &&
    defaults.every((id) => ids.includes(id))
  );
}

function resolveLineupForSlot(slot: LineupSlot, ids: string[]): string[] {
  const sanitized = sanitizeEquippedSlot(slot, remapLegacyLineupIds(ids));

  if (sanitized.length === 0) {
    return [...DEFAULTS[slot]];
  }

  if (slot === 'upper') {
    if (sanitized.length === LINEUP_EQUIP_COUNT && hasBalancedUpperSelection(sanitized)) {
      return sanitized;
    }

    if (sanitized.length < LINEUP_EQUIP_COUNT) {
      const padded = [...sanitized];
      for (const id of DEFAULTS.upper) {
        if (!padded.includes(id)) padded.push(id);
        if (padded.length >= LINEUP_EQUIP_COUNT) break;
      }
      return sanitizeEquippedSlot(slot, padded);
    }
  }

  if (sanitized.length < LINEUP_EQUIP_COUNT && isDefaultLineup(slot, sanitized)) {
    return [...DEFAULTS[slot]];
  }

  return sanitized;
}

function isSlotId(slot: LineupSlot, id: string): boolean {
  switch (slot) {
    case 'upper':
      return isUpperExerciseId(id);
    case 'lower':
      return isLowerExerciseId(id);
    case 'core':
      return isCoreExerciseId(id);
  }
}

export function sanitizeEquippedSlot(slot: LineupSlot, ids: string[]): string[] {
  return [
    ...new Set(ids.filter((id) => isSlotId(slot, id)))
  ].slice(0, LINEUP_EQUIP_COUNT);
}

function writeStored(slot: LineupSlot, ids: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEYS[slot], JSON.stringify(ids));
  } catch {
    // Ignore storage failures.
  }
}

function readStored(slot: LineupSlot): string[] {
  const fallback = [...DEFAULTS[slot]];

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[slot]);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;

    return resolveLineupForSlot(
      slot,
      parsed.filter((id): id is string => typeof id === 'string')
    );
  } catch {
    return fallback;
  }
}

function useEquippedSlot(slot: LineupSlot, userId?: string | null) {
  const [equipped, setEquipped] = useState<string[]>(() => readStored(slot));

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const hydrate = async () => {
      try {
        const remote = await fetchEquippedLineup(userId, slot);
        if (cancelled) return;

        if (remote && remote.length > 0) {
          const normalized = resolveLineupForSlot(slot, remote);
          setEquipped(normalized);
          writeStored(slot, normalized);
          void saveEquippedLineup(userId, slot, normalized).catch(() => {});
        } else {
          const local = readStored(slot);
          setEquipped(local);
          void saveEquippedLineup(userId, slot, local).catch(() => {});
        }
      } catch {
        if (!cancelled) {
          setEquipped(readStored(slot));
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [slot, userId]);

  const persist = useCallback(
    (next: string[]) => {
      const normalized = sanitizeEquippedSlot(slot, next);
      setEquipped(normalized);
      writeStored(slot, normalized);

      if (userId) {
        void saveEquippedLineup(userId, slot, normalized).catch(() => {});
      }

      return normalized;
    },
    [slot, userId]
  );

  const toggle = useCallback(
    (exerciseId: string) => {
      if (!isSlotId(slot, exerciseId)) return equipped;

      if (equipped.includes(exerciseId)) {
        return persist(equipped.filter((id) => id !== exerciseId));
      }

      if (slot === 'upper' && !canEquipUpperExercise(equipped, exerciseId)) {
        return equipped;
      }

      if (equipped.length >= LINEUP_EQUIP_COUNT) {
        return equipped;
      }

      return persist([...equipped, exerciseId]);
    },
    [slot, equipped, persist]
  );

  return { equipped, toggle, setEquipped: persist };
}

export function useEquippedLineup(userId?: string | null) {
  const upper = useEquippedSlot('upper', userId);
  const lower = useEquippedSlot('lower', userId);
  const core = useEquippedSlot('core', userId);

  return {
    equippedUpper: upper.equipped,
    equippedLower: lower.equipped,
    equippedCore: core.equipped,
    toggleEquipUpper: upper.toggle,
    toggleEquipLower: lower.toggle,
    toggleEquipCore: core.toggle
  };
}
