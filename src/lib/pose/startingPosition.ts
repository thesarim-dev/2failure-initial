import { isVisible } from './jointAngle';
import { detectLungePhase } from './lungeRepCounter';
import { detectPushupPhase } from './pushupRepCounter';
import type { PoseExerciseId } from './repCounterFactory';
import { detectSquatPhase } from './squatRepCounter';
import type { Point, RepPhase } from './types';
import { profileFor, repPhase, type HoldFix } from './profiles';
import { ARMS, FEET, LEGS } from './measures';

export type PositionGuidanceKey =
  | 'no_pose'
  | 'too_dark'
  | 'too_bright'
  | 'blurry'
  | 'arms_not_visible'
  | 'legs_not_visible'
  | 'straighten_arms'
  | 'stand_up'
  | 'hold_still'
  | 'body_not_visible'
  | 'start_position'
  | HoldFix;

export const POSITION_STABLE_TARGET = 22;
export const STABLE_GOOD_INCREMENT = 2;
export const STABLE_WOBBLY_INCREMENT = 1;
export const STABLE_BAD_DECREMENT = 2;
export const COUNTDOWN_CANCEL_BAD_FRAMES = 20;

export type PositionReadiness = 'good' | 'wobbly' | 'bad';

const BRIGHTNESS_DARK = 45;
const BRIGHTNESS_BRIGHT = 215;
const BLURRY_VISIBILITY = 0.38;

const PUSHUP_LANDMARKS = [11, 12, 13, 14, 15, 16];
const LEG_LANDMARKS = [23, 24, 25, 26, 27, 28];

let brightnessCanvas: HTMLCanvasElement | null = null;

export function sampleVideoBrightness(video: HTMLVideoElement): number | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;

  if (!brightnessCanvas) {
    brightnessCanvas = document.createElement('canvas');
  }

  const ctx = brightnessCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const size = 32;
  brightnessCanvas.width = size;
  brightnessCanvas.height = size;
  ctx.drawImage(video, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size).data;
  let sum = 0;
  const pixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  return sum / pixels;
}

function averageVisibility(landmarks: Point[], indices: number[]): number {
  if (indices.length === 0) return 0;
  const total = indices.reduce(
    (sum, index) => sum + (landmarks[index]?.visibility ?? 0),
    0
  );
  return total / indices.length;
}

function visibleCount(landmarks: Point[], indices: number[]): number {
  return indices.filter((index) => isVisible(landmarks[index])).length;
}

function detectExercisePhase(
  exerciseId: PoseExerciseId,
  landmarks: Point[]
): RepPhase {
  switch (exerciseId) {
    case 'pushups':
      return detectPushupPhase(landmarks);
    case 'squats':
      return detectSquatPhase(landmarks);
    case 'lunges':
      return detectLungePhase(landmarks);
  }
  const profile = profileFor(exerciseId);
  return profile && profile.kind === 'reps' ? repPhase(profile, landmarks) : 'unknown';
}

function keyLandmarks(exerciseId: PoseExerciseId): number[] {
  if (exerciseId === 'pushups') return PUSHUP_LANDMARKS;
  if (exerciseId === 'squats' || exerciseId === 'lunges') return LEG_LANDMARKS;
  return profileFor(exerciseId)?.keys ?? LEG_LANDMARKS;
}

/** Which "show yourself" message fits the body parts this exercise needs. */
function notVisibleGuidance(exerciseId: PoseExerciseId): PositionGuidanceKey {
  const keys = keyLandmarks(exerciseId);
  if (keys === ARMS || keys === PUSHUP_LANDMARKS) return 'arms_not_visible';
  if (keys === LEG_LANDMARKS || keys === LEGS || keys === FEET) return 'legs_not_visible';
  return 'body_not_visible';
}

/** What to say when someone starts in the wrong end of the movement. */
function wrongStartGuidance(exerciseId: PoseExerciseId): PositionGuidanceKey {
  if (exerciseId.includes('pushups')) return 'straighten_arms';
  if (exerciseId === 'squats' || exerciseId === 'lunges') return 'stand_up';
  const profile = profileFor(exerciseId);
  if (profile?.kind === 'reps' && profile.start === 'up' && profile.view === 'standing_side' && profile.keys === LEGS) return 'stand_up';
  return 'start_position';
}

export interface StartingPositionAssessment {
  readiness: PositionReadiness;
  guidance: PositionGuidanceKey;
}

export function assessStartingPosition(
  exerciseId: PoseExerciseId,
  landmarks: Point[] | undefined,
  brightness: number | null
): StartingPositionAssessment {
  if (!landmarks || landmarks.length === 0) {
    return { readiness: 'bad', guidance: 'no_pose' };
  }

  if (brightness !== null) {
    if (brightness < BRIGHTNESS_DARK) {
      return { readiness: 'bad', guidance: 'too_dark' };
    }
    if (brightness > BRIGHTNESS_BRIGHT) {
      return { readiness: 'bad', guidance: 'too_bright' };
    }
  }

  const keys = keyLandmarks(exerciseId);
  const visible = visibleCount(landmarks, keys);
  const minVisible = Math.min(4, Math.ceil(keys.length * 0.6));

  if (visible < minVisible) {
    return { readiness: 'bad', guidance: notVisibleGuidance(exerciseId) };
  }

  const visibility = averageVisibility(landmarks, keys);
  if (visibility < BLURRY_VISIBILITY) {
    return { readiness: 'bad', guidance: 'blurry' };
  }

  // Holds: ready once you're in good form.
  const profile = profileFor(exerciseId);
  if (profile?.kind === 'hold') {
    const result = profile.check(landmarks);
    if (!result) return { readiness: 'bad', guidance: notVisibleGuidance(exerciseId) };
    return result.ok ? { readiness: 'good', guidance: 'hold_still' } : { readiness: 'bad', guidance: result.fix };
  }

  const phase = detectExercisePhase(exerciseId, landmarks);
  const startPhase = profile?.kind === 'reps' ? profile.start : 'up';

  if (phase !== 'unknown' && phase !== startPhase) {
    return { readiness: 'bad', guidance: wrongStartGuidance(exerciseId) };
  }

  if (phase === startPhase) {
    return { readiness: 'good', guidance: 'hold_still' };
  }

  // Between up/down thresholds — small wobble while settling is fine.
  return { readiness: 'wobbly', guidance: 'hold_still' };
}
