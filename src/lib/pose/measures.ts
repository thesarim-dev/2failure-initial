import { isVisible, jointAngle } from './jointAngle';
import type { Point } from './types';

/**
 * Body measurements from MediaPipe pose landmarks (33 points). Each returns
 * null when the joints it needs aren't clearly visible, so counters never
 * act on guesses.
 */

export const LM = {
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
  L_HEEL: 29,
  R_HEEL: 30,
  L_TOE: 31,
  R_TOE: 32
} as const;

export const ARMS = [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_ELBOW, LM.R_ELBOW, LM.L_WRIST, LM.R_WRIST];
export const LEGS = [LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE];
export const TORSO_LEGS = [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE];
export const FEET = [LM.L_ANKLE, LM.R_ANKLE, LM.L_HEEL, LM.R_HEEL, LM.L_TOE, LM.R_TOE];

type Side = { a: number; b: number; c: number };
const sides = (l: Side, r: Side) => [l, r];

function anglesOf(lm: Point[], pairs: Side[]): number[] {
  const out: number[] = [];
  for (const { a, b, c } of pairs) {
    if (isVisible(lm[a]) && isVisible(lm[b]) && isVisible(lm[c])) out.push(jointAngle(lm[a], lm[b], lm[c]));
  }
  return out;
}
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const min = (xs: number[]) => (xs.length ? Math.min(...xs) : null);

const ELBOWS = sides({ a: LM.L_SHOULDER, b: LM.L_ELBOW, c: LM.L_WRIST }, { a: LM.R_SHOULDER, b: LM.R_ELBOW, c: LM.R_WRIST });
const KNEES = sides({ a: LM.L_HIP, b: LM.L_KNEE, c: LM.L_ANKLE }, { a: LM.R_HIP, b: LM.R_KNEE, c: LM.R_ANKLE });
const HIPS_KNEE = sides({ a: LM.L_SHOULDER, b: LM.L_HIP, c: LM.L_KNEE }, { a: LM.R_SHOULDER, b: LM.R_HIP, c: LM.R_KNEE });
const HIPS_ANKLE = sides({ a: LM.L_SHOULDER, b: LM.L_HIP, c: LM.L_ANKLE }, { a: LM.R_SHOULDER, b: LM.R_HIP, c: LM.R_ANKLE });

/** Elbow angle (180 = straight arm). */
export const elbowAvg = (lm: Point[]) => avg(anglesOf(lm, ELBOWS));
/** The more bent elbow (one-arm-dominant moves like archer pushups). */
export const elbowMin = (lm: Point[]) => min(anglesOf(lm, ELBOWS));
/** Knee angle (180 = straight leg). */
export const kneeAvg = (lm: Point[]) => avg(anglesOf(lm, KNEES));
/** The working (more bent) knee: lunges, split squats, pistols, step-ups. */
export const kneeMin = (lm: Point[]) => min(anglesOf(lm, KNEES));
/** Straighter knee (the extended leg in an L-sit or hamstring stretch). */
export const kneeMax = (lm: Point[]) => {
  const xs = anglesOf(lm, KNEES);
  return xs.length ? Math.max(...xs) : null;
};
/** Shoulder–hip–knee angle: hip flexion with bent legs (bridges, crunches, knee raises). */
export const hipKnee = (lm: Point[]) => avg(anglesOf(lm, HIPS_KNEE));
/** Shoulder–hip–ankle angle: body line / hip flexion with straight legs. */
export const hipAnkle = (lm: Point[]) => avg(anglesOf(lm, HIPS_ANKLE));

function mid(lm: Point[], a: number, b: number): Point | null {
  const pa = isVisible(lm[a]) ? lm[a] : null;
  const pb = isVisible(lm[b]) ? lm[b] : null;
  if (pa && pb) return { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
  return pa ?? pb;
}
export const shoulders = (lm: Point[]) => mid(lm, LM.L_SHOULDER, LM.R_SHOULDER);
export const hips = (lm: Point[]) => mid(lm, LM.L_HIP, LM.R_HIP);
export const ankles = (lm: Point[]) => mid(lm, LM.L_ANKLE, LM.R_ANKLE);

/** How far the body line is from horizontal, in degrees (0 = flat, 90 = upright). */
export function bodyTilt(lm: Point[]): number | null {
  const s = shoulders(lm);
  const a = ankles(lm);
  if (!s || !a) return null;
  return (Math.atan2(Math.abs(a.y - s.y), Math.abs(a.x - s.x)) * 180) / Math.PI;
}

/** Torso angle from horizontal, in degrees (0 = lying, 90 = upright). */
export function torsoTilt(lm: Point[]): number | null {
  const s = shoulders(lm);
  const h = hips(lm);
  if (!s || !h) return null;
  return (Math.atan2(Math.abs(h.y - s.y), Math.abs(h.x - s.x)) * 180) / Math.PI;
}

/** Hip height above the feet, as a share of leg length (≈1 standing, ≈0 on the floor). */
export function hipHeight(lm: Point[]): number | null {
  const h = hips(lm);
  const a = ankles(lm);
  const k = mid(lm, LM.L_KNEE, LM.R_KNEE);
  if (!h || !a || !k) return null;
  const leg = Math.hypot(k.x - h.x, k.y - h.y) + Math.hypot(a.x - k.x, a.y - k.y);
  if (leg <= 0) return null;
  return (a.y - h.y) / leg;
}

/** Heel lift relative to the toes, as a share of shin length (0 flat, ~0.2 on tiptoe). */
export function heelLift(lm: Point[]): number | null {
  const vals: number[] = [];
  for (const [heel, toe, ankle, knee] of [
    [LM.L_HEEL, LM.L_TOE, LM.L_ANKLE, LM.L_KNEE],
    [LM.R_HEEL, LM.R_TOE, LM.R_ANKLE, LM.R_KNEE]
  ]) {
    if (![heel, toe, ankle, knee].every((i) => isVisible(lm[i]))) continue;
    const shin = Math.hypot(lm[knee].x - lm[ankle].x, lm[knee].y - lm[ankle].y);
    if (shin > 0) vals.push((lm[toe].y - lm[heel].y) / shin);
  }
  return avg(vals);
}

/** Are the given body parts (shoulders, ankles…) higher than the hips? */
export function aboveHips(lm: Point[], part: (lm: Point[]) => Point | null, margin = 0.02): boolean | null {
  const p = part(lm);
  const h = hips(lm);
  if (!p || !h) return null;
  return p.y < h.y - margin;
}
