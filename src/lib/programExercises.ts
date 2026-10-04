import { getLineupSlot } from '../components/moves';
import type { RotatingProgramPhase } from './rotatingProgram';

export type ProgramExercisePrescription = {
  id: string;
  setsToFailure: number;
};

/**
 * RIR program, balanced by muscle group (push / pull / legs, with a full-body
 * mixed day for a second weekly hit):
 * - Push: chest (bench press), shoulders (pike pushups), triceps (diamond pushups)
 * - Pull: lats + biceps (pull-ups), mid back + biceps (doorway rows),
 *   upper/lower back + rear shoulders (superman pulls)
 * - Legs: quads + glutes (goblet squats, lunges), hamstrings + glutes
 *   (single-leg bridges), calves (calf raises)
 * - Mixed: one push, one pull, one squat, one hinge, one core
 * Each day has exactly ONE equipment lift as its 3-set anchor; everything else
 * needs no equipment. Core work rotates focus (lower abs, front plank, crunch,
 * hollow body, side plank). Over the 5-day split pushing and pulling sets stay
 * roughly equal (~10 vs ~9), which keeps shoulders healthy.
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
    { id: 'calf-raises', setsToFailure: 2 },
    { id: 'side-planks', setsToFailure: 2 }
  ],
  pull: [
    { id: 'pull-ups', setsToFailure: 3 },
    { id: 'doorway-rows', setsToFailure: 2 },
    { id: 'superman-pulls', setsToFailure: 2 },
    { id: 'crunches', setsToFailure: 2 },
    { id: 'hollow-body', setsToFailure: 2 }
  ],
  mixed: [
    { id: 'dips', setsToFailure: 3 },
    { id: 'doorway-rows', setsToFailure: 2 },
    { id: 'jump-squats', setsToFailure: 2 },
    { id: 'glute-bridges', setsToFailure: 2 },
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
