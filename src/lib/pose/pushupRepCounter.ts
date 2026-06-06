type Point = { x: number; y: number; visibility?: number };

export type PushupPhase = 'up' | 'down' | 'unknown';

const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;

const MIN_VISIBILITY = 0.45;
const DOWN_ANGLE = 110;
const UP_ANGLE = 150;
const STABLE_FRAMES = 4;

function isVisible(point: Point | undefined): point is Point {
  return !!point && (point.visibility ?? 1) >= MIN_VISIBILITY;
}

function jointAngle(shoulder: Point, elbow: Point, wrist: Point): number {
  const radians =
    Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) -
    Math.atan2(shoulder.y - elbow.y, shoulder.x - elbow.x);
  let degrees = Math.abs((radians * 180) / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

function averageElbowAngle(landmarks: Point[]): number | null {
  const leftVisible =
    isVisible(landmarks[LEFT_SHOULDER]) &&
    isVisible(landmarks[LEFT_ELBOW]) &&
    isVisible(landmarks[LEFT_WRIST]);
  const rightVisible =
    isVisible(landmarks[RIGHT_SHOULDER]) &&
    isVisible(landmarks[RIGHT_ELBOW]) &&
    isVisible(landmarks[RIGHT_WRIST]);

  const angles: number[] = [];

  if (leftVisible) {
    angles.push(
      jointAngle(
        landmarks[LEFT_SHOULDER],
        landmarks[LEFT_ELBOW],
        landmarks[LEFT_WRIST]
      )
    );
  }

  if (rightVisible) {
    angles.push(
      jointAngle(
        landmarks[RIGHT_SHOULDER],
        landmarks[RIGHT_ELBOW],
        landmarks[RIGHT_WRIST]
      )
    );
  }

  if (angles.length === 0) return null;

  return angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
}

export function detectPushupPhase(landmarks: Point[]): PushupPhase {
  const angle = averageElbowAngle(landmarks);
  if (angle === null) return 'unknown';
  if (angle <= DOWN_ANGLE) return 'down';
  if (angle >= UP_ANGLE) return 'up';
  return 'unknown';
}

export class PushupRepCounter {
  private phase: PushupPhase = 'unknown';
  private stableFrames = 0;
  private reps = 0;

  reset() {
    this.phase = 'unknown';
    this.stableFrames = 0;
    this.reps = 0;
  }

  update(landmarks: Point[]): number {
    const nextPhase = detectPushupPhase(landmarks);

    if (nextPhase === 'unknown') {
      this.stableFrames = 0;
      return this.reps;
    }

    if (nextPhase === this.phase) {
      this.stableFrames = 0;
      return this.reps;
    }

    this.stableFrames += 1;
    if (this.stableFrames < STABLE_FRAMES) {
      return this.reps;
    }

    if (this.phase === 'down' && nextPhase === 'up') {
      this.reps += 1;
    }

    this.phase = nextPhase;
    this.stableFrames = 0;
    return this.reps;
  }

  get count() {
    return this.reps;
  }
}
