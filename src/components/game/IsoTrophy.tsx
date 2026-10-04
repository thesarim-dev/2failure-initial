import type { ReactNode } from 'react';
import { getTrophyDef } from '../../game/catalog';
import { FIRE, WINDOW_LIT, themeFor, type Shades } from './BaseArt';
import { P } from './IsoArt';

/**
 * Trophies as grounded monuments: a dirt pad with paving stones, a carved
 * stone pedestal with an engraved number plaque and a tier-coloured cap, and
 * a unique statue on top cast in bronze, silver or gold.
 */

const pts = (list: Array<[number, number]>) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

const TIER: Record<string, Shades> = {
  bronze: { light: '#f0b27a', base: '#c98a4a', dark: '#8a5a2a' },
  silver: { light: '#f4f6fa', base: '#c9d0da', dark: '#8a93a2' },
  gold: { light: '#fff0a8', base: '#f7c948', dark: '#b9861a' }
};
const STONE: Shades = { light: '#e6e2dc', base: '#bdb6ad', dark: '#8f877d' };

/** The number engraved on each trophy's plaque. */
const NUMBER: Record<string, string> = {
  'first-set': '1',
  'sets-50': '50',
  'sets-250': '250',
  'streak-3': '3',
  'streak-7': '7',
  'streak-30': '30',
  'streak-100': '100',
  'pushups-30': '30',
  'pushups-50': '50',
  'first-pull-up': '1',
  'first-pistol': '1',
  'first-loaded': 'KG',
  'first-elite': '★',
  'balanced-week': '4',
  'first-session': '1',
  'first-week': '1',
  'weeks-4': '4',
  'weeks-12': '12'
};

type Box = { x0: number; y0: number; x1: number; y1: number; z0: number; z1: number };

function Block({ b, s }: { b: Box; s: Shades }) {
  const { x0, y0, x1, y1, z0, z1 } = b;
  return (
    <g>
      <polygon points={pts([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)])} fill={s.base} />
      <polygon points={pts([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)])} fill="url(#hf-face)" />
      <polygon points={pts([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)])} fill={s.dark} />
      <polygon points={pts([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)])} fill={s.light} />
      <polyline points={pts([P(x0, y1, z1), P(x1, y1, z1), P(x1, y0, z1)])} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={1} />
    </g>
  );
}

/** The dirt pad with a few paving stones, flush with the tile. */
function Pad({ ox, oy }: { ox: number; oy: number }) {
  const i = 6;
  const corners = [P(ox + i, oy + i), P(ox + 100 - i, oy + i), P(ox + 100 - i, oy + 100 - i), P(ox + i, oy + 100 - i)];
  const stones: Array<[number, number, number]> = [
    [ox + 18, oy + 74, 8],
    [ox + 74, oy + 20, 7],
    [ox + 80, oy + 78, 9],
    [ox + 22, oy + 22, 6]
  ];
  return (
    <g>
      <polygon points={pts(corners)} fill="#a8783e" />
      <polygon points={pts(corners)} fill="none" stroke="#6e4a22" strokeWidth={1.4} strokeDasharray="3 2" opacity={0.7} />
      {stones.map(([x, y, r], k) => (
        <polygon key={k} points={pts([P(x - r, y - r), P(x + r, y - r), P(x + r, y + r), P(x - r, y + r)])} fill="#d8cfbf" opacity={0.85} />
      ))}
    </g>
  );
}

/** The carved pedestal with a tier cap and the engraved number. */
function Pedestal({ ox, oy, h, tier, number, accent }: { ox: number; oy: number; h: number; tier: Shades; number: string; accent: Shades }) {
  const b: Box = { x0: ox + 26, y0: oy + 26, x1: ox + 74, y1: oy + 74, z0: 0, z1: h };
  const cap: Box = { x0: ox + 23, y0: oy + 23, x1: ox + 77, y1: oy + 77, z0: h, z1: h + 5 };
  // Plaque on the front-left face; text runs along the face.
  const pl = (u: number, v: number) => P(b.x0 + (b.x1 - b.x0) * u, b.y1 + 0.5, (b.z1 - b.z0) * v);
  const [tx, ty] = pl(0.5, 0.42);
  return (
    <g>
      {/* Base step */}
      <Block b={{ x0: ox + 22, y0: oy + 22, x1: ox + 78, y1: oy + 78, z0: 0, z1: 5 }} s={STONE} />
      <Block b={{ ...b, z0: 5 }} s={STONE} />
      {/* Chips and cracks */}
      <path
        d={`M${pl(0.12, 0.85)[0]} ${pl(0.12, 0.85)[1]} l3 4 l-1 3 M${pl(0.82, 0.3)[0]} ${pl(0.82, 0.3)[1]} l-2 3 l2 3`}
        stroke="#7a7268"
        strokeWidth={0.9}
        fill="none"
      />
      {/* Plaque */}
      <polygon points={pts([pl(0.16, 0.18), pl(0.84, 0.18), pl(0.84, 0.7), pl(0.16, 0.7)])} fill="#5a544c" />
      <polygon points={pts([pl(0.2, 0.22), pl(0.8, 0.22), pl(0.8, 0.66), pl(0.2, 0.66)])} fill={accent.dark} opacity={0.55} />
      <text
        x={0}
        y={0}
        transform={`matrix(0.894 0.447 0 1 ${tx} ${ty})`}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Archivo Black', 'Arial Black', sans-serif"
        fontWeight={900}
        fontSize={number.length >= 3 ? 9 : 11}
        fill={tier.light}
        stroke="#2a241e"
        strokeWidth={0.6}
        paintOrder="stroke">
        {number}
      </text>
      <Block b={cap} s={tier} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Statue pieces, drawn upright with their base at (0, 0) on the pedestal top.
// ---------------------------------------------------------------------------

type M = Shades;

function Limb({ d, m, w }: { d: string; m: M; w: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={m.dark} strokeWidth={w + 1.6} />
      <path d={d} stroke={m.base} strokeWidth={w} />
    </g>
  );
}
function Head({ x, y, r = 4.2, m }: { x: number; y: number; r?: number; m: M }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 0.8} fill={m.dark} />
      <circle cx={x} cy={y} r={r} fill={m.base} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.4} fill={m.light} opacity={0.8} />
    </g>
  );
}

function Athlete({ pose, m }: { pose: 'victory' | 'plank' | 'hang' | 'pistol' | 'flex' | 'lift'; m: M }) {
  switch (pose) {
    case 'plank':
      return (
        <g>
          <Limb d="M-16 -3 L10 -10" m={m} w={4.6} />
          <Limb d="M-16 -3 L-22 -1" m={m} w={3.2} />
          <Limb d="M8 -10 L9 -1" m={m} w={3.2} />
          <Head x={14} y={-13} m={m} />
        </g>
      );
    case 'hang':
      return (
        <g>
          <Limb d="M-14 0 V-56 M14 0 V-56" m={m} w={3} />
          <Limb d="M-17 -56 H17" m={m} w={2.6} />
          <Limb d="M-5 -55 L-3 -44 M5 -55 L3 -44" m={m} w={2.8} />
          <Limb d="M0 -42 V-26" m={m} w={4.4} />
          <Limb d="M0 -26 L-3 -14 M0 -26 L3 -14" m={m} w={3.1} />
          <Head x={0} y={-46} r={3.8} m={m} />
        </g>
      );
    case 'pistol':
      return (
        <g>
          <Limb d="M0 0 L-2 -9 L1 -16" m={m} w={3.4} />
          <Limb d="M1 -16 L13 -14" m={m} w={3.2} />
          <Limb d="M1 -16 L2 -30" m={m} w={4.6} />
          <Limb d="M2 -27 L14 -26 M2 -27 L14 -24" m={m} w={2.8} />
          <Head x={3} y={-35} m={m} />
        </g>
      );
    case 'flex':
      return (
        <g>
          <Limb d="M-4 0 L-3 -16 M4 0 L3 -16" m={m} w={3.8} />
          <Limb d="M0 -16 V-34" m={m} w={6} />
          <Limb d="M-2 -32 L-12 -30 L-13 -40" m={m} w={3.4} />
          <Limb d="M2 -32 L12 -30 L13 -40" m={m} w={3.4} />
          <circle cx={-13} cy={-41} r={2.6} fill={m.base} stroke={m.dark} strokeWidth={0.8} />
          <circle cx={13} cy={-41} r={2.6} fill={m.base} stroke={m.dark} strokeWidth={0.8} />
          <Head x={0} y={-40} r={4.6} m={m} />
        </g>
      );
    case 'lift':
      return (
        <g>
          <Limb d="M-3 0 L-2 -14 M3 0 L2 -14" m={m} w={3.4} />
          <Limb d="M0 -14 V-29" m={m} w={4.8} />
          <Limb d="M1 -27 L7 -36 L8 -44" m={m} w={3} />
          <Limb d="M-1 -27 L-7 -22" m={m} w={3} />
          <Limb d="M3 -45 H13" m={m} w={2.2} />
          <rect x={1} y={-49} width={3} height={8} rx={1} fill={m.dark} />
          <rect x={12} y={-49} width={3} height={8} rx={1} fill={m.dark} />
          <Head x={0} y={-34} r={4} m={m} />
        </g>
      );
    default:
      return (
        <g>
          <Limb d="M-4 0 L-2 -15 M4 0 L2 -15" m={m} w={3.6} />
          <Limb d="M0 -15 V-31" m={m} w={5} />
          <Limb d="M1 -29 L8 -38 L9 -46" m={m} w={3.2} />
          <Limb d="M-1 -29 L-8 -22" m={m} w={3.2} />
          <Head x={0} y={-36} m={m} />
        </g>
      );
  }
}

function Cup({ m, grand = false }: { m: M; grand?: boolean }) {
  const s = grand ? 1.25 : 1;
  return (
    <g transform={`scale(${s})`}>
      <rect x={-9} y={-6} width={18} height={6} rx={1.5} fill={m.dark} />
      <rect x={-2.5} y={-16} width={5} height={10} fill={m.base} />
      <path d="M-13 -34 H13 C 13 -22, 8 -16, 0 -16 C -8 -16, -13 -22, -13 -34 Z" fill={m.base} stroke={m.dark} strokeWidth={1} />
      <path d="M-10 -32 C -10 -24, -6 -19, -2 -18" stroke={m.light} strokeWidth={2} fill="none" opacity={0.85} />
      <path d="M-13 -31 C -20 -31, -20 -22, -10 -21 M13 -31 C 20 -31, 20 -22, 10 -21" stroke={m.dark} strokeWidth={2.2} fill="none" />
      {grand && (
        <g>
          <path d="M-13 -34 L-24 -42 L-14 -38 Z M13 -34 L24 -42 L14 -38 Z" fill={m.light} stroke={m.dark} strokeWidth={0.8} />
          <ellipse cx={0} cy={-36} rx={11} ry={2.6} fill={m.light} />
          <circle cx={0} cy={-40} r={2.6} fill={m.base} stroke={m.dark} strokeWidth={0.8} />
        </g>
      )}
    </g>
  );
}

function Medal({ m, accent }: { m: M; accent: M }) {
  return (
    <g>
      <rect x={-1.5} y={-34} width={3} height={34} fill="#7a7268" />
      <path d="M-7 -40 L-2 -26 L2 -26 L7 -40 L2 -40 L0 -33 L-2 -40 Z" fill={accent.base} />
      <circle cx={0} cy={-20} r={9} fill={m.base} stroke={m.dark} strokeWidth={1.4} />
      <circle cx={0} cy={-20} r={6} fill="none" stroke={m.light} strokeWidth={1.2} />
      <path d="M0 -24 l1.4 3 l3.2 0.3 l-2.4 2 l0.8 3.1 l-3 -1.7 l-3 1.7 l0.8 -3.1 l-2.4 -2 l3.2 -0.3 Z" fill={m.light} />
    </g>
  );
}

function Flame({ m, size = 1, torch = false, crown = false, laurel = false, lit }: { m: M; size?: number; torch?: boolean; crown?: boolean; laurel?: boolean; lit: boolean }) {
  const lift = torch ? 20 : 0;
  return (
    <g>
      {torch && (
        <g>
          <path d="M-3 0 L-5 -20 H5 L3 0 Z" fill={m.dark} />
          <rect x={-7} y={-23} width={14} height={4} rx={1} fill={m.base} stroke={m.dark} strokeWidth={0.8} />
        </g>
      )}
      {laurel && <Laurel m={m} y={-14 - lift} r={16 * size} />}
      <g transform={`translate(0 ${-lift}) scale(${size})`} className={lit ? 'base-flame' : undefined}>
        <path d="M0 -36 C 8 -26, 13 -20, 11 -10 C 9 -2, 4 0, 0 0 C -4 0, -9 -2, -11 -10 C -13 -20, -6 -24, -4 -30 C -3 -24, -1 -22, 0 -22 C -2 -28, -2 -32, 0 -36 Z" fill={lit ? FIRE : m.base} stroke={m.dark} strokeWidth={0.9} />
        <path d="M0 -20 C 4 -14, 6 -10, 5 -6 C 4 -2, 2 -1, 0 -1 C -2 -1, -5 -3, -5 -7 C -5 -11, -2 -14, 0 -20 Z" fill={lit ? WINDOW_LIT : m.light} />
      </g>
      {crown && (
        <g transform={`translate(0 ${-lift - 38 * size})`}>
          <path d="M-9 0 L-9 -7 L-4.5 -3 L0 -9 L4.5 -3 L9 -7 L9 0 Z" fill={m.base} stroke={m.dark} strokeWidth={1} />
          <circle cx={0} cy={-9.5} r={1.6} fill={m.light} />
        </g>
      )}
    </g>
  );
}

function Laurel({ m, y = -18, r = 15 }: { m: M; y?: number; r?: number }) {
  const leaves: ReactNode[] = [];
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * (0.62 + k * 0.11);
    for (const side of [-1, 1]) {
      const x = side * Math.cos(a) * r * -1;
      const yy = y + Math.sin(a) * r * 0.9;
      leaves.push(
        <ellipse key={`${k}${side}`} cx={x} cy={yy} rx={3.4} ry={1.6} fill={m.base} stroke={m.dark} strokeWidth={0.6} transform={`rotate(${side * (40 - k * 12)} ${x} ${yy})`} />
      );
    }
  }
  return <g>{leaves}</g>;
}

function Star({ m }: { m: M }) {
  return (
    <g>
      <rect x={-3} y={-14} width={6} height={14} fill={m.dark} />
      <path d="M0 -42 L5 -30 L18 -29 L8 -21 L11 -8 L0 -15 L-11 -8 L-8 -21 L-18 -29 L-5 -30 Z" fill={m.base} stroke={m.dark} strokeWidth={1.2} />
      <path d="M0 -42 L5 -30 L0 -26 Z" fill={m.light} />
    </g>
  );
}

function Scales({ m }: { m: M }) {
  return (
    <g>
      <rect x={-1.6} y={-40} width={3.2} height={40} fill={m.dark} />
      <path d="M-18 -36 H18" stroke={m.base} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={0} cy={-40} r={2.6} fill={m.light} />
      {[-15, 15].map((x) => (
        <g key={x}>
          <path d={`M${x} -36 L${x - 6} -24 M${x} -36 L${x + 6} -24`} stroke={m.dark} strokeWidth={0.9} />
          <path d={`M${x - 8} -24 H${x + 8} Q${x} -17 ${x - 8} -24 Z`} fill={m.base} stroke={m.dark} strokeWidth={0.8} />
        </g>
      ))}
    </g>
  );
}

function Kettlebell({ m }: { m: M }) {
  return (
    <g>
      <path d="M-7 -28 C -7 -38, 7 -38, 7 -28" stroke={m.dark} strokeWidth={4} fill="none" />
      <circle cx={0} cy={-15} r={13} fill={m.base} stroke={m.dark} strokeWidth={1.2} />
      <ellipse cx={-4} cy={-20} rx={4} ry={3} fill={m.light} opacity={0.8} />
      <rect x={-8} y={-2.5} width={16} height={2.5} rx={1} fill={m.dark} />
    </g>
  );
}

function Obelisk({ m }: { m: M }) {
  return (
    <g>
      <polygon points="-7,0 7,0 5,-44 0,-52 -5,-44" fill={m.base} stroke={m.dark} strokeWidth={1} />
      <polygon points="0,0 7,0 5,-44 0,-52" fill={m.dark} opacity={0.35} />
      <path d="M-3 -40 V-12" stroke={m.light} strokeWidth={1.4} opacity={0.8} />
    </g>
  );
}

function Statue({ id, m, accent, lit }: { id: string; m: M; accent: M; lit: boolean }) {
  switch (id) {
    case 'first-set':
      return <Medal m={m} accent={accent} />;
    case 'sets-50':
      return <Cup m={m} />;
    case 'sets-250':
      return (
        <g>
          <Laurel m={m} y={-22} r={20} />
          <Cup m={m} grand />
        </g>
      );
    case 'streak-3':
      return <Flame m={m} size={0.8} lit={lit} />;
    case 'streak-7':
      return <Flame m={m} size={0.75} torch lit={lit} />;
    case 'streak-30':
      return <Flame m={m} size={0.95} laurel lit={lit} />;
    case 'streak-100':
      return <Flame m={m} size={1.1} crown laurel lit={lit} />;
    case 'pushups-30':
      return <Athlete pose="plank" m={m} />;
    case 'pushups-50':
      return (
        <g>
          <Laurel m={m} y={-16} r={18} />
          <Athlete pose="plank" m={m} />
        </g>
      );
    case 'first-pull-up':
      return <Athlete pose="hang" m={m} />;
    case 'first-pistol':
      return <Athlete pose="pistol" m={m} />;
    case 'first-loaded':
      return <Kettlebell m={m} />;
    case 'first-elite':
      return <Star m={m} />;
    case 'balanced-week':
      return <Scales m={m} />;
    case 'first-session':
      return <Athlete pose="lift" m={m} />;
    case 'first-week':
      return <Obelisk m={m} />;
    case 'weeks-4':
      return (
        <g>
          <rect x={-2} y={-16} width={4} height={16} fill={m.dark} />
          <Laurel m={m} y={-30} r={14} />
        </g>
      );
    case 'weeks-12':
      return (
        <g transform="scale(1.15)">
          <Athlete pose="flex" m={m} />
        </g>
      );
    default:
      return <Athlete pose="victory" m={m} />;
  }
}

export function IsoTrophy({
  trophyId,
  ox,
  oy,
  lit,
  verified,
  color
}: {
  trophyId: string;
  ox: number;
  oy: number;
  lit: boolean;
  verified?: boolean;
  color?: string;
}) {
  const def = getTrophyDef(trophyId);
  const tier = TIER[def?.tier ?? 'bronze'];
  const accent = color ? themeFor('trophy', color) : { light: '#ff8fa3', base: '#e5484d', dark: '#9c2a33' };
  const h = 30;
  const [sx, sy] = P(ox + 50, oy + 50, h + 5);
  const [vx, vy] = P(ox + 74, oy + 40, h * 0.55);
  return (
    <g>
      <Pad ox={ox} oy={oy} />
      <ellipse cx={P(ox + 50, oy + 50)[0] + 4} cy={P(ox + 50, oy + 50)[1] + 3} rx={30} ry={11} fill="url(#hf-shadow)" />
      <Pedestal ox={ox} oy={oy} h={h} tier={tier} number={NUMBER[trophyId] ?? ''} accent={accent} />
      <g transform={`translate(${sx} ${sy}) scale(1.35)`}>
        <ellipse cx={0} cy={0} rx={10} ry={3} fill="#000" opacity={0.2} />
        <Statue id={trophyId} m={tier} accent={accent} lit={lit} />
      </g>
      {verified && (
        <g transform={`translate(${vx} ${vy})`}>
          <circle r={5.5} fill="#00a8d8" stroke="#ffffff" strokeWidth={1.2} />
          <path d="M-2.4 0 l1.7 1.8 l3.2 -3.4" stroke="#ffffff" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}
