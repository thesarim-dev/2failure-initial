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

export type RotatingProgramTemplateId = 'ppl3' | 'balanced4' | 'classic5';

/**
 * Selectable training splits. Training days only — stretch (rest) days are
 * created when the player opts in.
 */
export const ROTATION_TEMPLATES: Record<
  RotatingProgramTemplateId,
  readonly RotatingProgramPhase[]
> = {
  ppl3: ['push', 'pull', 'legs'],
  balanced4: ['push', 'legs', 'pull', 'mixed'],
  classic5: ['push', 'legs', 'pull', 'legs', 'mixed']
};

export const ROTATION_TEMPLATE_IDS: readonly RotatingProgramTemplateId[] = [
  'ppl3',
  'balanced4',
  'classic5'
];

export const DEFAULT_ROTATION_TEMPLATE: RotatingProgramTemplateId = 'classic5';

/**
 * User-declared stretch (rest) days allowed per rolling 7-day window.
 * Scales with the split so training + rest days fill a real week:
 * 3-day split -> 4 rest days, 4-day -> 3, 5-day -> 2.
 */
export function getMaxRestDaysPerWeek(
  cycle: readonly RotatingProgramPhase[]
): number {
  return Math.max(0, 7 - cycle.length);
}

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
  dayIndex: number,
  cycle: readonly RotatingProgramPhase[]
): RotatingProgramPhase {
  const length = cycle.length;
  const normalized = ((dayIndex % length) + length) % length;
  return cycle[normalized];
}

export function getRotatingProgramCycleDay(
  dayIndex: number,
  cycle: readonly RotatingProgramPhase[]
): number {
  const length = cycle.length;
  return (((dayIndex % length) + length) % length) + 1;
}

export function resolveRotatingProgramLineup(
  phase: RotatingProgramPhase
): RotatingProgramDayPlan {
  return resolveRotatingProgramDayPlan(phase);
}
