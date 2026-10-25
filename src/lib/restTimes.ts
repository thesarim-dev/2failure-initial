import { getLineupSlot, getVariantById } from '../components/moves';

/**
 * How long to rest before the next set, by exercise type.
 *
 * Evidence (summarised):
 *  - Heavy strength work: 2–5 min between sets (ACSM / NSCA); 3 min beat 1 min
 *    for strength and size (Schoenfeld et al., 2016).
 *  - Muscle growth: a small benefit to resting > 60 s, no clear extra gain
 *    beyond ~90 s (Singer et al., 2024 meta-analysis).
 *  - Muscular endurance / small muscles / core: 30–60 s.
 *  - Moving on to a different exercise: those muscles are fresh, so a short
 *    transition (enough to set up) is fine.
 */
export const REST = {
  heavy: 180,
  hard: 120,
  standard: 90,
  light: 60,
  nextExercise: 60
} as const;

/** Barbell lifts: heavy strength work. */
const HEAVY = new Set(['barbell-deadlifts', 'barbell-back-squats', 'bench-press', 'barbell-overhead-press', 'barbell-rows']);
/** Near-maximal bodyweight or loaded moves. */
const HARD = new Set([
  'pull-ups',
  'chin-ups',
  'negative-pull-ups',
  'backpack-pull-ups',
  'dips',
  'pistol-squats',
  'wall-handstand-pushups',
  'elevated-pike-pushups',
  'archer-pushups',
  'nordic-curls',
  'bulgarian-splits'
]);
/** Small muscles and core: endurance-style rest. */
const LIGHT = new Set(['calf-raises', 'single-leg-calf-raises', 'prone-ytw-raises', 'superman-pulls', 'side-plank-hip-dips']);

export type RestKind = keyof typeof REST;

export function restKindFor(exerciseId: string): RestKind | null {
  const slot = getLineupSlot(exerciseId);
  if (slot === 'recovery') return null; // stretches: no timer
  if (HEAVY.has(exerciseId)) return 'heavy';
  const v = getVariantById(exerciseId);
  const loaded = v?.equipment?.some((e) => e === 'dumbbell' || e === 'backpack');
  if (HARD.has(exerciseId) || loaded) return 'hard';
  if (slot === 'core' || LIGHT.has(exerciseId)) return 'light';
  return 'standard';
}

export function restSecondsFor(exerciseId: string): number {
  const kind = restKindFor(exerciseId);
  return kind ? REST[kind] : 0;
}
