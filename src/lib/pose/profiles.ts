import {
  ARMS,
  FEET,
  LEGS,
  TORSO_LEGS,
  aboveHips,
  ankles,
  bodyTilt,
  elbowAvg,
  elbowMin,
  heelLift,
  hipAnkle,
  hipHeight,
  hipKnee,
  kneeAvg,
  kneeMax,
  kneeMin,
  shoulders,
  torsoTilt
} from './measures';
import type { Point, RepPhase } from './types';

/**
 * How the camera understands every exercise.
 *
 * Rep moves watch one measurement (an angle or a height) and count a rep on
 * each full cycle: 'down' (the hard end of the movement) then back 'up'.
 * Hysteresis between the two thresholds stops jitter from counting.
 *
 * Holds don't count reps: the camera checks you're actually in position and
 * only the time held in good form counts, with a hint when form slips.
 */

export type CameraView = 'floor_side' | 'standing_side' | 'bar_front' | 'seated_side';
export type HoldFix = 'hips_level' | 'lift_shoulders_legs' | 'lift_legs' | 'lift_chest' | 'sink_deeper' | 'reach_forward' | 'get_into_position';

type Measure = (lm: Point[]) => number | null;

export type RepProfile = {
  kind: 'reps';
  measure: Measure;
  /** Value at (or past) the hard end of the movement. */
  down: number;
  /** Value back at the start of the movement. */
  up: number;
  /** true when larger values mean "down" (heel lift, torso curl). */
  rising?: boolean;
  /** Where a set starts ('up' for most; bridges start lying 'down'). */
  start: 'up' | 'down';
  keys: number[];
  view: CameraView;
};

export type HoldProfile = {
  kind: 'hold';
  /** null: can't see enough; ok: in position; otherwise what to fix. */
  check: (lm: Point[]) => { ok: true } | { ok: false; fix: HoldFix } | null;
  keys: number[];
  view: CameraView;
};

export type PoseProfile = RepProfile | HoldProfile;

const reps = (measure: Measure, down: number, up: number, view: CameraView, keys: number[], extra: Partial<RepProfile> = {}): RepProfile => ({
  kind: 'reps',
  measure,
  down,
  up,
  start: 'up',
  keys,
  view,
  ...extra
});

/** A straight body line held roughly level (planks). */
const plankCheck = (maxTilt: number) => (lm: Point[]) => {
  const line = hipAnkle(lm);
  const tilt = bodyTilt(lm);
  if (line === null || tilt === null) return null;
  if (tilt > maxTilt) return { ok: false as const, fix: 'get_into_position' as const };
  if (line < 155) return { ok: false as const, fix: 'hips_level' as const };
  return { ok: true as const };
};

export const PROFILES: Record<string, PoseProfile> = {
  // ---- Push: elbow angle ----
  pushups: reps(elbowAvg, 110, 150, 'floor_side', ARMS),
  'incline-pushups': reps(elbowAvg, 110, 150, 'floor_side', ARMS),
  'diamond-pushups': reps(elbowAvg, 105, 150, 'floor_side', ARMS),
  'pike-pushups': reps(elbowAvg, 105, 150, 'floor_side', ARMS),
  'backpack-pushups': reps(elbowAvg, 110, 150, 'floor_side', ARMS),
  'archer-pushups': reps(elbowMin, 100, 150, 'floor_side', ARMS),
  dips: reps(elbowAvg, 100, 150, 'standing_side', ARMS),
  'bench-press': reps(elbowAvg, 100, 150, 'floor_side', ARMS),

  // ---- Pull: elbow angle (top of the pull = "down") ----
  'pull-ups': reps(elbowAvg, 80, 145, 'bar_front', ARMS),
  'chin-ups': reps(elbowAvg, 80, 145, 'bar_front', ARMS),
  'negative-pull-ups': reps(elbowAvg, 80, 145, 'bar_front', ARMS),
  'backpack-pull-ups': reps(elbowAvg, 80, 145, 'bar_front', ARMS),
  'inverted-rows': reps(elbowAvg, 95, 145, 'floor_side', ARMS),
  'inverted-floor-rows': reps(elbowAvg, 95, 145, 'floor_side', ARMS),
  'doorway-rows': reps(elbowAvg, 95, 145, 'standing_side', ARMS),
  'superman-pulls': reps(elbowAvg, 110, 150, 'floor_side', ARMS),

  // ---- Squat: knee angle ----
  squats: reps(kneeAvg, 115, 155, 'standing_side', LEGS),
  'jump-squats': reps(kneeAvg, 115, 155, 'standing_side', LEGS),
  'backpack-squats': reps(kneeAvg, 115, 155, 'standing_side', LEGS),
  'goblet-squats': reps(kneeAvg, 115, 155, 'standing_side', LEGS),
  lunges: reps(kneeMin, 110, 155, 'standing_side', LEGS),
  'bulgarian-splits': reps(kneeMin, 110, 155, 'standing_side', LEGS),
  'pistol-squats': reps(kneeMin, 100, 155, 'standing_side', LEGS),
  'step-ups': reps(kneeMin, 125, 160, 'standing_side', LEGS),

  // ---- Hips ----
  // Bridges start lying ("down") and count each time the hips reach the top.
  'glute-bridges': reps(hipKnee, 140, 162, 'floor_side', TORSO_LEGS, { start: 'down' }),
  'single-leg-bridges': reps(hipKnee, 140, 162, 'floor_side', TORSO_LEGS, { start: 'down' }),
  // Crunches: the torso curls up off the floor.
  crunches: reps(torsoTilt, 22, 12, 'floor_side', TORSO_LEGS, { rising: true }),
  'leg-raises': reps(hipAnkle, 110, 160, 'floor_side', TORSO_LEGS),
  'hanging-knee-raises': reps(hipKnee, 110, 155, 'bar_front', TORSO_LEGS),
  'hanging-leg-raises': reps(hipAnkle, 110, 160, 'bar_front', TORSO_LEGS),

  // ---- Whole body / feet ----
  burpees: reps(hipHeight, 0.35, 0.8, 'standing_side', TORSO_LEGS),
  'calf-raises': reps(heelLift, 0.12, 0.05, 'standing_side', FEET, { rising: true }),

  // ---- Holds: form checks ----
  planks: { kind: 'hold', check: plankCheck(35), keys: TORSO_LEGS, view: 'floor_side' },
  'side-planks': { kind: 'hold', check: plankCheck(40), keys: TORSO_LEGS, view: 'floor_side' },
  'hollow-body': {
    kind: 'hold',
    keys: TORSO_LEGS,
    view: 'floor_side',
    check: (lm) => {
      const s = aboveHips(lm, shoulders);
      const a = aboveHips(lm, ankles);
      const tilt = bodyTilt(lm);
      if (s === null || a === null || tilt === null) return null;
      if (tilt > 35) return { ok: false, fix: 'get_into_position' };
      return s && a ? { ok: true } : { ok: false, fix: 'lift_shoulders_legs' };
    }
  },
  'l-sit': {
    kind: 'hold',
    keys: TORSO_LEGS,
    view: 'seated_side',
    check: (lm) => {
      const hip = hipAnkle(lm);
      const knee = kneeMax(lm);
      const torso = torsoTilt(lm);
      if (hip === null || knee === null || torso === null) return null;
      if (torso < 50) return { ok: false, fix: 'get_into_position' };
      return hip <= 120 && knee >= 145 ? { ok: true } : { ok: false, fix: 'lift_legs' };
    }
  },
  'cobra-stretch': {
    kind: 'hold',
    keys: TORSO_LEGS,
    view: 'floor_side',
    check: (lm) => {
      const torso = torsoTilt(lm);
      const height = hipHeight(lm);
      if (torso === null || height === null) return null;
      if (height > 0.45) return { ok: false, fix: 'get_into_position' };
      return torso >= 22 ? { ok: true } : { ok: false, fix: 'lift_chest' };
    }
  },
  'couch-stretch': {
    kind: 'hold',
    keys: TORSO_LEGS,
    view: 'standing_side',
    check: (lm) => {
      const knee = kneeMin(lm);
      const torso = torsoTilt(lm);
      if (knee === null || torso === null) return null;
      if (torso < 45) return { ok: false, fix: 'get_into_position' };
      return knee <= 80 ? { ok: true } : { ok: false, fix: 'sink_deeper' };
    }
  },
  'seated-hamstring-stretch': {
    kind: 'hold',
    keys: TORSO_LEGS,
    view: 'seated_side',
    check: (lm) => {
      const knee = kneeMax(lm);
      const hip = hipAnkle(lm);
      if (knee === null || hip === null) return null;
      if (knee < 140) return { ok: false, fix: 'get_into_position' };
      return hip <= 110 ? { ok: true } : { ok: false, fix: 'reach_forward' };
    }
  }
};

export function profileFor(exerciseId: string): PoseProfile | null {
  return PROFILES[exerciseId] ?? null;
}

/** The rep phase for a frame (rep profiles only). */
export function repPhase(profile: RepProfile, lm: Point[]): RepPhase {
  const v = profile.measure(lm);
  if (v === null) return 'unknown';
  if (profile.rising) {
    if (v >= profile.down) return 'down';
    if (v <= profile.up) return 'up';
  } else {
    if (v <= profile.down) return 'down';
    if (v >= profile.up) return 'up';
  }
  return 'unknown';
}
