import { CORE_EQUIP_COUNT, isCoreExerciseId } from '../components/moves';
import { supabase } from './supabase';

type WorkoutEquipRow = {
  category_id: string;
  is_equipped: boolean;
  sort_order: number;
};

export async function fetchEquippedCore(
  userId: string
): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('user_workouts')
    .select('category_id, is_equipped, sort_order')
    .eq('user_id', userId);

  if (error) throw error;

  const equipped = ((data ?? []) as WorkoutEquipRow[])
    .filter((row) => isCoreExerciseId(row.category_id) && row.is_equipped)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => row.category_id);

  if (equipped.length === 0 || equipped.length > CORE_EQUIP_COUNT) {
    return null;
  }

  return equipped.slice(0, CORE_EQUIP_COUNT);
}

export async function saveEquippedCore(
  userId: string,
  ids: string[]
): Promise<void> {
  const equippedIds = ids.filter(isCoreExerciseId).slice(0, CORE_EQUIP_COUNT);
  const equippedSet = new Set(equippedIds);

  const { data, error } = await supabase
    .from('user_workouts')
    .select('category_id')
    .eq('user_id', userId);

  if (error) throw error;

  const coreRows = ((data ?? []) as { category_id: string }[]).filter((row) =>
    isCoreExerciseId(row.category_id)
  );

  const results = await Promise.all(
    coreRows.map((row) =>
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
