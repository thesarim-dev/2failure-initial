import { getLineupSlot } from '../components/moves';
import type { RotatingProgramPhase } from './rotatingProgram';

export type ProgramExercisePrescription = {
  id: string;
  setsToFailure: number;
};

/**
 * RIR program built for training anywhere: a park with a pull-up bar and dip
 * bars, a bench or stairs, and a backpack for load. No gym equipment.
 * Stretch (rest) days are not in the cycle — the player creates them on demand.
 * The 3-set anchor of each day is the hardest, loadable move; accessories and
 * core use 2 sets each.
 */
const PROGRAM_BY_PHASE: Record<
  RotatingProgramPhase,
  ProgramExercisePrescription[]
> = {
  push: [
    { id: 'backpack-pushups', setsToFailure: 3 },
    { id: 'dips', setsToFailure: 2 },
    { id: 'pike-pushups', setsToFailure: 2 },
    { id: 'l-sit', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  legs: [
    { id: 'backpack-squats', setsToFailure: 3 },
    { id: 'bulgarian-splits', setsToFailure: 2 },
    { id: 'single-leg-bridges', setsToFailure: 2 },
    { id: 'hollow-body', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  pull: [
    { id: 'pull-ups', setsToFailure: 3 },
    { id: 'inverted-rows', setsToFailure: 2 },
    { id: 'chin-ups', setsToFailure: 2 },
    { id: 'hanging-knee-raises', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  mixed: [
    { id: 'backpack-pull-ups', setsToFailure: 3 },
    { id: 'burpees', setsToFailure: 2 },
    { id: 'pushups', setsToFailure: 2 },
    { id: 'lunges', setsToFailure: 2 },
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
