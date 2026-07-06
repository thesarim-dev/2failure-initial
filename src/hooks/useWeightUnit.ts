import { useCallback, useState } from 'react';
import type { WeightUnit } from '../lib/weightUnits';
import { useAuth } from '../context/AuthContext';
import { storageKeyFor } from '../lib/persistedSettings';

function defaultWeightUnit(): WeightUnit {
  // New users default to kg per requirements.
  return 'kg';
}

function readStoredUnit(key: string): WeightUnit {
  if (typeof window === 'undefined') return 'kg';

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === 'kg' || raw === 'lb') return raw;
  } catch {
    // Ignore storage failures.
  }

  return defaultWeightUnit();
}

export function useWeightUnit() {
  const { user } = useAuth();
  const key = storageKeyFor(user?.id, 'weight-unit');

  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(() =>
    readStoredUnit(key)
  );

  const setWeightUnit = useCallback(
    (unit: WeightUnit) => {
      setWeightUnitState(unit);
      try {
        window.localStorage.setItem(key, unit);
      } catch {
        // Ignore storage failures.
      }
    },
    [key]
  );

  return { weightUnit, setWeightUnit };
}
