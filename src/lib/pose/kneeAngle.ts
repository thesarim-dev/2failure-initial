import { jointAngle, isVisible } from './jointAngle';
import type { Point } from './types';

const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const LEFT_KNEE = 25;
const RIGHT_KNEE = 26;
const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;

function leftKneeAngle(landmarks: Point[]): number | null {
  if (
    !isVisible(landmarks[LEFT_HIP]) ||
    !isVisible(landmarks[LEFT_KNEE]) ||
    !isVisible(landmarks[LEFT_ANKLE])
  ) {
    return null;
  }

  return jointAngle(
    landmarks[LEFT_HIP],
    landmarks[LEFT_KNEE],
    landmarks[LEFT_ANKLE]
  );
}

function rightKneeAngle(landmarks: Point[]): number | null {
  if (
    !isVisible(landmarks[RIGHT_HIP]) ||
    !isVisible(landmarks[RIGHT_KNEE]) ||
    !isVisible(landmarks[RIGHT_ANKLE])
  ) {
    return null;
  }

  return jointAngle(
    landmarks[RIGHT_HIP],
    landmarks[RIGHT_KNEE],
    landmarks[RIGHT_ANKLE]
  );
}

export function averageKneeAngle(landmarks: Point[]): number | null {
  const angles: number[] = [];
  const left = leftKneeAngle(landmarks);
  const right = rightKneeAngle(landmarks);
  if (left !== null) angles.push(left);
  if (right !== null) angles.push(right);
  if (angles.length === 0) return null;
  return angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
}

export function minKneeAngle(landmarks: Point[]): number | null {
  const angles: number[] = [];
  const left = leftKneeAngle(landmarks);
  const right = rightKneeAngle(landmarks);
  if (left !== null) angles.push(left);
  if (right !== null) angles.push(right);
  if (angles.length === 0) return null;
  return Math.min(...angles);
}
