import { useCallback, useMemo, useState } from 'react';
import {
  daysBetweenLocalDates,
  DEFAULT_ROTATION_TEMPLATE,
  getMaxRestDaysPerWeek,
  getRotatingProgramCycleDay,
  getRotatingProgramDayIndex,
  getRotatingProgramPhase,
  ROTATION_TEMPLATES,
  type RotatingProgramPhase,
  type RotatingProgramTemplateId
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
  const REST_DAYS_KEY = storageKeyFor(userId, 'rotating-program-rest-days');
  const TEMPLATE_KEY = storageKeyFor(userId, 'rotating-program-template');
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
      // Negative values are valid: rest days can shift the index below zero.
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function readStoredRestDays(): string[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = window.localStorage.getItem(REST_DAYS_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (value): value is string =>
          typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      );
    } catch {
      return [];
    }
  }

  function writeStoredRestDays(days: string[]): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(REST_DAYS_KEY, JSON.stringify(days));
    } catch {
      // Ignore storage failures.
    }
  }

  function clearStoredRestDays(): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.removeItem(REST_DAYS_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  function readStoredTemplate(): RotatingProgramTemplateId {
    if (typeof window === 'undefined') return DEFAULT_ROTATION_TEMPLATE;

    try {
      const raw = window.localStorage.getItem(TEMPLATE_KEY);
      return raw && raw in ROTATION_TEMPLATES
        ? (raw as RotatingProgramTemplateId)
        : DEFAULT_ROTATION_TEMPLATE;
    } catch {
      return DEFAULT_ROTATION_TEMPLATE;
    }
  }

  function writeStoredTemplate(template: RotatingProgramTemplateId): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(TEMPLATE_KEY, template);
    } catch {
      // Ignore storage failures.
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
      // Keep the raw (possibly negative) index; display logic clamps to 0.
      return {
        index: storedIndex + elapsed,
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

  const [restDays, setRestDaysState] = useState<string[]>(readStoredRestDays);
  const [template, setTemplateState] =
    useState<RotatingProgramTemplateId>(readStoredTemplate);

  const rotationCycle = ROTATION_TEMPLATES[template];

  const setRotatingProgramTemplate = useCallback(
    (next: RotatingProgramTemplateId) => {
      setTemplateState(next);
      writeStoredTemplate(next);

      // Restart the cycle from day 1 so the new split begins cleanly.
      const anchor = toLocalDateString();
      setSavedPositionState({ index: 0, date: anchor });
      writeStoredEffectivePosition(0, anchor);
    },
    []
  );

  const setRotatingProgramEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      writeStoredEnabled(next);

      setRestDaysState([]);
      clearStoredRestDays();

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

  const rawDayIndex = useMemo(() => {
    if (!enabled || !startDate) return null;

    if (savedPosition) {
      const elapsed = Math.max(0, daysBetweenLocalDates(savedPosition.date, today));
      // May be negative after a rest day taken on cycle day 1.
      return savedPosition.index + elapsed;
    }

    return getRotatingProgramDayIndex(startDate, today);
  }, [enabled, startDate, savedPosition, today]);

  const effectiveDayIndex = useMemo(() => {
    if (rawDayIndex === null) return null;
    return Math.max(0, rawDayIndex);
  }, [rawDayIndex]);

  const isRestDayToday = enabled && restDays.includes(today);

  const restDaysUsedThisWeek = useMemo(
    () =>
      restDays.filter((day) => {
        const elapsed = daysBetweenLocalDates(day, today);
        return elapsed >= 0 && elapsed < 7;
      }).length,
    [restDays, today]
  );

  const maxRestDaysPerWeek = getMaxRestDaysPerWeek(rotationCycle);

  const canTakeRestDay =
    enabled && !isRestDayToday && restDaysUsedThisWeek < maxRestDaysPerWeek;

  const markTodayAsRestDay = useCallback(() => {
    if (!enabled || effectiveDayIndex === null) return;
    if (restDays.includes(today)) return;

    const usedThisWeek = restDays.filter((day) => {
      const elapsed = daysBetweenLocalDates(day, today);
      return elapsed >= 0 && elapsed < 7;
    }).length;
    if (usedThisWeek >= maxRestDaysPerWeek) return;

    // Drop entries older than the rolling window before adding today.
    const nextRestDays = [
      ...restDays.filter((day) => daysBetweenLocalDates(day, today) < 7),
      today
    ];
    setRestDaysState(nextRestDays);
    writeStoredRestDays(nextRestDays);

    // Freeze today's training day: store index - 1 so tomorrow advances to
    // the canceled workout (elapsed +1 brings it back to today's original index).
    const nextIndex = effectiveDayIndex - 1;
    setSavedPositionState({ index: nextIndex, date: today });
    writeStoredEffectivePosition(nextIndex, today);
  }, [enabled, effectiveDayIndex, restDays, today, maxRestDaysPerWeek]);

  const phase = useMemo((): RotatingProgramPhase | null => {
    if (effectiveDayIndex === null) return null;
    // A declared rest day creates the stretch plan for today.
    if (isRestDayToday) return 'recovery';
    return getRotatingProgramPhase(effectiveDayIndex, rotationCycle);
  }, [effectiveDayIndex, isRestDayToday, rotationCycle]);

  const cycleDay = useMemo(() => {
    if (effectiveDayIndex === null) return null;
    // On a rest day the carousel centers on REST; cycleDay stays the deferred
    // training day so side cards / dots can preview tomorrow's workouts.
    if (isRestDayToday && rawDayIndex !== null) {
      return getRotatingProgramCycleDay(rawDayIndex + 1, rotationCycle);
    }
    return getRotatingProgramCycleDay(effectiveDayIndex, rotationCycle);
  }, [effectiveDayIndex, isRestDayToday, rawDayIndex, rotationCycle]);

  const selectProgramCycleDay = useCallback(
    (targetCycleDay: number) => {
      // Don't jump days while today is locked as a player rest day.
      if (isRestDayToday || effectiveDayIndex === null) return;

      const length = rotationCycle.length;
      const currentNorm =
        ((effectiveDayIndex % length) + length) % length;
      const targetNorm = targetCycleDay - 1;
      const delta = targetNorm - currentNorm;
      const nextIndex = Math.max(0, effectiveDayIndex + delta);
      const anchor = toLocalDateString();

      setSavedPositionState({ index: nextIndex, date: anchor });
      writeStoredEffectivePosition(nextIndex, anchor);
    },
    [effectiveDayIndex, isRestDayToday, rotationCycle]
  );

  return {
    rotatingProgramEnabled: enabled,
    setRotatingProgramEnabled,
    rotatingProgramPhase: phase,
    rotatingProgramCycleDay: cycleDay,
    rotatingProgramTemplate: template,
    setRotatingProgramTemplate,
    rotationCycle,
    selectProgramCycleDay,
    isRestDayToday,
    canTakeRestDay,
    restDaysRemainingThisWeek: Math.max(
      0,
      maxRestDaysPerWeek - restDaysUsedThisWeek
    ),
    markTodayAsRestDay
  };
}
