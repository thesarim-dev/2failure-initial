import { useCallback, useMemo, useState } from 'react';
import {
  daysBetweenLocalDates,
  getRotatingProgramCycleDay,
  getRotatingProgramDayIndex,
  getRotatingProgramPhase,
  ROTATION_CYCLE_LENGTH,
  type RotatingProgramPhase
} from '../lib/rotatingProgram';
import { toLocalDateString } from '../lib/userStats';
import { useAuth } from '../context/AuthContext';
import { storageKeyFor } from '../lib/persistedSettings';

// Per-user keys to avoid leaking settings between accounts.

export function useRotatingProgram() {
  const today = toLocalDateString();
  const { user } = useAuth();
  const userId = user?.id;

  const ENABLED_KEY = storageKeyFor(userId, 'rotating-program-enabled');
  const START_DATE_KEY = storageKeyFor(userId, 'rotating-program-start-date');
  const EFFECTIVE_INDEX_KEY = storageKeyFor(userId, 'rotating-program-effective-index');
  const EFFECTIVE_DATE_KEY = storageKeyFor(userId, 'rotating-program-effective-date');
  /** @deprecated migrated to effective index + date */
  const LEGACY_OFFSET_KEY = storageKeyFor(userId, 'rotating-program-day-offset');

  function readStoredEnabled(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      return window.localStorage.getItem(ENABLED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function readStoredStartDate(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(START_DATE_KEY);
      return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    } catch {
      return null;
    }
  }

  function readStoredEffectiveIndex(): number | null {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(EFFECTIVE_INDEX_KEY);
      if (!raw) return null;
      const parsed = Number.parseInt(raw, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    } catch {
      return null;
    }
  }

  function readStoredEffectiveDate(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(EFFECTIVE_DATE_KEY);
      return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    } catch {
      return null;
    }
  }

  function readLegacyDayOffset(): number {
    if (typeof window === 'undefined') return 0;

    try {
      const raw = window.localStorage.getItem(LEGACY_OFFSET_KEY);
      if (!raw) return 0;
      const parsed = Number.parseInt(raw, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  function writeStoredEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;

    try {
      if (enabled) {
        window.localStorage.setItem(ENABLED_KEY, 'true');
      } else {
        window.localStorage.removeItem(ENABLED_KEY);
      }
    } catch {
      // Ignore storage failures.
    }
  }

  function writeStoredStartDate(date: string): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(START_DATE_KEY, date);
    } catch {
      // Ignore storage failures.
    }
  }

  function clearStoredStartDate(): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.removeItem(START_DATE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  function writeStoredEffectivePosition(index: number, date: string): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(EFFECTIVE_INDEX_KEY, String(index));
      window.localStorage.setItem(EFFECTIVE_DATE_KEY, date);
      window.localStorage.removeItem(LEGACY_OFFSET_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  function clearStoredEffectivePosition(): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.removeItem(EFFECTIVE_INDEX_KEY);
      window.localStorage.removeItem(EFFECTIVE_DATE_KEY);
      window.localStorage.removeItem(LEGACY_OFFSET_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  function resolveInitialEffectivePosition(
    startDate: string,
    today = toLocalDateString()
  ): { index: number; date: string } {
    const storedIndex = readStoredEffectiveIndex();
    const storedDate = readStoredEffectiveDate();

    if (storedIndex !== null && storedDate !== null) {
      const elapsed = Math.max(0, daysBetweenLocalDates(storedDate, today));
      return {
        index: Math.max(0, storedIndex + elapsed),
        date: today
      };
    }

    const legacyOffset = readLegacyDayOffset();
    const calendarIndex = getRotatingProgramDayIndex(startDate, today);
    const index = Math.max(0, calendarIndex + legacyOffset);

    return { index, date: today };
  }

  const [enabled, setEnabledState] = useState(readStoredEnabled);
  const [startDate, setStartDateState] = useState<string | null>(() => {
    const stored = readStoredStartDate();
    if (readStoredEnabled() && !stored) {
      const anchor = today;
      writeStoredStartDate(anchor);
      return anchor;
    }
    return stored;
  });

  const [savedPosition, setSavedPositionState] = useState<{
    index: number;
    date: string;
  } | null>(() => {
    if (!readStoredEnabled() || !readStoredStartDate()) return null;
    return resolveInitialEffectivePosition(readStoredStartDate()!, today);
  });

  const setRotatingProgramEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      writeStoredEnabled(next);

      if (next) {
        const anchor = toLocalDateString();
        setStartDateState(anchor);
        writeStoredStartDate(anchor);
        const position = { index: 0, date: anchor };
        setSavedPositionState(position);
        writeStoredEffectivePosition(0, anchor);
        return;
      }

      setStartDateState(null);
      setSavedPositionState(null);
      clearStoredStartDate();
      clearStoredEffectivePosition();
    },
    []
  );

  const effectiveDayIndex = useMemo(() => {
    if (!enabled || !startDate) return null;

    if (savedPosition) {
      const elapsed = Math.max(0, daysBetweenLocalDates(savedPosition.date, today));
      return Math.max(0, savedPosition.index + elapsed);
    }

    return getRotatingProgramDayIndex(startDate, today);
  }, [enabled, startDate, savedPosition, today]);

  const phase = useMemo((): RotatingProgramPhase | null => {
    if (effectiveDayIndex === null) return null;
    return getRotatingProgramPhase(effectiveDayIndex);
  }, [effectiveDayIndex]);

  const cycleDay = useMemo(() => {
    if (effectiveDayIndex === null) return null;
    return getRotatingProgramCycleDay(effectiveDayIndex);
  }, [effectiveDayIndex]);

  const selectProgramCycleDay = useCallback(
    (targetCycleDay: number) => {
      if (effectiveDayIndex === null) return;

      const currentNorm =
        ((effectiveDayIndex % ROTATION_CYCLE_LENGTH) + ROTATION_CYCLE_LENGTH) %
        ROTATION_CYCLE_LENGTH;
      const targetNorm = targetCycleDay - 1;
      const delta = targetNorm - currentNorm;
      const nextIndex = Math.max(0, effectiveDayIndex + delta);
      const anchor = toLocalDateString();

      setSavedPositionState({ index: nextIndex, date: anchor });
      writeStoredEffectivePosition(nextIndex, anchor);
    },
    [effectiveDayIndex]
  );

  return {
    rotatingProgramEnabled: enabled,
    setRotatingProgramEnabled,
    rotatingProgramPhase: phase,
    rotatingProgramCycleDay: cycleDay,
    selectProgramCycleDay
  };
}
