import { buildableBounds } from '../../game/catalog';
import type { GameState } from '../../game/engine';

/**
 * Little life on the island: animals that wander back and forth, ducks on
 * ponds and butterflies over flowers. Barns and coops bring more animals.
 * Uses SVG motion (no state updates), and stays still for reduced motion.
 */

type Kind = 'cow' | 'sheep' | 'chicken' | 'bunny' | 'duck';

function hash(n: number): number {
  let h = (n * 2654435761) >>> 0;
  h = ((h ^ (h >>> 15)) * 2246822519) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
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

const ART: Record<Kind, () => JSX.Element> = { cow: Cow, sheep: Sheep, chicken: Chicken, bunny: Bunny, duck: Duck };
/** Animals are drawn a bit larger than life so they read as cute on phones. */
const CRITTER_SCALE = 1.45;
const SPEED: Record<Kind, number> = { cow: 26, sheep: 24, chicken: 14, bunny: 12, duck: 20 };

type Critter = { kind: Kind; ax: number; bx: number; y: number; dur: number; delay: number };

function planCritters(state: GameState): Critter[] {
  const { min, max } = buildableBounds(state.landLevel);
  const side = max - min + 1;
  const isWater = (x: number, y: number) => state.terrain?.[`${x},${y}`] === 'water';
  const count = (id: string) => state.placed.filter((p) => p.itemId === id && p.level > 0).length;

  const kinds: Kind[] = ['cow', 'chicken', 'bunny'];
  for (let i = 0; i < Math.min(3, count('barn')); i++) kinds.push('cow', 'sheep');
  for (let i = 0; i < Math.min(3, count('coop')); i++) kinds.push('chicken', 'chicken');

  const critters: Critter[] = [];
  kinds.forEach((kind, i) => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const h = hash(i * 31 + attempt * 7 + 1);
      const y = min + (h % side);
      const ax = min + ((h >>> 8) % Math.max(1, side - 2));
      const bx = Math.min(max, ax + 2 + ((h >>> 16) % 3));
      if (isWater(ax, y) || isWater(bx, y)) continue;
      critters.push({ kind, ax, bx, y, dur: SPEED[kind] + ((h >>> 4) % 8), delay: (h >>> 12) % 20 });
      return;
    }
  });

  // Ducks paddle along the longest stretch of water in a row.
  const waterTiles = Object.entries(state.terrain ?? {}).filter(([, t]) => t === 'water');
  const ducks = Math.min(4, Math.ceil(waterTiles.length / 4));
  for (let i = 0; i < ducks; i++) {
    const [key] = waterTiles[hash(i + 99) % waterTiles.length];
    const [wx, wy] = key.split(',').map(Number);
    let ax = wx;
    let bx = wx;
    while (isWater(ax - 1, wy)) ax--;
    while (isWater(bx + 1, wy)) bx++;
    critters.push({ kind: 'duck', ax, bx, y: wy, dur: SPEED.duck + i * 3, delay: i * 4 });
  }
  return critters;
}

/** Butterflies flutter over flower patches, gardens and meadows. */
function planButterflies(state: GameState): Array<{ x: number; y: number; color: string; delay: number }> {
  const spots: Array<[number, number]> = [];
  for (const p of state.placed) if (p.level > 0 && (p.itemId === 'flowers' || p.itemId === 'garden')) spots.push([p.x, p.y]);
  for (const [key, t] of Object.entries(state.terrain ?? {})) {
    if (t === 'meadow') spots.push(key.split(',').map(Number) as [number, number]);
  }
  const colors = ['#ffd1ea', '#fff4b0', '#c9b8ff', '#8eeaff'];
  return spots.slice(0, 5).map(([x, y], i) => ({ x: x * 100 + 50, y: y * 100 + 30, color: colors[i % colors.length], delay: i * 1.3 }));
}

export function BaseCritters({ state, animate }: { state: GameState; animate: boolean }) {
  const critters = planCritters(state);
  const butterflies = planButterflies(state);
  return (
    <g className="base-critters" pointerEvents="none">
      {critters.map((c, i) => {
        const Art = ART[c.kind];
        const ax = c.ax * 100 + 50;
        const bx = c.bx * 100 + 50;
        const y = c.y * 100 + (c.kind === 'duck' ? 60 : 74);
        if (!animate || ax === bx) {
          return (
            <g key={i} transform={`translate(${ax} ${y}) scale(${CRITTER_SCALE})`}>
              <Art />
            </g>
          );
        }
        const begin = `-${c.delay}s`;
        return (
          <g key={i}>
            {/* Walk over, pause, walk back, pause. */}
            <animateMotion
              dur={`${c.dur}s`}
              begin={begin}
              repeatCount="indefinite"
              path={`M${ax},${y} L${bx},${y} L${ax},${y}`}
              keyPoints="0;0.5;0.5;1;1"
              keyTimes="0;0.42;0.5;0.92;1"
              calcMode="linear"
            />
            <g>
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1 1;-1 1;1 1"
                keyTimes="0;0.46;0.96"
                calcMode="discrete"
                dur={`${c.dur}s`}
                begin={begin}
                repeatCount="indefinite"
              />
              <g className={c.kind === 'duck' ? 'base-critter-float' : 'base-critter-bob'}>
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
