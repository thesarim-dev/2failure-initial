import { useCallback, useMemo, useState } from 'react';
import {
  getRotatingProgramCycleDay,
  getRotatingProgramDayIndex,
  getRotatingProgramPhase,
  type RotatingProgramPhase
} from '../lib/rotatingProgram';
import { toLocalDateString } from '../lib/userStats';

const ENABLED_KEY = '2failure-rotating-program-enabled';
const START_DATE_KEY = '2failure-rotating-program-start-date';
const DAY_OFFSET_KEY = '2failure-rotating-program-day-offset';

function readStoredDayOffset(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const raw = window.localStorage.getItem(DAY_OFFSET_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeStoredDayOffset(offset: number): void {
  if (typeof window === 'undefined') return;

  try {
    if (offset <= 0) {
      window.localStorage.removeItem(DAY_OFFSET_KEY);
    } else {
      window.localStorage.setItem(DAY_OFFSET_KEY, String(offset));
    }
  } catch {
    // Ignore storage failures.
  }
}

function clearStoredDayOffset(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(DAY_OFFSET_KEY);
  } catch {
    // Ignore storage failures.
  }
}

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

export function useRotatingProgram() {
  const [enabled, setEnabledState] = useState(readStoredEnabled);
  const [startDate, setStartDateState] = useState<string | null>(() => {
    const stored = readStoredStartDate();
    if (readStoredEnabled() && !stored) {
      const today = toLocalDateString();
      writeStoredStartDate(today);
      return today;
    }
    return stored;
  });

  const [programDayOffset, setProgramDayOffsetState] = useState(readStoredDayOffset);

  const setRotatingProgramEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    writeStoredEnabled(next);

    if (next) {
      const today = toLocalDateString();
      setStartDateState(today);
      writeStoredStartDate(today);
      setProgramDayOffsetState(0);
      clearStoredDayOffset();
      return;
    }

    setStartDateState(null);
    clearStoredStartDate();
    setProgramDayOffsetState(0);
    clearStoredDayOffset();
  }, []);

  const calendarDayIndex = useMemo(() => {
    if (!enabled || !startDate) return null;
    return getRotatingProgramDayIndex(startDate);
  }, [enabled, startDate]);

  const effectiveDayIndex = useMemo(() => {
    if (calendarDayIndex === null) return null;
    return calendarDayIndex + programDayOffset;
  }, [calendarDayIndex, programDayOffset]);

  const phase = useMemo((): RotatingProgramPhase | null => {
    if (effectiveDayIndex === null) return null;
    return getRotatingProgramPhase(effectiveDayIndex);
  }, [effectiveDayIndex]);

  const cycleDay = useMemo(() => {
    if (effectiveDayIndex === null) return null;
    return getRotatingProgramCycleDay(effectiveDayIndex);
  }, [effectiveDayIndex]);

  const canGoPreviousProgramDay =
    effectiveDayIndex !== null && effectiveDayIndex > 0;

  const shiftProgramDay = useCallback((delta: -1 | 1) => {
    setProgramDayOffsetState((current) => {
      const base = calendarDayIndex ?? 0;
      const nextEffective = Math.max(0, base + current + delta);
      const nextOffset = nextEffective - base;
      writeStoredDayOffset(nextOffset);
      return nextOffset;
    });
  }, [calendarDayIndex]);

  return {
    rotatingProgramEnabled: enabled,
    setRotatingProgramEnabled,
    rotatingProgramPhase: phase,
    rotatingProgramCycleDay: cycleDay,
    canGoPreviousProgramDay,
    shiftProgramDay
  };
}
