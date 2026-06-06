type Point = { x: number; y: number; visibility?: number };

export type PushupPhase = 'up' | 'down' | 'unknown';

const NOSE = 0;
const LEFT_EYE = 1;
const RIGHT_EYE = 2;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;

const MIN_VISIBILITY = 0.5;
const DOWN_ELBOW_ANGLE = 90;
const UP_ELBOW_ANGLE = 160;
const MAX_ARM_ANGLE_DIFF = 24;
const MIN_HEAD_DROP = 0.05;
const MIN_SHOULDER_DROP = 0.04;
const MAX_CHEST_ABOVE_ELBOW = 0.09;
const MAX_SHOULDER_TILT = 0.07;
const MIN_WRIST_SPREAD = 0.18;
const FRAME_TOP = 0.08;
const FRAME_BOTTOM = 0.78;
const STABLE_FRAMES = 7;
const MIN_FRAMES_IN_DOWN = 5;

function isVisible(point: Point | undefined): point is Point {
  return !!point && (point.visibility ?? 1) >= MIN_VISIBILITY;
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function jointAngle(a: Point, b: Point, c: Point): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs((radians * 180) / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

function headPoint(landmarks: Point[]): Point | null {
  if (isVisible(landmarks[NOSE])) return landmarks[NOSE];
  if (isVisible(landmarks[LEFT_EYE]) && isVisible(landmarks[RIGHT_EYE])) {
    return midpoint(landmarks[LEFT_EYE], landmarks[RIGHT_EYE]);
  }
  return null;
}

type UpperBodyMetrics = {
  head: Point;
  shoulders: Point;
  elbows: Point;
  wrists: Point;
  leftAngle: number;
  rightAngle: number;
  avgAngle: number;
};

function upperBodyMetrics(landmarks: Point[]): UpperBodyMetrics | null {
  const head = headPoint(landmarks);
  const leftReady =
    isVisible(landmarks[LEFT_SHOULDER]) &&
    isVisible(landmarks[LEFT_ELBOW]) &&
    isVisible(landmarks[LEFT_WRIST]);
  const rightReady =
    isVisible(landmarks[RIGHT_SHOULDER]) &&
    isVisible(landmarks[RIGHT_ELBOW]) &&
    isVisible(landmarks[RIGHT_WRIST]);

  if (!head || !leftReady || !rightReady) return null;

  const shoulders = midpoint(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER]);
  const elbows = midpoint(landmarks[LEFT_ELBOW], landmarks[RIGHT_ELBOW]);
  const wrists = midpoint(landmarks[LEFT_WRIST], landmarks[RIGHT_WRIST]);

  const leftAngle = jointAngle(
    landmarks[LEFT_SHOULDER],
    landmarks[LEFT_ELBOW],
    landmarks[LEFT_WRIST]
  );
  const rightAngle = jointAngle(
    landmarks[RIGHT_SHOULDER],
    landmarks[RIGHT_ELBOW],
    landmarks[RIGHT_WRIST]
  );

  return {
    head,
    shoulders,
    elbows,
    wrists,
    leftAngle,
    rightAngle,
    avgAngle: (leftAngle + rightAngle) / 2
  };
}

function inHeadShouldersFrame(metrics: UpperBodyMetrics): boolean {
  const points = [metrics.head, metrics.shoulders, metrics.elbows, metrics.wrists];
  return points.every(
    (point) =>
      point.y >= FRAME_TOP &&
      point.y <= FRAME_BOTTOM &&
      point.x >= 0.06 &&
      point.x <= 0.94
  );
}

export type FormHint =
  | 'Frame your head and shoulders'
  | 'Show both arms from shoulders to wrists'
  | 'Keep shoulders level'
  | 'Arms uneven — match both sides'
  | 'Go lower — head and chest down'
  | 'Lock out at the top'
  | 'Hold the bottom briefly'
  | null;

type FormAnalysis = {
  hint: FormHint;
  trackingReady: boolean;
  isStrictTop: boolean;
  isStrictBottom: boolean;
  shoulderY: number;
};

function analyzeForm(
  landmarks: Point[],
  topShoulderY: number | null,
  topHeadY: number | null
): FormAnalysis | null {
  const body = upperBodyMetrics(landmarks);

  if (!body) {
    return {
      hint: 'Frame your head and shoulders',
      trackingReady: false,
      isStrictTop: false,
      isStrictBottom: false,
      shoulderY: 0
    };
  }

  if (!inHeadShouldersFrame(body)) {
    return {
      hint: 'Frame your head and shoulders',
      trackingReady: false,
      isStrictTop: false,
      isStrictBottom: false,
      shoulderY: body.shoulders.y
    };
  }

  const wristSpread = Math.abs(body.wrists.x - body.shoulders.x);
  if (wristSpread < MIN_WRIST_SPREAD) {
    return {
      hint: 'Show both arms from shoulders to wrists',
      trackingReady: false,
      isStrictTop: false,
      isStrictBottom: false,
      shoulderY: body.shoulders.y
    };
  }

  const shoulderTilt = Math.abs(
    landmarks[LEFT_SHOULDER].y - landmarks[RIGHT_SHOULDER].y
  );
  if (shoulderTilt > MAX_SHOULDER_TILT) {
    return {
      hint: 'Keep shoulders level',
      trackingReady: false,
      isStrictTop: false,
      isStrictBottom: false,
      shoulderY: body.shoulders.y
    };
  }

  if (Math.abs(body.leftAngle - body.rightAngle) > MAX_ARM_ANGLE_DIFF) {
    return {
      hint: 'Arms uneven — match both sides',
      trackingReady: false,
      isStrictTop: false,
      isStrictBottom: false,
      shoulderY: body.shoulders.y
    };
  }

  const headDropped =
    topHeadY === null || body.head.y >= topHeadY + MIN_HEAD_DROP;
  const shouldersDropped =
    topShoulderY === null || body.shoulders.y >= topShoulderY + MIN_SHOULDER_DROP;
  const chestNearFloor = body.head.y >= body.elbows.y - MAX_CHEST_ABOVE_ELBOW;

  const isStrictBottom =
    body.avgAngle <= DOWN_ELBOW_ANGLE &&
    chestNearFloor &&
    headDropped &&
    shouldersDropped;

  const isStrictTop = body.avgAngle >= UP_ELBOW_ANGLE;

  let hint: FormHint = null;
  if (!isStrictTop && !isStrictBottom) {
    hint = chestNearFloor ? 'Lock out at the top' : 'Go lower — head and chest down';
  }

  return {
    hint,
    trackingReady: true,
    isStrictTop,
    isStrictBottom,
    shoulderY: body.shoulders.y
  };
}

export function detectPushupPhase(landmarks: Point[]): PushupPhase {
  const body = upperBodyMetrics(landmarks);
  if (!body) return 'unknown';
  if (body.avgAngle <= DOWN_ELBOW_ANGLE) return 'down';
  if (body.avgAngle >= UP_ELBOW_ANGLE) return 'up';
  return 'unknown';
}

export class PushupRepCounter {
  private phase: PushupPhase = 'unknown';
  private stableFrames = 0;
  private framesInDown = 0;
  private downValidated = false;
  private topShoulderY: number | null = null;
  private topHeadY: number | null = null;
  private reps = 0;
  private formHint: FormHint = null;

  reset() {
    this.phase = 'unknown';
    this.stableFrames = 0;
    this.framesInDown = 0;
    this.downValidated = false;
    this.topShoulderY = null;
    this.topHeadY = null;
    this.reps = 0;
    this.formHint = null;
  }

  update(landmarks: Point[]): number {
    const form = analyzeForm(landmarks, this.topShoulderY, this.topHeadY);
    const head = headPoint(landmarks);

    if (!form || !form.trackingReady) {
      this.stableFrames = 0;
      this.framesInDown = 0;
      this.downValidated = false;
      this.formHint = form?.hint ?? 'Frame your head and shoulders';
      return this.reps;
    }

    let candidate: PushupPhase = 'unknown';
    if (form.isStrictBottom) candidate = 'down';
    else if (form.isStrictTop) candidate = 'up';

    if (candidate === 'unknown') {
      this.stableFrames = 0;
      this.formHint = form.hint ?? 'Go lower — head and chest down';
      return this.reps;
    }

    if (candidate === this.phase) {
      this.stableFrames = 0;

      if (this.phase === 'down') {
        this.framesInDown += 1;
        if (this.framesInDown >= MIN_FRAMES_IN_DOWN) {
          this.downValidated = true;
        } else {
          this.formHint = 'Hold the bottom briefly';
        }
      }

      if (this.phase === 'up') {
        this.topShoulderY = form.shoulderY;
        if (head) this.topHeadY = head.y;
        this.formHint = form.hint;
      }

      return this.reps;
    }

    this.stableFrames += 1;
    if (this.stableFrames < STABLE_FRAMES) {
      return this.reps;
    }

    const prevPhase = this.phase;

    if (prevPhase === 'down' && candidate === 'up' && this.downValidated) {
      this.reps += 1;
      this.formHint = null;
    } else {
      this.formHint = form.hint;
    }

    if (candidate === 'up') {
      this.topShoulderY = form.shoulderY;
      if (head) this.topHeadY = head.y;
      this.framesInDown = 0;
      this.downValidated = false;
    }

    if (candidate === 'down') {
      this.framesInDown = 1;
      this.downValidated = false;
      this.formHint = 'Hold the bottom briefly';
    }

    this.phase = candidate;
    this.stableFrames = 0;
    return this.reps;
  }

  get count() {
    return this.reps;
  }

  get hint(): FormHint {
    return this.formHint;
  }
}
