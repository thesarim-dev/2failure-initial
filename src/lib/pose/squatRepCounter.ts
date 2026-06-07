import { averageKneeAngle } from './kneeAngle';
import { createPhaseRepCounter } from './phaseRepCounter';
import type { Point, RepPhase } from './types';

const DOWN_ANGLE = 115;
const UP_ANGLE = 155;

export function detectSquatPhase(landmarks: Point[]): RepPhase {
  const angle = averageKneeAngle(landmarks);
  if (angle === null) return 'unknown';
  if (angle <= DOWN_ANGLE) return 'down';
  if (angle >= UP_ANGLE) return 'up';
  return 'unknown';
}

export function createSquatRepCounter() {
  return createPhaseRepCounter(detectSquatPhase);
}
