import { useMemo } from 'react';
import { buildableBounds } from '../../game/catalog';
import { occupancy, type GameState } from '../../game/engine';

/**
 * Little life on the island: animals that wander back and forth, ducks on
 * ponds and butterflies over flowers. Barns and coops bring more animals.
 * Uses SVG motion (no state updates), and stays still for reduced motion.
 */

type Kind = 'cow' | 'sheep' | 'chicken' | 'bunny' | 'duck' | 'pig' | 'dog' | 'cat' | 'fox';

/** Small seeded random generator, so animals stay put while you're on the screen. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Cow() {
  return (
    <g>
      <ellipse cx={0} cy={14} rx={18} ry={4} fill="#000" opacity={0.25} />
      {[-10, -4, 6, 11].map((x) => (
        <rect key={x} x={x - 1.5} y={4} width={3} height={9} rx={1} fill="#3a3a3a" />
      ))}
      <ellipse cx={0} cy={0} rx={15} ry={9} fill="#f4f4f0" />
      <ellipse cx={-5} cy={-3} rx={5} ry={4} fill="#2a2a2a" />
      <ellipse cx={6} cy={3} rx={4} ry={3} fill="#2a2a2a" />
      <path d="M-15 -2 q-5 2 -4 9" stroke="#f4f4f0" strokeWidth={2} fill="none" strokeLinecap="round" />
      <ellipse cx={15} cy={-6} rx={7} ry={6} fill="#f4f4f0" />
      <ellipse cx={19} cy={-4} rx={4} ry={3} fill="#f5a3b5" />
      <circle cx={14} cy={-8} r={1.3} fill="#1a1a1a" />
      <path d="M11 -11 l-2 -4 M17 -12 l2 -4" stroke="#d8c8a0" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function Sheep() {
  return (
    <g>
      <ellipse cx={0} cy={13} rx={16} ry={4} fill="#000" opacity={0.25} />
      {[-8, -3, 4, 9].map((x) => (
        <rect key={x} x={x - 1.3} y={4} width={2.6} height={8} rx={1} fill="#2a2a2a" />
      ))}
      {[
        [-8, -1],
        [-2, -4],
        [5, -2],
        [0, 3],
        [-6, 4],
        [7, 3]
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={6} fill="#f7f2e6" />
      ))}
      <ellipse cx={13} cy={-4} rx={5} ry={6} fill="#2a2a2a" />
      <circle cx={14} cy={-6} r={1.1} fill="#ffffff" />
    </g>
  );
}

function Chicken() {
  return (
    <g>
      <ellipse cx={0} cy={9} rx={8} ry={2.5} fill="#000" opacity={0.25} />
      <path d="M-2 5 v4 M2 5 v4" stroke="#f2a541" strokeWidth={1.6} strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={7} ry={6} fill="#ffffff" />
      <path d="M-7 -1 q-4 -3 -2 -7 q2 3 4 3 Z" fill="#ffffff" />
      <circle cx={5} cy={-5} r={3.6} fill="#ffffff" />
      <path d="M4 -9 q1 -2 2 0 q1 -2 2 0" fill="#e5484d" />
      <polygon points="8.5,-5 11.5,-4 8.5,-3" fill="#f2a541" />
      <circle cx={6} cy={-6} r={0.9} fill="#1a1a1a" />
    </g>
  );
}

function Bunny() {
  return (
    <g>
      <ellipse cx={0} cy={9} rx={9} ry={2.5} fill="#000" opacity={0.25} />
      <ellipse cx={-1} cy={2} rx={8} ry={6} fill="#c9b8a6" />
      <circle cx={-8} cy={1} r={2.5} fill="#ffffff" />
      <circle cx={6} cy={-2} r={4.5} fill="#c9b8a6" />
      <ellipse cx={5} cy={-10} rx={1.6} ry={5} fill="#c9b8a6" />
      <ellipse cx={8} cy={-10} rx={1.6} ry={5} fill="#c9b8a6" />
      <ellipse cx={8} cy={-10} rx={0.7} ry={3.5} fill="#f5a3b5" />
      <circle cx={8} cy={-3} r={0.9} fill="#1a1a1a" />
    </g>
  );
}

function Duck() {
  return (
    <g>
      <ellipse cx={0} cy={6} rx={12} ry={3} fill="#7fd3f5" opacity={0.5} />
      <ellipse cx={0} cy={2} rx={9} ry={5} fill="#f6df8a" />
      <path d="M-9 1 q-3 -4 0 -5" fill="#f6df8a" />
      <circle cx={6} cy={-3} r={4} fill="#f6df8a" />
      <polygon points="9.5,-3 13,-2 9.5,-1" fill="#f2a541" />
      <circle cx={7} cy={-4} r={0.9} fill="#1a1a1a" />
    </g>
  );
}


function Pig() {
  return (
    <g>
      <ellipse cx={0} cy={12} rx={15} ry={4} fill="#000" opacity={0.25} />
      {[-9, -3, 4, 9].map((x) => (
        <rect key={x} x={x - 1.6} y={3} width={3.2} height={8} rx={1.2} fill="#e88fa6" />
      ))}
      <ellipse cx={0} cy={0} rx={14} ry={9} fill="#f6aec0" />
      <ellipse cx={-4} cy={-3} rx={6} ry={3} fill="#fbc8d5" opacity={0.8} />
      <path d="M-14 -2 q-4 -2 -3 3 q1 3 3 0" stroke="#e88fa6" strokeWidth={1.6} fill="none" />
      <circle cx={13} cy={-3} r={6} fill="#f6aec0" />
      <ellipse cx={18} cy={-2} rx={3} ry={2.5} fill="#e88fa6" />
      <circle cx={17.5} cy={-2.5} r={0.6} fill="#9c4a5e" />
      <circle cx={18.8} cy={-2.5} r={0.6} fill="#9c4a5e" />
      <circle cx={13} cy={-5} r={1} fill="#1a1a1a" />
      <path d="M10 -8 l-1 -4 l4 2 Z" fill="#e88fa6" />
    </g>
  );
}

function Dog() {
  return (
    <g>
      <ellipse cx={0} cy={11} rx={13} ry={3.5} fill="#000" opacity={0.25} />
      {[-8, -3, 4, 8].map((x) => (
        <rect key={x} x={x - 1.4} y={2} width={2.8} height={8} rx={1} fill="#9a6a3a" />
      ))}
      <ellipse cx={0} cy={0} rx={11} ry={6.5} fill="#c48a52" />
      <path d="M-11 -2 q-6 -6 -4 -10" stroke="#c48a52" strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={11} cy={-5} r={5.5} fill="#c48a52" />
      <ellipse cx={16} cy={-4} rx={3.2} ry={2.4} fill="#e8c49a" />
      <circle cx={18.5} cy={-4.5} r={1.1} fill="#1a1a1a" />
      <ellipse cx={8.5} cy={-8} rx={2.2} ry={4} fill="#7a4a24" transform="rotate(-15 8.5 -8)" />
      <circle cx={12} cy={-6} r={1} fill="#1a1a1a" />
    </g>
  );
}

function Cat() {
  return (
    <g>
      <ellipse cx={0} cy={10} rx={11} ry={3} fill="#000" opacity={0.25} />
      {[-6, -2, 3, 7].map((x) => (
        <rect key={x} x={x - 1.1} y={2} width={2.2} height={7} rx={1} fill="#7d7f8c" />
      ))}
      <ellipse cx={0} cy={0} rx={9} ry={5.5} fill="#9a9caa" />
      <path d="M-9 -1 q-6 -2 -5 -10" stroke="#9a9caa" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <circle cx={9} cy={-5} r={4.8} fill="#9a9caa" />
      <polygon points="6,-8.5 6.5,-13 9,-9.5" fill="#9a9caa" />
      <polygon points="10,-9.5 12,-13 12.5,-8.5" fill="#9a9caa" />
      <circle cx={8} cy={-5.5} r={0.9} fill="#2a8a3a" />
      <circle cx={11} cy={-5.5} r={0.9} fill="#2a8a3a" />
      <path d="M-3 -4 l2 3 M1 -5 l1 3" stroke="#7d7f8c" strokeWidth={1.2} />
    </g>
  );
}

function Fox() {
  return (
    <g>
      <ellipse cx={0} cy={10} rx={13} ry={3.2} fill="#000" opacity={0.25} />
      {[-6, -2, 4, 8].map((x) => (
        <rect key={x} x={x - 1.2} y={2} width={2.4} height={7} rx={1} fill="#3a2a22" />
      ))}
      <ellipse cx={0} cy={0} rx={10} ry={5.5} fill="#e5793a" />
      <path d="M-9 0 q-10 -2 -12 -9 q6 2 12 5 Z" fill="#e5793a" />
      <path d="M-19 -7 q-2 -2 -2 -2 q2 1 4 3 Z" fill="#ffffff" />
      <path d="M6 -2 l12 -1 l-5 6 Z" fill="#ffffff" />
      <circle cx={9} cy={-4} r={4.5} fill="#e5793a" />
      <polygon points="6.5,-7.5 7,-12.5 9.5,-8.5" fill="#e5793a" />
      <polygon points="10,-8.5 12.5,-12.5 12.5,-7" fill="#e5793a" />
      <polygon points="12.5,-4 17,-2.5 12.5,-1" fill="#ffffff" />
      <circle cx={17} cy={-2.7} r={0.9} fill="#1a1a1a" />
      <circle cx={10} cy={-5} r={0.9} fill="#1a1a1a" />
    </g>
  );
}

/** A small bird with flapping wings, for the flyovers. */
function Bird() {
  return (
    <g>
      <g className="base-wings">
        <path d="M-8 0 q4 -6 8 0 q4 -6 8 0" stroke="#2a2a33" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

const ART: Record<Kind, () => JSX.Element> = {
  cow: Cow,
  sheep: Sheep,
  chicken: Chicken,
  bunny: Bunny,
  duck: Duck,
  pig: Pig,
  dog: Dog,
  cat: Cat,
  fox: Fox
};
/** Walking speed in board units per second. */
const SPEED: Record<Kind, number> = { cow: 16, sheep: 18, pig: 20, chicken: 34, bunny: 42, duck: 22, dog: 40, cat: 30, fox: 36 };
/** Animals are drawn a bit larger than life so they read as cute on phones. */
const CRITTER_SCALE = 1.45;

type Point = [number, number];
type Route = {
  kind: Kind;
  path: string;
  keyPoints: string;
  keyTimes: string;
  flipValues: string;
  flipTimes: string;
  dur: number;
  delay: number;
  start: Point;
};

/**
 * A wandering route through random waypoints, looping back to the start,
 * with a pause at each stop. Facing flips when walking left.
 */
function buildRoute(kind: Kind, points: Point[], rnd: () => number): Route {
  const loop = [...points, points[0]];
  const lengths = loop.slice(1).map((p, i) => Math.hypot(p[0] - loop[i][0], p[1] - loop[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const pauses = points.map(() => 0.8 + rnd() * 2.2);
  const dur = total / SPEED[kind] + pauses.reduce((a, b) => a + b, 0);
  const times: number[] = [0];
  const keys: number[] = [0];
  const flipTimes: number[] = [];
  const flipValues: string[] = [];
  let t = 0;
  let along = 0;
  lengths.forEach((len, i) => {
    flipTimes.push(t / dur);
    const dx = loop[i + 1][0] - loop[i][0];
    flipValues.push(dx < 0 ? '-1 1' : '1 1');
    t += pauses[i];
    times.push(t / dur);
    keys.push(along / total);
    t += len / SPEED[kind];
    along += len;
    times.push(t / dur);
    keys.push(along / total);
  });
  times[times.length - 1] = 1;
  keys[keys.length - 1] = 1;
  const fmt = (n: number) => Math.min(1, Math.max(0, n)).toFixed(4);
  return {
    kind,
    path: `M${loop.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')}`,
    keyPoints: keys.map(fmt).join(';'),
    keyTimes: times.map(fmt).join(';'),
    flipValues: flipValues.join(';'),
    flipTimes: flipTimes.map(fmt).join(';'),
    dur,
    delay: rnd() * dur,
    start: points[0]
  };
}

type Project = (p: [number, number]) => [number, number];

function planRoutes(state: GameState, seed: number, project: Project): Route[] {
  const rnd = mulberry32(seed);
  const { min, max } = buildableBounds(state.landLevel);
  const occupied = occupancy(state);
  const isWater = (x: number, y: number) => state.terrain?.[`${x},${y}`] === 'water';
  const count = (id: string) => state.placed.filter((p) => p.itemId === id && p.level > 0).length;

  const land: Point[] = [];
  const water: Point[] = [];
  for (let y = min; y <= max; y++) {
    for (let x = min; x <= max; x++) {
      if (occupied.has(`${x},${y}`)) continue;
      // A random spot inside the tile, so animals don't line up on a grid.
      const point: Point = [x * 100 + 25 + rnd() * 50, y * 100 + 45 + rnd() * 40];
      (isWater(x, y) ? water : land).push(point);
    }
  }
  const pick = (pool: Point[]) => pool[Math.floor(rnd() * pool.length)];

  const kinds: Kind[] = ['cow', 'chicken', 'bunny'];
  const wild: Kind[] = ['bunny', 'cat', 'dog', 'fox', 'chicken'];
  const extras = Math.min(6, 2 + state.landLevel);
  for (let i = 0; i < extras; i++) kinds.push(wild[Math.floor(rnd() * wild.length)]);
  for (let i = 0; i < Math.min(3, count('barn')); i++) kinds.push('cow', 'sheep', 'pig');
  for (let i = 0; i < Math.min(3, count('coop')); i++) kinds.push('chicken', 'chicken');

  const routes: Route[] = [];
  if (land.length >= 2) {
    for (const kind of kinds) {
      const stops = 2 + Math.floor(rnd() * 3);
      const first = pick(land);
      const points: Point[] = [first];
      // Wander locally: each next stop is within a few tiles of the last.
      for (let i = 1; i < stops; i++) {
        const prev = points[i - 1];
        const near = land.filter((p) => Math.abs(p[0] - prev[0]) < 360 && Math.abs(p[1] - prev[1]) < 300);
        points.push(pick(near.length > 1 ? near : land));
      }
      routes.push(buildRoute(kind, points.map(project), rnd));
    }
  }
  const ducks = Math.min(4, Math.ceil(water.length / 4));
  for (let i = 0; i < ducks && water.length; i++) {
    const points: Point[] = [pick(water), pick(water), pick(water)];
    routes.push(buildRoute('duck', points.map(project), rnd));
  }
  return routes;
}

/** Butterflies flutter over flower patches, gardens and meadows. */
function planButterflies(state: GameState, project: Project): Array<{ x: number; y: number; color: string; delay: number }> {
  const spots: Array<[number, number]> = [];
  for (const p of state.placed) if (p.level > 0 && (p.itemId === 'flowers' || p.itemId === 'garden')) spots.push([p.x, p.y]);
  for (const [key, t] of Object.entries(state.terrain ?? {})) {
    if (t === 'meadow') spots.push(key.split(',').map(Number) as [number, number]);
  }
  const colors = ['#ffd1ea', '#fff4b0', '#c9b8ff', '#8eeaff'];
  return spots.slice(0, 6).map(([x, y], i) => {
    const [px, py] = project([x * 100 + 50, y * 100 + 50]);
    return { x: px, y: py - 28, color: colors[i % colors.length], delay: i * 1.3 };
  });
}

const identity: Project = (p) => p;

export function BaseCritters({ state, animate, project = identity }: { state: GameState; animate: boolean; project?: Project }) {
  // New spots and routes each time the base opens; steady while you're on it.
  const seed = useMemo(() => Math.floor(Math.random() * 1e9), []);
  const routes = useMemo(() => planRoutes(state, seed, project), [state, seed, project]);
  const butterflies = planButterflies(state, project);
  return (
    <g className="base-critters" pointerEvents="none">
      {routes.map((r, i) => {
        const Art = ART[r.kind];
        if (!animate) {
          return (
            <g key={i} transform={`translate(${r.start[0]} ${r.start[1]}) scale(${CRITTER_SCALE})`}>
              <Art />
            </g>
          );
        }
        const begin = `-${r.delay.toFixed(2)}s`;
        return (
          <g key={i}>
            <animateMotion
              dur={`${r.dur.toFixed(2)}s`}
              begin={begin}
              repeatCount="indefinite"
              path={r.path}
              keyPoints={r.keyPoints}
              keyTimes={r.keyTimes}
              calcMode="linear"
            />
            <g>
              <animateTransform
                attributeName="transform"
                type="scale"
                values={r.flipValues}
                keyTimes={r.flipTimes}
                calcMode="discrete"
                dur={`${r.dur.toFixed(2)}s`}
                begin={begin}
                repeatCount="indefinite"
              />
              <g className={r.kind === 'duck' ? 'base-critter-float' : 'base-critter-bob'}>
                <g transform={`scale(${CRITTER_SCALE})`}>
                  <Art />
                </g>
              </g>
            </g>
          </g>
        );
      })}
      {butterflies.map((b, i) => (
        <g key={`b${i}`} transform={`translate(${b.x} ${b.y})`}>
          {animate && (
            <animateMotion dur="7s" begin={`-${b.delay}s`} repeatCount="indefinite" path="M0,0 C20,-18 40,10 0,6 C-40,2 -20,-24 0,0" />
          )}
          <g className={animate ? 'base-butterfly' : undefined}>
            <ellipse cx={-3} cy={0} rx={3.5} ry={2.5} fill={b.color} />
            <ellipse cx={3} cy={0} rx={3.5} ry={2.5} fill={b.color} />
            <rect x={-0.6} y={-2} width={1.2} height={4} fill="#2a2a2a" />
          </g>
        </g>
      ))}
    </g>
  );
}

/** Birds that fly across now and then, above everything. */
export function BaseBirds({ state, animate, project = identity }: { state: GameState; animate: boolean; project?: Project }) {
  const seed = useMemo(() => Math.floor(Math.random() * 1e9), []);
  const flights = useMemo(() => {
    const rnd = mulberry32(seed + 7);
    const { min, max } = buildableBounds(state.landLevel);
    const left = min * 100 - 120;
    const right = (max + 1) * 100 + 120;
    return [0, 1, 2].map((i) => {
      const y = min * 100 + 60 + rnd() * (max - min) * 100;
      const dur = 9 + rnd() * 6;
      // Fly across the map in screen space, from one edge to the other.
      const [sx, sy] = project([left, y]);
      const [ex, ey] = project([right, y]);
      const rtl = ex < sx;
      const lift = 140;
      return {
        path: `M${sx.toFixed(0)},${(sy - lift).toFixed(0)} Q${((sx + ex) / 2).toFixed(0)},${(Math.min(sy, ey) - lift - 120).toFixed(0)} ${ex.toFixed(0)},${(ey - lift).toFixed(0)}`,
        // Long gaps between flights: each bird crosses, then waits off-screen.
        dur: dur * 3,
        delay: i * 7 + rnd() * 10,
        flip: rtl
      };
    });
    // Birds only depend on the land size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, state.landLevel]);
  if (!animate) return null;
  return (
    <g className="base-birds" pointerEvents="none">
      {flights.map((f, i) => (
        <g key={i}>
          <animateMotion
            dur={`${f.dur}s`}
            begin={`-${f.delay.toFixed(2)}s`}
            repeatCount="indefinite"
            path={f.path}
            keyPoints="0;1;1"
            keyTimes="0;0.33;1"
            calcMode="linear"
          />
          <g transform={`scale(${f.flip ? -1.6 : 1.6} 1.6)`}>
            <Bird />
          </g>
        </g>
      ))}
    </g>
  );
}
