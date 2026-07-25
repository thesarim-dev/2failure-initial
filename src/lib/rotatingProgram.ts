import { toLocalDateString } from './userStats';
import {
  resolveRotatingProgramDayPlan,
  type RotatingProgramDayPlan
} from './programExercises';

export type RotatingProgramPhase =
  | 'push'
  | 'legs'
  | 'pull'
  | 'mixed'
  | 'recovery';

/** Training days only — stretch (rest) days are created when the player opts in. */
export const ROTATION_CYCLE: readonly RotatingProgramPhase[] = [
  'push',
  'legs',
  'pull',
  'legs',
  'mixed'
];

export const ROTATION_CYCLE_LENGTH = ROTATION_CYCLE.length;

/** User-declared stretch (rest) days allowed per rolling 7-day window. */
export const MAX_REST_DAYS_PER_WEEK = 2;

function parseLocalDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function daysBetweenLocalDates(start: string, end: string): number {
  const startDate = parseLocalDateString(start);
  const endDate = parseLocalDateString(end);
  const msPerDay = 86_400_000;
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
}

export function getRotatingProgramDayIndex(
  startDate: string,
  today = toLocalDateString()
): number {
  return Math.max(0, daysBetweenLocalDates(startDate, today));
}

export function getRotatingProgramPhase(
  dayIndex: number
): RotatingProgramPhase {
  const normalized =
    ((dayIndex % ROTATION_CYCLE_LENGTH) + ROTATION_CYCLE_LENGTH) %
    ROTATION_CYCLE_LENGTH;
  return ROTATION_CYCLE[normalized];
}

export function getRotatingProgramCycleDay(dayIndex: number): number {
  return (dayIndex % ROTATION_CYCLE_LENGTH) + 1;
}

export function resolveRotatingProgramLineup(
  phase: RotatingProgramPhase
): RotatingProgramDayPlan {
  return resolveRotatingProgramDayPlan(phase);
}
