import { getLineupSlot, getVariantById, type AnywhereEquipment } from '../components/moves';
import type { RotatingProgramPhase } from './rotatingProgram';

/**
 * "Your plan": the one way to train. Each day type has five slots (one per
 * muscle job). Every slot has a ladder of exercises from easiest to hardest;
 * the player's equipment decides which rungs are available, and Easier /
 * Harder moves along the ladder. Main lifts (3 sets) prefer gear the player
 * owns; everything else is 2 sets.
 */

export type Gear = AnywhereEquipment;
/** Real gym equipment the player can tick. */
export const ALL_GEAR: Gear[] = ['bar', 'dipBars', 'dumbbell', 'barbell'];
/** Everyone has a chair or step and a backpack, so those exercises are always available. */
export const ALWAYS_AVAILABLE: Gear[] = ['bench', 'backpack'];

export type SlotDef = {
  key: string;
  /** Muscle label key (see hub copy: plan.muscles). */
  muscle: string;
  sets: number;
  /** Easiest → hardest. */
  ladder: string[];
  /** Default pick, in priority order (first one the player can do wins). */
  start: string[];
};

export type TrainingPhase = Exclude<RotatingProgramPhase, 'recovery'>;

export const SLOTS: Record<TrainingPhase, SlotDef[]> = {
  push: [
    {
      key: 'push-chest',
      muscle: 'chest',
      sets: 3,
      ladder: ['incline-pushups', 'pushups', 'archer-pushups', 'backpack-pushups', 'dips', 'bench-press'],
      start: ['bench-press', 'dips', 'pushups']
    },
    { key: 'push-shoulders', muscle: 'shoulders', sets: 2, ladder: ['pike-pushups'], start: ['pike-pushups'] },
    { key: 'push-triceps', muscle: 'triceps', sets: 2, ladder: ['diamond-pushups', 'dips'], start: ['diamond-pushups'] },
    {
      key: 'push-abs',
      muscle: 'abs',
      sets: 2,
      ladder: ['crunches', 'leg-raises', 'hanging-knee-raises', 'hanging-leg-raises'],
      start: ['leg-raises']
    },
    { key: 'push-core', muscle: 'core', sets: 2, ladder: ['planks', 'hollow-body'], start: ['planks'] }
  ],
  pull: [
    {
      key: 'pull-lats',
      muscle: 'back',
      sets: 3,
      ladder: ['superman-pulls', 'doorway-rows', 'inverted-floor-rows', 'inverted-rows', 'negative-pull-ups', 'chin-ups', 'pull-ups', 'backpack-pull-ups'],
      start: ['pull-ups', 'doorway-rows']
    },
    {
      key: 'pull-rows',
      muscle: 'midBack',
      sets: 2,
      ladder: ['doorway-rows', 'inverted-floor-rows', 'inverted-rows'],
      start: ['inverted-rows', 'doorway-rows']
    },
    { key: 'pull-upper', muscle: 'upperBack', sets: 2, ladder: ['superman-pulls'], start: ['superman-pulls'] },
    { key: 'pull-abs', muscle: 'abs', sets: 2, ladder: ['crunches', 'leg-raises', 'hanging-knee-raises', 'hanging-leg-raises'], start: ['crunches'] },
    { key: 'pull-core', muscle: 'core', sets: 2, ladder: ['planks', 'hollow-body', 'l-sit'], start: ['hollow-body'] }
  ],
  legs: [
    {
      key: 'legs-quads',
      muscle: 'quads',
      sets: 3,
      ladder: ['squats', 'jump-squats', 'backpack-squats', 'goblet-squats', 'pistol-squats'],
      start: ['goblet-squats', 'squats']
    },
    { key: 'legs-single', muscle: 'singleLeg', sets: 2, ladder: ['lunges', 'step-ups', 'bulgarian-splits', 'pistol-squats'], start: ['lunges'] },
    { key: 'legs-hams', muscle: 'hamstrings', sets: 2, ladder: ['glute-bridges', 'single-leg-bridges'], start: ['single-leg-bridges'] },
    { key: 'legs-calves', muscle: 'calves', sets: 2, ladder: ['calf-raises'], start: ['calf-raises'] },
    { key: 'legs-core', muscle: 'obliques', sets: 2, ladder: ['side-planks'], start: ['side-planks'] }
  ],
  mixed: [
    { key: 'full-push', muscle: 'push', sets: 3, ladder: ['pushups', 'diamond-pushups', 'archer-pushups', 'dips', 'bench-press'], start: ['dips', 'pushups'] },
    { key: 'full-pull', muscle: 'pull', sets: 2, ladder: ['superman-pulls', 'doorway-rows', 'inverted-rows', 'chin-ups', 'pull-ups'], start: ['doorway-rows'] },
    { key: 'full-legs', muscle: 'legs', sets: 2, ladder: ['squats', 'jump-squats', 'goblet-squats', 'pistol-squats'], start: ['jump-squats'] },
    { key: 'full-hinge', muscle: 'glutes', sets: 2, ladder: ['glute-bridges', 'single-leg-bridges'], start: ['glute-bridges'] },
    { key: 'full-core', muscle: 'core', sets: 2, ladder: ['planks', 'hollow-body'], start: ['planks'] }
  ]
};

/** Can the player do this exercise with their equipment? */
export function canDo(exerciseId: string, gear: readonly Gear[]): boolean {
  const variant = getVariantById(exerciseId);
  if (!variant) return false;
  return (variant.equipment ?? []).every((item) => gear.includes(item) || ALWAYS_AVAILABLE.includes(item));
}

/** Exercises in the plan that a piece of gear makes possible (for "unlocks …"). */
export function unlocksFor(item: Gear): string[] {
  const ids = new Set<string>();
  for (const slots of Object.values(SLOTS)) {
    for (const slot of slots) {
      for (const id of slot.ladder) {
        if ((getVariantById(id)?.equipment ?? []).includes(item)) ids.add(id);
      }
    }
  }
  // Lead with the exercise people buy the gear for.
  const headline: Partial<Record<Gear, string[]>> = {
    bar: ['pull-ups', 'chin-ups'],
    dipBars: ['dips', 'l-sit'],
    dumbbell: ['goblet-squats'],
    barbell: ['bench-press']
  };
  const first = (headline[item] ?? []).filter((id) => ids.has(id));
  return [...first, ...[...ids].filter((id) => !first.includes(id))];
}

/** The rungs of a slot's ladder the player can actually do. */
export function availableLadder(slot: SlotDef, gear: readonly Gear[]): string[] {
  return slot.ladder.filter((id) => canDo(id, gear));
}

/**
 * The exercise for a slot: the player's choice if still possible, else the
 * default, skipping anything an earlier slot already uses today.
 */
export function exerciseForSlot(
  slot: SlotDef,
  gear: readonly Gear[],
  levels: Record<string, string>,
  used: ReadonlySet<string> = new Set()
): string {
  const ladder = availableLadder(slot, gear);
  const chosen = levels[slot.key];
  if (chosen && ladder.includes(chosen)) return chosen;
  return (
    slot.start.find((id) => ladder.includes(id) && !used.has(id)) ??
    ladder.find((id) => !used.has(id)) ??
    ladder[0] ??
    slot.ladder[0]
  );
}

export type PlannedExercise = {
  slot: SlotDef;
  exerciseId: string;
  /** The next easier / harder exercise available, if any. */
  easier: string | null;
  harder: string | null;
};

export function planForPhase(phase: TrainingPhase, gear: readonly Gear[], levels: Record<string, string>): PlannedExercise[] {
  const used = new Set<string>();
  return SLOTS[phase].map((slot) => {
    const ladder = availableLadder(slot, gear);
    const exerciseId = exerciseForSlot(slot, gear, levels, used);
    used.add(exerciseId);
    const i = ladder.indexOf(exerciseId);
    return {
      slot,
      exerciseId,
      easier: i > 0 ? ladder[i - 1] : null,
      harder: i >= 0 && i < ladder.length - 1 ? ladder[i + 1] : null
    };
  });
}

/** Today's lineup in the shape the rest of the app expects. */
export function lineupFromPlan(planned: PlannedExercise[]) {
  const upper: string[] = [];
  const lower: string[] = [];
  const core: string[] = [];
  const setsToFailure: Record<string, number> = {};
  for (const { exerciseId, slot } of planned) {
    // The same exercise can't appear twice in one day (e.g. dips): keep the first.
    if (setsToFailure[exerciseId] !== undefined) continue;
    setsToFailure[exerciseId] = slot.sets;
    const where = getLineupSlot(exerciseId);
    if (where === 'lower') lower.push(exerciseId);
    else if (where === 'core') core.push(exerciseId);
    else upper.push(exerciseId);
  }
  return { upper, lower, core, recovery: [] as string[], setsToFailure };
}

/** Days per week → the rotation of day types. */
export const TEMPLATE_FOR_DAYS: Record<3 | 4 | 5, 'ppl3' | 'balanced4' | 'classic5'> = {
  3: 'ppl3',
  4: 'balanced4',
  5: 'classic5'
};
export const DAYS_FOR_TEMPLATE: Record<string, 3 | 4 | 5> = { ppl3: 3, balanced4: 4, classic5: 5 };
