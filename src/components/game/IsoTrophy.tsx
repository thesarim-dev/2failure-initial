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
// Statues: polished metal figurines, drawn upright with their base at (0, 0)
// on the pedestal top. Each tier gets real metal shading (highlight → base →
// shadow); far-side limbs are darker so figures read as 3D.
// ---------------------------------------------------------------------------

type M = Shades;
type J = [number, number];

/** Metal gradients for a tier, shared by every part of the statue. */
function MetalDefs({ id, m }: { id: string; m: M }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={m.light} />
        <stop offset="0.45" stopColor={m.base} />
        <stop offset="1" stopColor={m.dark} />
      </linearGradient>
      <linearGradient id={`${id}-far`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={m.base} />
        <stop offset="1" stopColor={m.dark} />
      </linearGradient>
      {/* Cylinder sheen for cups, posts and bowls */}
      <linearGradient id={`${id}-cyl`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={m.dark} />
        <stop offset="0.3" stopColor={m.light} />
        <stop offset="0.6" stopColor={m.base} />
        <stop offset="1" stopColor={m.dark} />
      </linearGradient>
    </defs>
  );
}

/** A tapered body segment from a to b with rounded joints. */
function Bone({ a, b, wa, wb, fill, edge }: { a: J; b: J; wa: number; wb: number; fill: string; edge: string }) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const quad: J[] = [
    [a[0] + (nx * wa) / 2, a[1] + (ny * wa) / 2],
    [b[0] + (nx * wb) / 2, b[1] + (ny * wb) / 2],
    [b[0] - (nx * wb) / 2, b[1] - (ny * wb) / 2],
    [a[0] - (nx * wa) / 2, a[1] - (ny * wa) / 2]
  ];
  return (
    <g fill={fill} stroke={edge} strokeWidth={0.5}>
      <circle cx={a[0]} cy={a[1]} r={wa / 2} />
      <circle cx={b[0]} cy={b[1]} r={wb / 2} />
      <polygon points={pts(quad)} stroke="none" />
      <path d={`M${quad[0][0]} ${quad[0][1]} L${quad[1][0]} ${quad[1][1]} M${quad[2][0]} ${quad[2][1]} L${quad[3][0]} ${quad[3][1]}`} fill="none" />
    </g>
  );
}

/** A limb: two bones (upper and lower) through a joint. */
function Limb2({ a, j, b, w, fill, edge }: { a: J; j: J; b: J; w: [number, number, number]; fill: string; edge: string }) {
  return (
    <g>
      <Bone a={a} b={j} wa={w[0]} wb={w[1]} fill={fill} edge={edge} />
      <Bone a={j} b={b} wa={w[1]} wb={w[2]} fill={fill} edge={edge} />
    </g>
  );
}

function HeadBall({ c, r, fill, m }: { c: J; r: number; fill: string; m: M }) {
  return (
    <g>
      <circle cx={c[0]} cy={c[1]} r={r} fill={fill} stroke={m.dark} strokeWidth={0.6} />
      <circle cx={c[0] - r * 0.35} cy={c[1] - r * 0.38} r={r * 0.32} fill="#ffffff" opacity={0.55} />
    </g>
  );
}

type Pose = 'plank' | 'hang' | 'pistol' | 'lift' | 'flex';

function Athlete({ pose, m, gid }: { pose: Pose; m: M; gid: string }) {
  const near = `url(#${gid})`;
  const far = `url(#${gid}-far)`;
  const edge = m.dark;
  switch (pose) {
    case 'plank':
      // Side view, top of a pushup: straight line from head to heels.
      return (
        <g>
          <Limb2 a={[9.5, -16.5]} j={[10.5, -9]} b={[10.5, -1.6]} w={[3, 2.4, 2]} fill={far} edge={edge} />
          <Limb2 a={[-9, -11.8]} j={[-17, -7.8]} b={[-25, -3.4]} w={[3.2, 2.4, 1.8]} fill={far} edge={edge} />
          <polygon points="13,-18.6 12.6,-13 4,-11.2 -9,-9 -10.6,-13.6 0,-17.8" fill={near} stroke={edge} strokeWidth={0.6} />
          <path d="M3 -16.6 Q 7 -18.2 11.5 -17.6" stroke={m.light} strokeWidth={1} fill="none" opacity={0.8} />
          <Limb2 a={[-9, -11.2]} j={[-17, -7]} b={[-25, -2.6]} w={[3.6, 2.8, 2]} fill={near} edge={edge} />
          <ellipse cx={-27} cy={-1.2} rx={2.3} ry={1.1} fill={near} stroke={edge} strokeWidth={0.5} />
          <Bone a={[11.5, -17]} b={[15, -18.6]} wa={2.6} wb={2.2} fill={near} edge={edge} />
          <HeadBall c={[17.4, -19.4]} r={3.4} fill={near} m={m} />
          <Limb2 a={[11, -16]} j={[12, -8.6]} b={[12, -1.4]} w={[3.4, 2.8, 2.2]} fill={near} edge={edge} />
          <ellipse cx={13.4} cy={-0.7} rx={2.3} ry={0.9} fill={near} stroke={edge} strokeWidth={0.5} />
        </g>
      );
    case 'hang':
      // Front view, mid pull-up, lats spread.
      return (
        <g>
          <rect x={-15.5} y={-58} width={2.4} height={58} rx={1} fill={`url(#${gid}-cyl)`} stroke={edge} strokeWidth={0.4} />
          <rect x={13.1} y={-58} width={2.4} height={58} rx={1} fill={`url(#${gid}-cyl)`} stroke={edge} strokeWidth={0.4} />
          <rect x={-17} y={-58.6} width={34} height={2.2} rx={1.1} fill={near} stroke={edge} strokeWidth={0.4} />
          <Limb2 a={[-5.6, -56]} j={[-9, -49]} b={[-6, -43]} w={[1.9, 2.5, 3.1]} fill={near} edge={edge} />
          <Limb2 a={[5.6, -56]} j={[9, -49]} b={[6, -43]} w={[1.9, 2.5, 3.1]} fill={near} edge={edge} />
          <Limb2 a={[-2.3, -28]} j={[-2.7, -18]} b={[-1.9, -9]} w={[3.3, 2.6, 2]} fill={far} edge={edge} />
          <Limb2 a={[2.3, -28]} j={[2.7, -18]} b={[1.9, -9]} w={[3.3, 2.6, 2]} fill={near} edge={edge} />
          <polygon points="-7.2,-43.8 7.2,-43.8 5.6,-36 3.7,-27.6 -3.7,-27.6 -5.6,-36" fill={near} stroke={edge} strokeWidth={0.6} />
          <path d="M-5 -39.5 Q 0 -37.8 5 -39.5 M0 -38.6 V-29 M-2.4 -34.6 H2.4 M-2.2 -31.6 H2.2" stroke={edge} strokeWidth={0.5} fill="none" opacity={0.55} />
          <HeadBall c={[0, -47.6]} r={3.3} fill={near} m={m} />
        </g>
      );
    case 'pistol':
      // Side view: deep on one leg, the other straight out, arms forward.
      return (
        <g>
          <Limb2 a={[-3, -9.6]} j={[6, -10.6]} b={[15, -11.6]} w={[3.2, 2.6, 2]} fill={far} edge={edge} />
          <ellipse cx={16} cy={-13.4} rx={1.1} ry={2.2} fill={far} stroke={edge} strokeWidth={0.5} />
          <Limb2 a={[2.6, -21.4]} j={[9, -20.4]} b={[15.4, -19.8]} w={[2.6, 2.2, 1.8]} fill={far} edge={edge} />
          <polygon points="-5,-7.6 -1,-12.2 1,-23.6 5.6,-21.6 3.6,-14 -0.6,-6.6" fill={near} stroke={edge} strokeWidth={0.6} />
          <Limb2 a={[-3, -8]} j={[6.2, -6.6]} b={[1, -1.2]} w={[3.6, 2.8, 2.1]} fill={near} edge={edge} />
          <ellipse cx={3} cy={-0.6} rx={3} ry={1.1} fill={near} stroke={edge} strokeWidth={0.5} />
          <Bone a={[3, -22]} b={[5, -24.2]} wa={2.4} wb={2.2} fill={near} edge={edge} />
          <HeadBall c={[6, -26.6]} r={3.4} fill={near} m={m} />
          <Limb2 a={[3.6, -20.4]} j={[9.6, -19]} b={[16, -18.4]} w={[3, 2.5, 2]} fill={near} edge={edge} />
          <circle cx={16.8} cy={-18.3} r={1.5} fill={near} stroke={edge} strokeWidth={0.5} />
        </g>
      );
    case 'lift':
      // Side view: pressing a dumbbell overhead, other hand on the hip.
      return (
        <g>
          <Limb2 a={[-0.4, -15]} j={[-1.8, -8]} b={[-2.4, -1.2]} w={[3.3, 2.6, 2]} fill={far} edge={edge} />
          <Limb2 a={[-0.6, -28]} j={[-4.6, -22.4]} b={[-2, -17]} w={[2.7, 2.3, 1.9]} fill={far} edge={edge} />
          <polygon points="-3.2,-15 3.2,-15 4.8,-28.6 -2.8,-29.8" fill={near} stroke={edge} strokeWidth={0.6} />
          <path d="M1 -27.6 Q 3.6 -25.6 3.2 -21.6" stroke={m.light} strokeWidth={0.9} fill="none" opacity={0.8} />
          <Limb2 a={[1, -15]} j={[2.6, -8]} b={[3, -1.2]} w={[3.6, 2.8, 2.1]} fill={near} edge={edge} />
          <ellipse cx={4.6} cy={-0.6} rx={2.6} ry={1} fill={near} stroke={edge} strokeWidth={0.5} />
          <Bone a={[1, -29]} b={[2, -31.4]} wa={2.4} wb={2.2} fill={near} edge={edge} />
          <HeadBall c={[2.6, -34]} r={3.3} fill={near} m={m} />
          <Limb2 a={[2, -28.6]} j={[3.6, -36.6]} b={[3.2, -44]} w={[3.1, 2.6, 2]} fill={near} edge={edge} />
          <rect x={-2.5} y={-45.7} width={11.4} height={1.6} rx={0.8} fill={m.dark} />
          <rect x={-4.4} y={-49} width={3.2} height={8.2} rx={1.1} fill={`url(#${gid}-cyl)`} stroke={edge} strokeWidth={0.5} />
          <rect x={7.6} y={-49} width={3.2} height={8.2} rx={1.1} fill={`url(#${gid}-cyl)`} stroke={edge} strokeWidth={0.5} />
        </g>
      );
    case 'flex':
    default:
      // Front view: double-biceps victory pose.
      return (
        <g>
          <Limb2 a={[-2.6, -16]} j={[-3.8, -8.4]} b={[-3.4, -1.2]} w={[3.6, 2.8, 2.2]} fill={near} edge={edge} />
          <Limb2 a={[2.6, -16]} j={[3.8, -8.4]} b={[3.4, -1.2]} w={[3.6, 2.8, 2.2]} fill={far} edge={edge} />
          <ellipse cx={-4} cy={-0.7} rx={2.4} ry={0.9} fill={near} stroke={edge} strokeWidth={0.5} />
          <ellipse cx={4} cy={-0.7} rx={2.4} ry={0.9} fill={far} stroke={edge} strokeWidth={0.5} />
          {[-1, 1].map((side) => (
            <g key={side}>
              <Bone a={[side * 7.4, -31.6]} b={[side * 14.4, -30.2]} wa={3.4} wb={2.8} fill={near} edge={edge} />
              <Bone a={[side * 14.4, -30.2]} b={[side * 15, -39.4]} wa={2.8} wb={2.3} fill={near} edge={edge} />
              <ellipse cx={side * 11} cy={-32.4} rx={3.1} ry={2.3} fill={near} stroke={edge} strokeWidth={0.5} />
              <circle cx={side * 15.1} cy={-40.2} r={1.9} fill={near} stroke={edge} strokeWidth={0.5} />
            </g>
          ))}
          <polygon points="-8,-32.8 8,-32.8 6.6,-26 3.8,-16.6 -3.8,-16.6 -6.6,-26" fill={near} stroke={edge} strokeWidth={0.6} />
          <path d="M-5.6 -28.4 Q 0 -26.2 5.6 -28.4 M0 -27.6 V-18 M-2.6 -23.8 H2.6 M-2.4 -20.8 H2.4" stroke={edge} strokeWidth={0.5} fill="none" opacity={0.55} />
          <Bone a={[0, -32.6]} b={[0, -35]} wa={2.8} wb={2.6} fill={near} edge={edge} />
          <HeadBall c={[0, -37.6]} r={3.6} fill={near} m={m} />
        </g>
      );
  }
}

function Cup({ m, gid, grand = false }: { m: M; gid: string; grand?: boolean }) {
  const fill = `url(#${gid})`;
  const cyl = `url(#${gid}-cyl)`;
  return (
    <g transform={grand ? 'scale(1.18)' : undefined}>
      <rect x={-8} y={-3} width={16} height={3} rx={0.8} fill={cyl} stroke={m.dark} strokeWidth={0.5} />
      <rect x={-6} y={-5.6} width={12} height={2.8} rx={0.8} fill={cyl} stroke={m.dark} strokeWidth={0.5} />
      <path d="M-1.8 -5.6 C -1.6 -9, -1.2 -11.5, -2.4 -14 H2.4 C 1.2 -11.5, 1.6 -9, 1.8 -5.6 Z" fill={cyl} stroke={m.dark} strokeWidth={0.5} />
      <ellipse cx={0} cy={-9.6} rx={2.6} ry={1} fill={m.base} stroke={m.dark} strokeWidth={0.4} />
      <g fill="none" stroke={m.dark} strokeWidth={3.2} strokeLinecap="round">
        <path d="M-11.4 -29 C -19 -29, -19 -19.5, -8.4 -18.6" />
        <path d="M11.4 -29 C 19 -29, 19 -19.5, 8.4 -18.6" />
      </g>
      <g fill="none" stroke={m.base} strokeWidth={1.8} strokeLinecap="round">
        <path d="M-11.4 -29 C -19 -29, -19 -19.5, -8.4 -18.6" />
        <path d="M11.4 -29 C 19 -29, 19 -19.5, 8.4 -18.6" />
      </g>
      <path d="M-12 -32 H12 C 12 -20.5, 7 -14, 0 -14 C -7 -14, -12 -20.5, -12 -32 Z" fill={cyl} stroke={m.dark} strokeWidth={0.6} />
      <path d="M-8.6 -29.6 C -8.6 -23, -5.6 -18.6, -2.6 -17.2" stroke="#ffffff" strokeWidth={1.4} fill="none" opacity={0.55} strokeLinecap="round" />
      <ellipse cx={0} cy={-32} rx={12} ry={2.4} fill={m.light} stroke={m.dark} strokeWidth={0.5} />
      <ellipse cx={0} cy={-32} rx={10.2} ry={1.5} fill={m.dark} opacity={0.6} />
      {grand && (
        <g>
          <path d="M-12 -31 C -18 -34, -24 -40, -26 -46 C -20 -43, -16 -40, -12.6 -36.6 Z" fill={fill} stroke={m.dark} strokeWidth={0.5} />
          <path d="M12 -31 C 18 -34, 24 -40, 26 -46 C 20 -43, 16 -40, 12.6 -36.6 Z" fill={fill} stroke={m.dark} strokeWidth={0.5} />
          <path d="M-9 -33.5 Q 0 -41 9 -33.5 Z" fill={fill} stroke={m.dark} strokeWidth={0.5} />
          <circle cx={0} cy={-40.6} r={2.4} fill={fill} stroke={m.dark} strokeWidth={0.5} />
        </g>
      )}
    </g>
  );
}

function Medal({ m, gid, accent }: { m: M; gid: string; accent: M }) {
  return (
    <g>
      <rect x={-7} y={-2.4} width={14} height={2.4} rx={0.8} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
      <rect x={-1.3} y={-42} width={2.6} height={40} rx={1} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.4} />
      <rect x={-9} y={-43.4} width={18} height={2.4} rx={1.1} fill={`url(#${gid})`} stroke={m.dark} strokeWidth={0.4} />
      <path d="M-8 -41 L-1.5 -26 L1.6 -26 L-4.6 -41 Z" fill={accent.base} stroke={accent.dark} strokeWidth={0.4} />
      <path d="M8 -41 L1.5 -26 L-1.6 -26 L4.6 -41 Z" fill={accent.dark} stroke={accent.dark} strokeWidth={0.4} />
      <circle cx={0} cy={-18} r={9.4} fill={`url(#${gid})`} stroke={m.dark} strokeWidth={0.8} />
      <circle cx={0} cy={-18} r={7} fill="none" stroke={m.dark} strokeWidth={0.6} opacity={0.7} />
      <path d="M0 -23.4 l1.7 3.5 l3.8 0.4 l-2.8 2.5 l0.9 3.7 l-3.6 -2 l-3.6 2 l0.9 -3.7 l-2.8 -2.5 l3.8 -0.4 Z" fill={m.light} stroke={m.dark} strokeWidth={0.4} />
      <circle cx={-3.6} cy={-21.6} r={1.6} fill="#ffffff" opacity={0.5} />
    </g>
  );
}

function Laurel({ m, gid, y = -18, r = 15 }: { m: M; gid: string; y?: number; r?: number }) {
  const leaves: ReactNode[] = [];
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * (0.62 + k * 0.11);
    for (const side of [-1, 1]) {
      const x = side * Math.cos(a) * r * -1;
      const yy = y + Math.sin(a) * r * 0.9;
      leaves.push(
        <g key={`${k}${side}`} transform={`rotate(${side * (40 - k * 12)} ${x} ${yy})`}>
          <ellipse cx={x} cy={yy} rx={3.6} ry={1.7} fill={`url(#${gid})`} stroke={m.dark} strokeWidth={0.5} />
          <path d={`M${x - 3} ${yy} H${x + 3}`} stroke={m.dark} strokeWidth={0.35} opacity={0.6} />
        </g>
      );
    }
  }
  return <g>{leaves}</g>;
}

/** A metal bowl the flame burns in, so flames never float. */
function Brazier({ m, gid }: { m: M; gid: string }) {
  return (
    <g>
      <rect x={-6} y={-2.4} width={12} height={2.4} rx={0.8} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
      <path d="M-1.6 -2.4 L-1.2 -8 H1.2 L1.6 -2.4 Z" fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.4} />
      <path d="M-10 -14 Q 0 -4, 10 -14 Z" fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.6} />
      <ellipse cx={0} cy={-14} rx={10} ry={1.9} fill={m.light} stroke={m.dark} strokeWidth={0.5} />
    </g>
  );
}

function Flame({ m, gid, size = 1, torch = false, crown = false, laurel = false, lit }: { m: M; gid: string; size?: number; torch?: boolean; crown?: boolean; laurel?: boolean; lit: boolean }) {
  const top = torch ? -24 : -14;
  return (
    <g>
      {laurel && <Laurel m={m} gid={gid} y={top - 14 * size} r={17 * size} />}
      {torch ? (
        <g>
          <rect x={-6} y={-2.4} width={12} height={2.4} rx={0.8} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
          <path d="M-2.2 -2.4 L-3.4 -20 H3.4 L2.2 -2.4 Z" fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
          <path d="M-3.4 -12 H3.4 M-3.1 -7 H3.1" stroke={m.dark} strokeWidth={0.6} opacity={0.6} />
          <path d="M-6.4 -24 L-3.4 -19.6 H3.4 L6.4 -24 Z" fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
          <ellipse cx={0} cy={-24} rx={6.4} ry={1.4} fill={m.light} stroke={m.dark} strokeWidth={0.4} />
        </g>
      ) : (
        <Brazier m={m} gid={gid} />
      )}
      <g transform={`translate(0 ${top}) scale(${size})`} className={lit ? 'base-flame' : undefined}>
        <path
          d="M0 -30 C 7 -22, 11 -17, 9.4 -9 C 8 -2.4, 3.6 0, 0 0 C -3.6 0, -8 -2.4, -9.4 -9 C -11 -17, -5 -20, -3.4 -25 C -2.6 -20, -1 -18.6, 0 -18.6 C -1.6 -23.6, -1.6 -27, 0 -30 Z"
          fill={lit ? FIRE : `url(#${gid})`}
          stroke={lit ? '#c2410c' : m.dark}
          strokeWidth={0.7}
        />
        <path d="M0 -17 C 3.4 -12, 5 -8.6, 4.2 -5 C 3.4 -1.6, 1.6 -0.8, 0 -0.8 C -1.6 -0.8, -4.2 -2.4, -4.2 -5.8 C -4.2 -9.4, -1.6 -12, 0 -17 Z" fill={lit ? WINDOW_LIT : m.light} />
      </g>
      {crown && (
        <g transform={`translate(0 ${top - 33 * size})`}>
          <path d="M-9.4 0 L-9.4 -7.6 L-4.8 -3.4 L0 -10 L4.8 -3.4 L9.4 -7.6 L9.4 0 Z" fill={`url(#${gid})`} stroke={m.dark} strokeWidth={0.7} />
          <rect x={-9.4} y={-1.6} width={18.8} height={2.2} fill={m.dark} opacity={0.5} />
          {[-9.4, 0, 9.4].map((x, i) => (
            <circle key={i} cx={x} cy={i === 1 ? -10 : -7.6} r={1.5} fill={m.light} stroke={m.dark} strokeWidth={0.4} />
          ))}
          <circle cx={0} cy={-3} r={1.4} fill="#e5484d" />
        </g>
      )}
    </g>
  );
}

function Star({ m, gid }: { m: M; gid: string }) {
  const cx = 0;
  const cy = -28;
  const outer = 15;
  const inner = 6.4;
  const p = (i: number, r: number): J => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const facets: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const a = p(i, i % 2 ? inner : outer);
    const b = p(i + 1, (i + 1) % 2 ? inner : outer);
    facets.push(<polygon key={i} points={pts([[cx, cy], a, b])} fill={i % 2 ? m.dark : m.light} opacity={i % 2 ? 0.9 : 1} />);
  }
  return (
    <g>
      <rect x={-6} y={-2.4} width={12} height={2.4} rx={0.8} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
      <path d="M-2 -2.4 L-1.4 -13 H1.4 L2 -2.4 Z" fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.4} />
      <polygon points={pts(Array.from({ length: 10 }, (_, i) => p(i, i % 2 ? inner : outer)))} fill={m.base} stroke={m.dark} strokeWidth={0.9} />
      {facets}
      <polygon points={pts(Array.from({ length: 10 }, (_, i) => p(i, i % 2 ? inner : outer)))} fill="none" stroke={m.dark} strokeWidth={0.7} />
    </g>
  );
}

function Scales({ m, gid }: { m: M; gid: string }) {
  return (
    <g>
      <rect x={-7} y={-2.6} width={14} height={2.6} rx={0.8} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
      <rect x={-1.5} y={-41} width={3} height={38.6} rx={1} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.4} />
      <path d="M-18 -36.6 Q 0 -39.4 18 -36.6" stroke={m.dark} strokeWidth={2.8} fill="none" strokeLinecap="round" />
      <path d="M-18 -36.6 Q 0 -39.4 18 -36.6" stroke={m.light} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={-42} r={2.6} fill={`url(#${gid})`} stroke={m.dark} strokeWidth={0.5} />
      {[-15.5, 15.5].map((x) => (
        <g key={x}>
          <path d={`M${x} -36.4 L${x - 6.4} -24.4 M${x} -36.4 L${x + 6.4} -24.4`} stroke={m.dark} strokeWidth={0.6} />
          <path d={`M${x - 8.4} -24.4 H${x + 8.4} Q${x} -16.6 ${x - 8.4} -24.4 Z`} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.6} />
          <ellipse cx={x} cy={-24.4} rx={8.4} ry={1.3} fill={m.light} stroke={m.dark} strokeWidth={0.4} />
        </g>
      ))}
    </g>
  );
}

function Kettlebell({ m, gid }: { m: M; gid: string }) {
  return (
    <g>
      <path d="M-7.6 -27 C -7.6 -38.6, 7.6 -38.6, 7.6 -27" stroke={m.dark} strokeWidth={4.6} fill="none" strokeLinecap="round" />
      <path d="M-7.6 -27 C -7.6 -38.6, 7.6 -38.6, 7.6 -27" stroke={m.base} strokeWidth={2.8} fill="none" strokeLinecap="round" />
      <path d="M-5.4 -34.6 C -3 -36.6, 3 -36.6, 5.4 -34.6" stroke={m.light} strokeWidth={0.9} fill="none" opacity={0.8} />
      <circle cx={0} cy={-14.4} r={13.4} fill={`url(#${gid})`} stroke={m.dark} strokeWidth={0.8} />
      <ellipse cx={-4.6} cy={-19.6} rx={4} ry={3} fill="#ffffff" opacity={0.45} />
      <rect x={-8} y={-2.4} width={16} height={2.4} rx={1} fill={m.dark} />
    </g>
  );
}

function Obelisk({ m, gid }: { m: M; gid: string }) {
  return (
    <g>
      <rect x={-9} y={-3} width={18} height={3} rx={0.8} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
      <polygon points="-6.4,-3 0,-3 0,-46 -4.6,-44" fill={`url(#${gid})`} stroke={m.dark} strokeWidth={0.5} />
      <polygon points="0,-3 6.4,-3 4.6,-44 0,-46" fill={`url(#${gid}-far)`} stroke={m.dark} strokeWidth={0.5} />
      <polygon points="-4.6,-44 0,-46 0,-54" fill={m.light} stroke={m.dark} strokeWidth={0.5} />
      <polygon points="0,-46 4.6,-44 0,-54" fill={m.base} stroke={m.dark} strokeWidth={0.5} />
      <path d="M-3 -38 V-10" stroke="#ffffff" strokeWidth={1} opacity={0.4} />
    </g>
  );
}

function Wreath({ m, gid }: { m: M; gid: string }) {
  return (
    <g>
      <rect x={-6} y={-2.4} width={12} height={2.4} rx={0.8} fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.5} />
      <path d="M-1.8 -2.4 L-1.2 -16 H1.2 L1.8 -2.4 Z" fill={`url(#${gid}-cyl)`} stroke={m.dark} strokeWidth={0.4} />
      <Laurel m={m} gid={gid} y={-30} r={14} />
      <path d="M-3 -16.6 L0 -19.6 L3 -16.6" stroke={m.dark} strokeWidth={1.4} fill="none" />
    </g>
  );
}

function Statue({ id, m, gid, accent, lit }: { id: string; m: M; gid: string; accent: M; lit: boolean }) {
  switch (id) {
    case 'first-set':
      return <Medal m={m} gid={gid} accent={accent} />;
    case 'sets-50':
      return <Cup m={m} gid={gid} />;
    case 'sets-250':
      return (
        <g>
          <Laurel m={m} gid={gid} y={-24} r={21} />
          <Cup m={m} gid={gid} grand />
        </g>
      );
    case 'streak-3':
      return <Flame m={m} gid={gid} size={0.8} lit={lit} />;
    case 'streak-7':
      return <Flame m={m} gid={gid} size={0.75} torch lit={lit} />;
    case 'streak-30':
      return <Flame m={m} gid={gid} size={0.9} laurel lit={lit} />;
    case 'streak-100':
      return <Flame m={m} gid={gid} size={1} crown laurel lit={lit} />;
    case 'pushups-30':
      return <Athlete pose="plank" m={m} gid={gid} />;
    case 'pushups-50':
      return (
        <g>
          <Laurel m={m} gid={gid} y={-18} r={19} />
          <Athlete pose="plank" m={m} gid={gid} />
        </g>
      );
    case 'first-pull-up':
      return <Athlete pose="hang" m={m} gid={gid} />;
    case 'first-pistol':
      return <Athlete pose="pistol" m={m} gid={gid} />;
    case 'first-loaded':
      return <Kettlebell m={m} gid={gid} />;
    case 'first-elite':
      return <Star m={m} gid={gid} />;
    case 'balanced-week':
      return <Scales m={m} gid={gid} />;
    case 'first-session':
      return <Athlete pose="lift" m={m} gid={gid} />;
    case 'first-week':
      return <Obelisk m={m} gid={gid} />;
    case 'weeks-4':
      return <Wreath m={m} gid={gid} />;
    case 'weeks-12':
      return (
        <g transform="scale(1.12)">
          <Athlete pose="flex" m={m} gid={gid} />
        </g>
      );
    default:
      return <Cup m={m} gid={gid} />;
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
  const tierKey = def?.tier ?? 'bronze';
  const tier = TIER[tierKey];
  const gid = `trophy-metal-${tierKey}`;
  const accent = color ? themeFor('trophy', color) : { light: '#ff8fa3', base: '#e5484d', dark: '#9c2a33' };
  const h = 30;
  const [sx, sy] = P(ox + 50, oy + 50, h + 5);
  const [vx, vy] = P(ox + 74, oy + 40, h * 0.55);
  return (
    <g>
      <ellipse cx={P(ox + 50, oy + 50)[0] + 4} cy={P(ox + 50, oy + 50)[1] + 3} rx={30} ry={11} fill="url(#hf-shadow)" />
      <Pedestal ox={ox} oy={oy} h={h} tier={tier} number={NUMBER[trophyId] ?? ''} accent={accent} />
      <g transform={`translate(${sx} ${sy}) scale(1.35)`}>
        <MetalDefs id={gid} m={tier} />
        <ellipse cx={0} cy={0.4} rx={11} ry={3.2} fill="#000" opacity={0.22} />
        <Statue id={trophyId} m={tier} gid={gid} accent={accent} lit={lit} />
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
