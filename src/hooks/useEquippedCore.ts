import { useEquippedLineup } from './useEquippedLineup';

/** @deprecated Use useEquippedLineup instead. */
export function useEquippedCore(userId?: string | null) {
  const { equippedCore, toggleEquipCore } = useEquippedLineup(userId);
  return {
    equippedCore,
    toggleEquipCore,
    setEquippedCore: () => equippedCore,
    ready: true
  };
}

export {
  sanitizeEquippedSlot as sanitizeEquippedCore
} from './useEquippedLineup';
