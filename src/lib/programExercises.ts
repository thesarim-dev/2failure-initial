import { getLineupSlot } from '../components/moves';
import type { RotatingProgramPhase } from './rotatingProgram';

export type ProgramExercisePrescription = {
  id: string;
  setsToFailure: number;
};

/**
 * RIR program: each training day has exactly ONE equipment lift as its 3-set
 * anchor (barbell bench press, pull-up bar, a dumbbell, dip bars), and every
 * other exercise needs no equipment at all, so a day works with one piece of
 * gear. Accessories and core use 2 sets each. Stretch (rest) days are not in
 * the cycle — the player creates them on demand.
 */
const PROGRAM_BY_PHASE: Record<
  RotatingProgramPhase,
  ProgramExercisePrescription[]
> = {
  push: [
    { id: 'bench-press', setsToFailure: 3 },
    { id: 'pike-pushups', setsToFailure: 2 },
    { id: 'diamond-pushups', setsToFailure: 2 },
    { id: 'leg-raises', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  legs: [
    { id: 'goblet-squats', setsToFailure: 3 },
    { id: 'lunges', setsToFailure: 2 },
    { id: 'single-leg-bridges', setsToFailure: 2 },
    { id: 'side-planks', setsToFailure: 2 },
    { id: 'hollow-body', setsToFailure: 2 }
  ],
  pull: [
    { id: 'pull-ups', setsToFailure: 3 },
    { id: 'superman-pulls', setsToFailure: 2 },
    { id: 'doorway-rows', setsToFailure: 2 },
    { id: 'hollow-body', setsToFailure: 2 },
    { id: 'planks', setsToFailure: 2 }
  ],
  mixed: [
    { id: 'dips', setsToFailure: 3 },
    { id: 'burpees', setsToFailure: 2 },
    { id: 'pushups', setsToFailure: 2 },
    { id: 'lunges', setsToFailure: 2 },
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
