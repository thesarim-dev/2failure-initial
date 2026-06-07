import {
  DEFAULT_LINEUP,
  LINEUP_EQUIP_COUNT,
  LineupSlot,
  getLineupSlot,
  hasBalancedUpperSelection,
  isCoreExerciseId,
  isLowerExerciseId,
  isUpperExerciseId
} from '../components/moves';
import { supabase } from './supabase';

type WorkoutEquipRow = {
  category_id: string;
  is_equipped: boolean;
  sort_order: number;
};

function isSlotExerciseId(id: string, slot: LineupSlot): boolean {
  switch (slot) {
    case 'upper':
      return isUpperExerciseId(id);
    case 'lower':
      return isLowerExerciseId(id);
    case 'core':
      return isCoreExerciseId(id);
  }
}

export async function fetchEquippedLineup(
  userId: string,
  slot: LineupSlot
): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('user_workouts')
    .select('category_id, is_equipped, sort_order')
    .eq('user_id', userId);

  if (error) throw error;

  const equipped = ((data ?? []) as WorkoutEquipRow[])
    .filter(
      (row) =>
        isSlotExerciseId(row.category_id, slot) && row.is_equipped
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => row.category_id);

  if (equipped.length === 0 || equipped.length > LINEUP_EQUIP_COUNT) {
    return null;
  }

  const lineup = equipped.slice(0, LINEUP_EQUIP_COUNT);

  if (slot === 'upper' && !hasBalancedUpperSelection(lineup)) {
    return [...DEFAULT_LINEUP.upper];
  }

  const defaults = DEFAULT_LINEUP[slot];
  const hasInvalidId = lineup.some((id) => getLineupSlot(id) !== slot);
  if (hasInvalidId) {
    return [...defaults];
  }

  return lineup;
}

export async function saveEquippedLineup(
  userId: string,
  slot: LineupSlot,
  ids: string[]
): Promise<void> {
  const equippedIds = ids
    .filter((id) => getLineupSlot(id) === slot)
    .slice(0, LINEUP_EQUIP_COUNT);
  const equippedSet = new Set(equippedIds);

  const { data, error } = await supabase
    .from('user_workouts')
    .select('category_id')
    .eq('user_id', userId);

  if (error) throw error;

  const slotRows = ((data ?? []) as { category_id: string }[]).filter((row) =>
    isSlotExerciseId(row.category_id, slot)
  );

  const results = await Promise.all(
    slotRows.map((row) =>
      supabase
        .from('user_workouts')
        .update({ is_equipped: equippedSet.has(row.category_id) })
        .eq('user_id', userId)
        .eq('category_id', row.category_id)
    )
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
