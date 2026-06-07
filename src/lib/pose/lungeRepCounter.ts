import { minKneeAngle } from './kneeAngle';
import { createPhaseRepCounter } from './phaseRepCounter';
import type { Point, RepPhase } from './types';

const DOWN_ANGLE = 110;
const UP_ANGLE = 155;

export function detectLungePhase(landmarks: Point[]): RepPhase {
  const angle = minKneeAngle(landmarks);
  if (angle === null) return 'unknown';
  if (angle <= DOWN_ANGLE) return 'down';
  if (angle >= UP_ANGLE) return 'up';
  return 'unknown';
}

export function createLungeRepCounter() {
  return createPhaseRepCounter(detectLungePhase);
}
