import type { Point, RepCounter, RepPhase } from './types';
import { STABLE_FRAMES } from './types';

export function createPhaseRepCounter(
  detectPhase: (landmarks: Point[]) => RepPhase
): RepCounter {
  let phase: RepPhase = 'unknown';
  let stableFrames = 0;
  let reps = 0;

  return {
    reset() {
      phase = 'unknown';
      stableFrames = 0;
      reps = 0;
    },

    update(landmarks: Point[]) {
      const nextPhase = detectPhase(landmarks);

      if (nextPhase === 'unknown') {
        stableFrames = 0;
        return reps;
      }

      if (nextPhase === phase) {
        stableFrames = 0;
        return reps;
      }

      stableFrames += 1;
      if (stableFrames < STABLE_FRAMES) {
        return reps;
      }

      if (phase === 'down' && nextPhase === 'up') {
        reps += 1;
      }

      phase = nextPhase;
      stableFrames = 0;
      return reps;
    },

    get count() {
      return reps;
    }
  };
}
