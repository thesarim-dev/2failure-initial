import { useCallback, useEffect, useMemo, useState } from 'react';
import { shiftDay, weekState } from '../lib/restWeek';
import {
  daysBetweenLocalDates,
  DEFAULT_ROTATION_TEMPLATE,
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

/**
 * `trainedDays`: days (YYYY-MM-DD) with training. The plan moves forward one
 * workout per day you actually train; rest days and skipped days keep the next
 * workout waiting. Rest days are counted per calendar week (see restWeek.ts).
 */
export function useRotatingProgram(
  trainedDays: ReadonlySet<string> = new Set(),
  trainedLoaded = false,
  sundayFirst = false
) {
  const today = toLocalDateString();
  const { user } = useAuth();
  const userId = user?.id;

  const ENABLED_KEY = storageKeyFor(userId, 'rotating-program-enabled');
  const START_DATE_KEY = storageKeyFor(userId, 'rotating-program-start-date');
  const EFFECTIVE_INDEX_KEY = storageKeyFor(userId, 'rotating-program-effective-index');
  const EFFECTIVE_DATE_KEY = storageKeyFor(userId, 'rotating-program-effective-date');
  const REST_DAYS_KEY = storageKeyFor(userId, 'rotating-program-rest-days');
  // v2: the plan advances on trained days only (v1 advanced every calendar day).
  const MODEL_KEY = storageKeyFor(userId, 'rotating-program-model');
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
    let model: string | null = null;
    try {
      model = window.localStorage.getItem(MODEL_KEY);
    } catch {
      model = null;
    }
    if (model === '2') {
      const index = readStoredEffectiveIndex();
      const date = readStoredEffectiveDate();
      if (index !== null && date !== null) return { index, date };
    }
    // Move to v2 once, keeping today's workout exactly where it was.
    const old = resolveInitialEffectivePosition(readStoredStartDate()!, today);
    const restingToday = readStoredRestDays().includes(today);
    const index = restingToday ? old.index + 1 : Math.max(0, old.index);
    writeStoredEffectivePosition(index, today);
    try {
      window.localStorage.setItem(MODEL_KEY, '2');
    } catch {
      // Ignore storage failures.
    }
    return { index, date: today };
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
      try {
        window.localStorage.setItem(MODEL_KEY, '2');
      } catch {
        // Ignore storage failures.
      }
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
        try {
          window.localStorage.setItem(MODEL_KEY, '2');
        } catch {
          // Ignore storage failures.
        }
        return;
      }

      setStartDateState(null);
      setSavedPositionState(null);
      clearStoredStartDate();
      clearStoredEffectivePosition();
    },
    []
  );

  // Where you are in the plan: the anchor, plus one for each day you trained since.
  const position = useMemo(() => {
    if (!enabled || !startDate) return null;
    const anchor = savedPosition ?? { index: 0, date: startDate };
    let index = anchor.index;
    for (let d = anchor.date; d < today; d = shiftDay(d, 1)) {
      if (trainedDays.has(d)) index += 1;
    }
    return Math.max(0, index);
  }, [enabled, startDate, savedPosition, today, trainedDays]);

  // Keep the anchor recent (only once the training history has loaded).
  useEffect(() => {
    if (!trainedLoaded || position === null || !savedPosition) return;
    if (daysBetweenLocalDates(savedPosition.date, today) <= 21) return;
    setSavedPositionState({ index: position, date: today });
    writeStoredEffectivePosition(position, today);
  }, [trainedLoaded, position, savedPosition, today]);

  // Rest days, counted per calendar week: allowance, what's left, week done.
  const week = useMemo(
    () =>
      weekState({
        today,
        planDays: rotationCycle.length,
        trainedDays,
        declaredRest: new Set(restDays),
        sundayFirst,
        planStart: startDate
      }),
    [today, rotationCycle.length, trainedDays, restDays, sundayFirst, startDate]
  );

  const isRestDayToday = enabled && week.restToday;
  const canTakeRestDay = enabled && week.canRestToday;

  const markTodayAsRestDay = useCallback(() => {
    if (!enabled || !week.canRestToday) return;
    if (restDays.includes(today)) return;
    // Keep three weeks of declared rest days; the plan doesn't move on rest days.
    const nextRestDays = [...restDays.filter((day) => daysBetweenLocalDates(day, today) < 21), today];
    setRestDaysState(nextRestDays);
    writeStoredRestDays(nextRestDays);
  }, [enabled, week.canRestToday, restDays, today]);

  const phase = useMemo((): RotatingProgramPhase | null => {
    if (position === null) return null;
    // A rest day (declared, or the week's training is done) is a stretch day.
    if (isRestDayToday) return 'recovery';
    return getRotatingProgramPhase(position, rotationCycle);
  }, [position, isRestDayToday, rotationCycle]);

  // On a rest day this is the waiting workout (the next one you'll do).
  const cycleDay = useMemo(() => {
    if (position === null) return null;
    return getRotatingProgramCycleDay(position, rotationCycle);
  }, [position, rotationCycle]);

  const selectProgramCycleDay = useCallback(
    (targetCycleDay: number) => {
      // Don't jump days while today is a rest day.
      if (isRestDayToday || position === null) return;

      const length = rotationCycle.length;
      const currentNorm = ((position % length) + length) % length;
      const targetNorm = targetCycleDay - 1;
      const delta = targetNorm - currentNorm;
      const nextIndex = Math.max(0, position + delta);
      const anchor = toLocalDateString();

      setSavedPositionState({ index: nextIndex, date: anchor });
      writeStoredEffectivePosition(nextIndex, anchor);
    },
    [position, isRestDayToday, rotationCycle]
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
    restDaysRemainingThisWeek: week.restLeft,
    markTodayAsRestDay,
    /** Rest days declared with the ticket (for the streak). */
    declaredRestDays: restDays,
    /** Today is rest because the week's training is done. */
    restTodayIsWeekDone: enabled && week.restTodayIsWeekDone
  };
}
