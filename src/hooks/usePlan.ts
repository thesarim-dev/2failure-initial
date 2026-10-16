import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageKeyFor } from '../lib/persistedSettings';
import { ALL_GEAR, type Gear } from '../lib/plan';

/** The player's equipment and chosen exercise level per slot (saved on this device). */
export function usePlan() {
  const { user } = useAuth();
  const userId = user?.id;
  const [gear, setGearState] = useState<Gear[]>([]);
  const [levels, setLevels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userId) return;
    try {
      const g = JSON.parse(window.localStorage.getItem(storageKeyFor(userId, 'plan-gear')) ?? '[]') as Gear[];
      setGearState(g.filter((item) => ALL_GEAR.includes(item)));
      setLevels(JSON.parse(window.localStorage.getItem(storageKeyFor(userId, 'plan-levels')) ?? '{}'));
    } catch {
      setGearState([]);
      setLevels({});
    }
  }, [userId]);

  const save = (key: string, value: unknown) => {
    if (!userId) return;
    try {
      window.localStorage.setItem(storageKeyFor(userId, key), JSON.stringify(value));
    } catch {
      // Ignore storage failures.
    }
  };

  const toggleGear = useCallback(
    (item: Gear) => {
      setGearState((prev) => {
        const next = prev.includes(item) ? prev.filter((g) => g !== item) : [...prev, item];
        save('plan-gear', next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  const setLevel = useCallback(
    (slotKey: string, exerciseId: string) => {
      setLevels((prev) => {
        const next = { ...prev, [slotKey]: exerciseId };
        save('plan-levels', next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  return { gear, levels, toggleGear, setLevel };
}
