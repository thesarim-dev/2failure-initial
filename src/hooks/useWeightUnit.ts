import { useCallback, useState } from 'react';
import type { WeightUnit } from '../lib/weightUnits';

const STORAGE_KEY = '2failure-weight-unit';

function defaultWeightUnit(): WeightUnit {
  if (typeof window === 'undefined') return 'kg';

  try {
    const locale = navigator.language;
    if (locale === 'en-US' || locale.startsWith('en-US')) return 'lb';
  } catch {
    // Ignore locale read failures.
  }

  return 'kg';
}

function readStoredUnit(): WeightUnit {
  if (typeof window === 'undefined') return 'kg';

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'kg' || raw === 'lb') return raw;
  } catch {
    // Ignore storage failures.
  }

  return defaultWeightUnit();
}

export function useWeightUnit() {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(readStoredUnit);

  const setWeightUnit = useCallback((unit: WeightUnit) => {
    setWeightUnitState(unit);
    try {
      window.localStorage.setItem(STORAGE_KEY, unit);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  return { weightUnit, setWeightUnit };
}
