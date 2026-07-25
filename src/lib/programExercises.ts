import { getLineupSlot } from '../components/moves';
import type { RotatingProgramPhase } from './rotatingProgram';

export type ProgramExercisePrescription = {
  id: string;
  setsToFailure: number;
};

/**
 * 5-day RIR program: push, legs, pull, legs, mixed.
 * Stretch (rest) days are not in the cycle — the player creates them on demand.
 * Home-gym anchors use 3 sets; workday accessories and core use 2 sets each.
 */
const PROGRAM_BY_PHASE: Record<
  RotatingProgramPhase,
  ProgramExercisePrescription[]
> = {
  push: [
    { id: 'barbell-bench-press', setsToFailure: 3 },
    { id: 'dips', setsToFailure: 2 },
    { id: 'pushups', setsToFailure: 2 },
    { id: 'l-sit', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  legs: [
    { id: 'barbell-squat', setsToFailure: 3 },
    { id: 'bulgarian-splits', setsToFailure: 2 },
    { id: 'squats', setsToFailure: 2 },
    { id: 'hollow-body', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  pull: [
    { id: 'pull-ups', setsToFailure: 3 },
    { id: 'doorway-rows', setsToFailure: 2 },
    { id: 'inverted-floor-rows', setsToFailure: 2 },
    { id: 'l-sit', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  mixed: [
    { id: 'barbell-deadlift', setsToFailure: 3 },
    { id: 'burpees', setsToFailure: 2 },
    { id: 'pull-ups', setsToFailure: 2 },
    { id: 'pushups', setsToFailure: 2 },
    { id: 'l-sit', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  recovery: [
    { id: 'cobra-stretch', setsToFailure: 2 },
    { id: 'childs-pose', setsToFailure: 2 },
    { id: 'couch-stretch', setsToFailure: 2 },
    { id: 'seated-hamstring-stretch', setsToFailure: 2 }
  ]
};

export type RotatingProgramDayPlan = {
  upper: string[];
  lower: string[];
  core: string[];
  recovery: string[];
  setsToFailure: Record<string, number>;
};

export function resolveRotatingProgramDayPlan(
  phase: RotatingProgramPhase
): RotatingProgramDayPlan {
  const phaseRx = PROGRAM_BY_PHASE[phase];
  const upper: string[] = [];
  const lower: string[] = [];
  const core: string[] = [];
  const recovery: string[] = [];
  const setsToFailure: Record<string, number> = {};

  for (const rx of phaseRx) {
    setsToFailure[rx.id] = rx.setsToFailure;
    const slot = getLineupSlot(rx.id);
    if (slot === 'upper') upper.push(rx.id);
    else if (slot === 'lower') lower.push(rx.id);
    else if (slot === 'core') core.push(rx.id);
    else if (slot === 'recovery') recovery.push(rx.id);
  }

  return { upper, lower, core, recovery, setsToFailure };
}
