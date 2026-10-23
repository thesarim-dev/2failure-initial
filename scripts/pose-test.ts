import { createRepCounter, isHoldCounter } from '../src/lib/pose/repCounterFactory';
import { PROFILES } from '../src/lib/pose/profiles';
import { assessStartingPosition } from '../src/lib/pose/startingPosition';
import type { Point } from '../src/lib/pose/types';

// ---- A 2D stick figure from joint directions (degrees; 0 = right, 90 = up) ----
type P = { torso: number; thigh: number; thighL?: number; thighR?: number; knee?: number; kneeL?: number; kneeR?: number; arm?: number; elbow?: number; elbowL?: number; elbowR?: number; heel?: number };
const rad = (d: number) => (d * Math.PI) / 180;
const step = (p: { x: number; y: number }, dir: number, len: number) => ({ x: p.x + Math.cos(rad(dir)) * len, y: p.y - Math.sin(rad(dir)) * len });
let jitter = 0;
const j = () => (Math.random() - 0.5) * 2 * jitter;
function figure(p: P, drop = false): Point[] {
  const lm: Point[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.95 }));
  const hip = { x: 0.5, y: 0.55 };
  const shoulder = step(hip, p.torso + j(), 0.25);
  const side = (s: 'L' | 'R', dx: number) => {
    const thigh = (s === 'L' ? p.thighL : p.thighR) ?? p.thigh;
    const knee = step(hip, thigh + j(), 0.2);
    const kneeAngle = (s === 'L' ? p.kneeL : p.kneeR) ?? p.knee ?? 178;
    const shinDir = thigh - (180 - kneeAngle) + j();
    const ankle = step(knee, shinDir, 0.2);
    const elbow = step(shoulder, (p.arm ?? -90) + j(), 0.14);
    const elbowAngle = (s === 'L' ? p.elbowL : p.elbowR) ?? p.elbow ?? 175;
    const wrist = step(elbow, (p.arm ?? -90) + (180 - elbowAngle) + j(), 0.13);
    const toe = { x: ankle.x + 0.06, y: ankle.y + 0.005 };
    const heel = { x: ankle.x - 0.02, y: ankle.y + 0.01 - (p.heel ?? 0) * 0.2 };
    const put = (i: number, q: { x: number; y: number }) => (lm[i] = { x: q.x + dx, y: q.y, visibility: drop ? 0.1 : 0.95 });
    const L = s === 'L';
    put(L ? 11 : 12, shoulder); put(L ? 13 : 14, elbow); put(L ? 15 : 16, wrist);
    put(L ? 23 : 24, hip); put(L ? 25 : 26, knee); put(L ? 27 : 28, ankle);
    put(L ? 29 : 30, heel); put(L ? 31 : 32, toe);
  };
  side('L', -0.004);
  side('R', 0.004);
  return lm;
}

// ---- Scenarios: the start pose and the change at the hard end of each rep ----
const plank = { torso: 0, thigh: 180 };
const stand = { torso: 90, thigh: 270 };
const hang = { torso: 90, thigh: 270, arm: 90 };
const supine = { torso: 180, thigh: 0 };
type S = { start: P; down: Partial<P>; half: Partial<P>; via?: Partial<P> };
const R: Record<string, S> = {
  pushups: { start: { ...plank, elbow: 172 }, down: { elbow: 80 }, half: { elbow: 130 } },
  'incline-pushups': { start: { ...plank, elbow: 172 }, down: { elbow: 85 }, half: { elbow: 130 } },
  'diamond-pushups': { start: { ...plank, elbow: 172 }, down: { elbow: 80 }, half: { elbow: 128 } },
  'pike-pushups': { start: { ...plank, elbow: 172 }, down: { elbow: 80 }, half: { elbow: 128 } },
  'backpack-pushups': { start: { ...plank, elbow: 172 }, down: { elbow: 82 }, half: { elbow: 130 } },
  'archer-pushups': { start: { ...plank, elbow: 172 }, down: { elbowL: 75, elbowR: 172 }, half: { elbowL: 128, elbowR: 172 } },
  dips: { start: { ...stand, elbow: 172 }, down: { elbow: 85 }, half: { elbow: 125 } },
  'bench-press': { start: { ...supine, arm: 90, elbow: 172 }, down: { elbow: 80 }, half: { elbow: 125 } },
  'pull-ups': { start: { ...hang, elbow: 172 }, down: { elbow: 60 }, half: { elbow: 112 } },
  'chin-ups': { start: { ...hang, elbow: 172 }, down: { elbow: 60 }, half: { elbow: 112 } },
  'negative-pull-ups': { start: { ...hang, elbow: 172 }, down: { elbow: 60 }, half: { elbow: 112 } },
  'backpack-pull-ups': { start: { ...hang, elbow: 172 }, down: { elbow: 62 }, half: { elbow: 112 } },
  'inverted-rows': { start: { torso: 20, thigh: 200, arm: 70, elbow: 172 }, down: { elbow: 75 }, half: { elbow: 120 } },
  'inverted-floor-rows': { start: { torso: 10, thigh: 190, arm: 80, elbow: 172 }, down: { elbow: 75 }, half: { elbow: 120 } },
  'doorway-rows': { start: { ...stand, arm: 0, elbow: 172 }, down: { elbow: 75 }, half: { elbow: 120 } },
  'superman-pulls': { start: { ...plank, arm: 0, elbow: 172 }, down: { elbow: 90 }, half: { elbow: 130 } },
  squats: { start: { ...stand, knee: 176 }, down: { knee: 85, thigh: 340 }, half: { knee: 135, thigh: 300 } },
  'jump-squats': { start: { ...stand, knee: 176 }, down: { knee: 90, thigh: 340 }, half: { knee: 135, thigh: 300 } },
  'backpack-squats': { start: { ...stand, knee: 176 }, down: { knee: 90, thigh: 340 }, half: { knee: 135, thigh: 300 } },
  'goblet-squats': { start: { ...stand, knee: 176 }, down: { knee: 85, thigh: 340 }, half: { knee: 135, thigh: 300 } },
  lunges: { start: { ...stand, knee: 176 }, down: { kneeL: 90, kneeR: 120 }, half: { kneeL: 132, kneeR: 165 } },
  'bulgarian-splits': { start: { ...stand, knee: 176 }, down: { kneeL: 88, kneeR: 110 }, half: { kneeL: 132, kneeR: 165 } },
  'pistol-squats': { start: { ...stand, knee: 176 }, down: { kneeL: 70, kneeR: 176 }, half: { kneeL: 128, kneeR: 176 } },
  'step-ups': { start: { ...stand, knee: 176 }, down: { kneeL: 100, kneeR: 176 }, half: { kneeL: 142, kneeR: 176 } },
  'glute-bridges': { start: { torso: 175, thigh: 50, knee: 80 }, down: { thigh: 5 }, half: { thigh: 30 } },
  'single-leg-bridges': { start: { torso: 175, thigh: 50, knee: 80 }, down: { thigh: 5 }, half: { thigh: 30 } },
  crunches: { start: { ...supine, knee: 90, thigh: 45 }, down: { torso: 148 }, half: { torso: 163 } },
  'leg-raises': { start: { ...supine }, down: { thigh: 85 }, half: { thigh: 45 } },
  'hanging-knee-raises': { start: { ...hang }, down: { thigh: 0, knee: 90 }, half: { thigh: 315, knee: 120 } },
  'hanging-leg-raises': { start: { ...hang }, down: { thigh: 0 }, half: { thigh: 315 } },
  'calf-raises': { start: { ...stand }, down: { heel: 0.2 }, half: { heel: 0.085 } },
  'single-leg-calf-raises': { start: { ...stand }, down: { heel: 0.2 }, half: { heel: 0.085 } },
  'incline-pike-pushups': { start: { ...plank, elbow: 172 }, down: { elbow: 80 }, half: { elbow: 128 } },
  'elevated-pike-pushups': { start: { ...plank, elbow: 172 }, down: { elbow: 80 }, half: { elbow: 128 } },
  'wall-handstand-pushups': { start: { ...plank, elbow: 172 }, down: { elbow: 80 }, half: { elbow: 128 } },
  // Presses start bent at the shoulders; "down" here is the other end (the lockout).
  'dumbbell-shoulder-press': { start: { ...stand, arm: 0, elbow: 80 }, down: { arm: 90, elbow: 172 }, half: { elbow: 125 } },
  'barbell-overhead-press': { start: { ...stand, arm: 0, elbow: 80 }, down: { arm: 90, elbow: 172 }, half: { elbow: 125 } },
  'dumbbell-rows': { start: { torso: 40, thigh: 270, arm: -90, elbow: 172 }, down: { elbow: 75 }, half: { elbow: 120 } },
  'barbell-rows': { start: { torso: 40, thigh: 270, arm: -90, elbow: 172 }, down: { elbow: 75 }, half: { elbow: 120 } },
  'prone-ytw-raises': { start: { ...plank, arm: 0, elbow: 175 }, down: { arm: 25 }, half: { arm: 9 } },
  'barbell-back-squats': { start: { ...stand, knee: 176 }, down: { knee: 85, thigh: 340 }, half: { knee: 135, thigh: 300 } },
  'single-leg-rdls': { start: { ...stand }, down: { torso: 30, thigh: 260 }, half: { torso: 58 } },
  'backpack-rdls': { start: { ...stand }, down: { torso: 30, thigh: 260 }, half: { torso: 58 } },
  'dumbbell-rdls': { start: { ...stand }, down: { torso: 30, thigh: 260 }, half: { torso: 58 } },
  'barbell-deadlifts': { start: { ...stand }, down: { torso: 25, thigh: 255 }, half: { torso: 58 } },
  'nordic-curls': { start: { torso: 90, thigh: 270, knee: 90 }, down: { torso: 30, thigh: 210, knee: 150 }, half: { torso: 60, thigh: 240, knee: 120 } },
  'dead-bugs': { start: { torso: 180, thigh: 90, knee: 90 }, down: { thighL: 0, kneeL: 178 }, half: { thighL: 60, kneeL: 110 } },
  'bird-dogs': { start: { torso: 0, thigh: 270, knee: 90 }, down: { thighL: 180, kneeL: 178 }, half: { thighL: 225 } },
  'side-plank-hip-dips': { start: { ...plank }, down: { torso: 15, thigh: 165 }, half: { torso: 7, thigh: 173 } }
};
const H: Record<string, { good: P; bad: P; fix: string }> = {
  planks: { good: { ...plank, torso: 2, thigh: 181 }, bad: { torso: 20, thigh: 160 }, fix: 'hips_level' },
  'side-planks': { good: { ...plank, torso: 4, thigh: 182 }, bad: { torso: 22, thigh: 158 }, fix: 'hips_level' },
  'hollow-body': { good: { torso: 168, thigh: 12 }, bad: { torso: 180, thigh: 0 }, fix: 'lift_shoulders_legs' },
  'l-sit': { good: { torso: 92, thigh: 0, arm: -90 }, bad: { torso: 92, thigh: 300 }, fix: 'lift_legs' },
  'cobra-stretch': { good: { torso: 28, thigh: 180, arm: -90 }, bad: { torso: 4, thigh: 180 }, fix: 'lift_chest' },
  'couch-stretch': { good: { torso: 90, thigh: 300, kneeL: 60, kneeR: 95 }, bad: { torso: 90, thigh: 300, kneeL: 120, kneeR: 100 }, fix: 'sink_deeper' },
  'seated-hamstring-stretch': { good: { torso: 75, thigh: 0 }, bad: { torso: 125, thigh: 0 }, fix: 'reach_forward' },
  'knee-side-planks': { good: { torso: 20, thigh: 200, knee: 90 }, bad: { torso: 20, thigh: 230, knee: 90 }, fix: 'hips_level' },
  'childs-pose': { good: { torso: 15, thigh: 300, knee: 40 }, bad: { torso: 70, thigh: 300, knee: 40 }, fix: 'sink_deeper' },
  'pigeon-stretch': { good: { torso: 80, thigh: 0, kneeL: 80, kneeR: 178 }, bad: { torso: 80, thigh: 0, kneeL: 150, kneeR: 178 }, fix: 'sink_deeper' }
};

// ---- Run ----
const frames = (p: P, n: number, drop = false) => Array.from({ length: n }, () => figure(p, drop));
let fails = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) {
    fails++;
    console.log('  FAIL', msg);
  }
};
let now = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });

console.log(`Profiles: ${Object.keys(PROFILES).length}`);
for (const [id, sc] of Object.entries(R)) {
  jitter = 4;
  const c = createRepCounter(id);
  const go = (lms: Point[][]) => lms.forEach((lm) => c.update(lm));
  const down = { ...sc.start, ...sc.down };
  const half = { ...sc.start, ...sc.half };
  // Each scenario's start pose is the natural start (lying for bridges, standing/top for the rest).
  const start = sc.start;
  const other = down;
  go(frames(start, 15));
  for (let r = 0; r < 5; r++) {
    go(frames(other, 12));
    if (r === 2) go(frames(other, 4, true)); // brief tracking dropout mid-rep
    go(frames(start, 12));
  }
  const full = c.count;
  for (let r = 0; r < 3; r++) {
    go(frames(half, 12));
    go(frames(start, 12));
  }
  const afterHalf = c.count;
  jitter = 0;
  const startOk = assessStartingPosition(id, figure(start), 120).readiness === 'good';
  const wrong = assessStartingPosition(id, figure(other), 120);
  check(full === 5, `${id}: 5 reps counted as ${full}`);
  check(afterHalf === 5, `${id}: half reps added ${afterHalf - full}`);
  check(startOk, `${id}: correct start not recognised`);
  check(wrong.readiness === 'bad', `${id}: wrong start accepted`);
  console.log(`${id.padEnd(22)} 5 reps → ${full} | 3 half reps → +${afterHalf - full} | start ok: ${startOk} | wrong start: "${wrong.guidance}"`);
}
for (const [id, sc] of Object.entries(H)) {
  jitter = 2;
  const c = createRepCounter(id);
  if (!isHoldCounter(c)) {
    check(false, `${id}: not a hold`);
    continue;
  }
  const run = (p: P, seconds: number) => {
    let fix: string | null = null;
    for (let f = 0; f < seconds * 30; f++) {
      now += 1000 / 30;
      c.update(figure(p));
      fix = c.fix;
    }
    return fix;
  };
  const g1 = run(sc.good, 6);
  const b = run(sc.bad, 3);
  run(sc.good, 4);
  const startOk = assessStartingPosition(id, figure(sc.good), 120).readiness === 'good';
  check(Math.abs(c.count - 10) <= 1, `${id}: held ${c.count}s, expected ~10`);
  check(g1 === 'ok', `${id}: good form read as ${g1}`);
  check(b === sc.fix, `${id}: bad form gave ${b}, expected ${sc.fix}`);
  check(startOk, `${id}: good position not accepted as start`);
  console.log(`${id.padEnd(22)} 6s good + 3s bad + 4s good → held ${c.count}s | bad form says "${b}" | start ok: ${startOk}`);
}
const missing = Object.keys(PROFILES).filter((id) => !(id in R) && !(id in H));
check(missing.length === 0, `untested profiles: ${missing.join(', ')}`);
console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
