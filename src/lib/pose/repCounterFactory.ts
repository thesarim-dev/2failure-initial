import { createLungeRepCounter } from './lungeRepCounter';
import { createPhaseRepCounter } from './phaseRepCounter';
import { profileFor, PROFILES, repPhase, type HoldFix, type HoldProfile } from './profiles';
import { PushupRepCounter } from './pushupRepCounter';
import { createSquatRepCounter } from './squatRepCounter';
import type { Point, RepCounter } from './types';

/** Any exercise with a camera profile (all of them, see profiles.ts). */
export type PoseExerciseId = string;

/** Holds count the seconds held in good form; `fix` says what to correct. */
export interface HoldCounter extends RepCounter {
  readonly isHold: true;
  readonly fix: HoldFix | 'ok' | null;
}

function createHoldCounter(profile: HoldProfile): HoldCounter {
  let held = 0;
  let last = 0;
  let fix: HoldFix | 'ok' | null = null;
  return {
    isHold: true,
    reset() {
      held = 0;
      last = 0;
      fix = null;
    },
    update(landmarks: Point[]) {
      const now = performance.now();
      const dt = last ? Math.min(0.5, (now - last) / 1000) : 0;
      last = now;
      const result = profile.check(landmarks);
      if (!result) {
        fix = null;
      } else if (result.ok) {
        fix = 'ok';
        held += dt;
      } else {
        fix = result.fix;
      }
      return Math.floor(held);
    },
    get count() {
      return Math.floor(held);
    },
    get fix() {
      return fix;
    }
  };
}

export function createRepCounter(exerciseId: PoseExerciseId): RepCounter {
  // The original three keep their hand-tuned counters.
  if (exerciseId === 'pushups') return new PushupRepCounter();
  if (exerciseId === 'squats') return createSquatRepCounter();
  if (exerciseId === 'lunges') return createLungeRepCounter();
  const profile = profileFor(exerciseId);
  if (!profile) return createSquatRepCounter();
  if (profile.kind === 'hold') return createHoldCounter(profile);
  return createPhaseRepCounter((lm) => repPhase(profile, lm));
}

export function isHoldCounter(counter: RepCounter): counter is HoldCounter {
  return (counter as Partial<HoldCounter>).isHold === true;
}

export const POSE_AI_CATEGORY_IDS = new Set<string>(Object.keys(PROFILES));

export function isPoseExerciseId(categoryId: string): categoryId is PoseExerciseId {
  return POSE_AI_CATEGORY_IDS.has(categoryId);
}
