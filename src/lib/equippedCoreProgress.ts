import { isCoreExerciseId } from '../components/moves';
import {
  fetchEquippedLineup,
  saveEquippedLineup
} from './lineupEquipProgress';

/** @deprecated Use fetchEquippedLineup(userId, 'core') */
export async function fetchEquippedCore(userId: string) {
  return fetchEquippedLineup(userId, 'core');
}

/** @deprecated Use saveEquippedLineup(userId, 'core', ids) */
export async function saveEquippedCore(userId: string, ids: string[]) {
  return saveEquippedLineup(
    userId,
    'core',
    ids.filter(isCoreExerciseId)
  );
}
