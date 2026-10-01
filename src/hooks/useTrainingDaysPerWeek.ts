import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageKeyFor } from '../lib/persistedSettings';

/**
 * How many days a week a player without the rotating program plans to train.
 * The rest of the week is planned rest, which keeps the streak alive.
 */
export const TRAINING_DAY_OPTIONS = [4, 5, 6] as const;
export type TrainingDaysPerWeek = (typeof TRAINING_DAY_OPTIONS)[number];
export const DEFAULT_TRAINING_DAYS: TrainingDaysPerWeek = 4;

function readStored(key: string): TrainingDaysPerWeek {
  try {
    const value = Number(window.localStorage.getItem(key));
    if ((TRAINING_DAY_OPTIONS as readonly number[]).includes(value)) {
      return value as TrainingDaysPerWeek;
    }
  } catch {
    // Ignore storage failures.
  }
  return DEFAULT_TRAINING_DAYS;
}

export function useTrainingDaysPerWeek() {
  const { user } = useAuth();
  const key = storageKeyFor(user?.id, 'training-days-per-week');
  const [trainingDaysPerWeek, setState] = useState<TrainingDaysPerWeek>(() => readStored(key));

  const setTrainingDaysPerWeek = useCallback(
    (days: TrainingDaysPerWeek) => {
      setState(days);
      try {
        window.localStorage.setItem(key, String(days));
      } catch {
        // Ignore storage failures.
      }
    },
    [key]
  );

  return { trainingDaysPerWeek, setTrainingDaysPerWeek };
}
