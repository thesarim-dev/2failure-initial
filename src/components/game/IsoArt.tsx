import { IsoTrophy } from './IsoTrophy';
import type { ReactNode } from 'react';
import type { PlacedItem, TodayPlan } from '../../game/engine';
import {
  FIRE,
  GRASS,
  METAL,
  STONE,
  WINDOW_DARK,
  WINDOW_LIT,
  materialsFor,
  themeFor,
  type Materials,
  type Shades
} from './BaseArt';

/**
 * True isometric buildings, drawn in the same projection as the ground so
 * every building sits exactly on its tiles (like Clash of Clans).
 *
 * World units: 100 per tile on the ground (X, Y) and height Z. Lit from the
 * top-left: tops are lightest, the left (front) wall is mid-tone, the right
 * wall is shaded.
 */

const ZK = 0.6; // screen pixels per unit of height

export function P(x: number, y: number, z = 0): [number, number] {
  return [(x - y) * 0.5, (x + y) * 0.25 - z * ZK];
}
const pts = (list: Array<[number, number]>) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

type Box = { x0: number; y0: number; x1: number; y1: number; z0: number; z1: number };

/** A block with its top and the two visible walls, plus subtle courses and lit edges. */
function IsoBox({ b, s, courses = true }: { b: Box; s: Shades; courses?: boolean }) {
  const { x0, y0, x1, y1, z0, z1 } = b;
  const left = pts([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]);
  const right = pts([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)]);
  const top = pts([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]);
  const rows: number[] = [];
  if (courses && z1 - z0 > 20) for (let z = z0 + 11; z < z1 - 4; z += 11) rows.push(z);
  return (
    <g>
      <polygon points={left} fill={s.base} />
      <polygon points={left} fill="url(#hf-face)" />
      <polygon points={right} fill={s.dark} />
      <polygon points={right} fill="url(#hf-side)" />
      {rows.map((z) => (
        <g key={z} stroke="#000" strokeOpacity={0.09} strokeWidth={0.8}>
          <line x1={P(x0, y1, z)[0]} y1={P(x0, y1, z)[1]} x2={P(x1, y1, z)[0]} y2={P(x1, y1, z)[1]} />
          <line x1={P(x1, y0, z)[0]} y1={P(x1, y0, z)[1]} x2={P(x1, y1, z)[0]} y2={P(x1, y1, z)[1]} />
        </g>
      ))}
      <polygon points={top} fill={s.light} />
      <polygon points={top} fill="url(#hf-top)" />
      {/* Lit top edges and the shaded corner. */}
      <polyline points={pts([P(x0, y1, z1), P(x1, y1, z1), P(x1, y0, z1)])} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={1} />
      <line x1={P(x1, y1, z0)[0]} y1={P(x1, y1, z0)[1]} x2={P(x1, y1, z1)[0]} y2={P(x1, y1, z1)[1]} stroke="#000" strokeOpacity={0.2} strokeWidth={0.9} />
    </g>
  );
}

/** A quad on the left wall (y = y1): u runs along X (0..1), v along Z (0..1). */
function leftQuad(b: Box, u0: number, u1: number, v0: number, v1: number) {
  const x = (u: number) => b.x0 + (b.x1 - b.x0) * u;
  const z = (v: number) => b.z0 + (b.z1 - b.z0) * v;
  return pts([P(x(u0), b.y1, z(v0)), P(x(u1), b.y1, z(v0)), P(x(u1), b.y1, z(v1)), P(x(u0), b.y1, z(v1))]);
}
/** A quad on the right wall (x = x1): u runs along Y (0..1), v along Z (0..1). */
function rightQuad(b: Box, u0: number, u1: number, v0: number, v1: number) {
  const y = (u: number) => b.y0 + (b.y1 - b.y0) * u;
  const z = (v: number) => b.z0 + (b.z1 - b.z0) * v;
  return pts([P(b.x1, y(u0), z(v0)), P(b.x1, y(u1), z(v0)), P(b.x1, y(u1), z(v1)), P(b.x1, y(u0), z(v1))]);
}

function IsoWindow({ points, lit }: { points: string; lit: boolean }) {
  return (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      <polygon points={points} fill="#3a2a1c" stroke="#3a2a1c" strokeWidth={2.2} strokeLinejoin="round" />
      <polygon points={points} fill={lit ? WINDOW_LIT : WINDOW_DARK} />
      {lit && <polygon points={points} fill="url(#hf-face)" />}
    </g>
  );
}

function IsoDoor({ points }: { points: string }) {
  return (
    <g>
      <polygon points={points} fill="#3a2a1c" stroke="#2a1a10" strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

function PyramidRoof({ x0, y0, x1, y1, z, rise, o = 6, s }: { x0: number; y0: number; x1: number; y1: number; z: number; rise: number; o?: number; s: Shades }) {
  const A = P(x0 - o, y0 - o, z);
  const B = P(x1 + o, y0 - o, z);
  const C = P(x1 + o, y1 + o, z);
  const D = P(x0 - o, y1 + o, z);
  const E = P((x0 + x1) / 2, (y0 + y1) / 2, z + rise);
  void A;
  const rows = [0.25, 0.5, 0.75];
  const lerp = (p: [number, number], q: [number, number], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  return (
    <g>
      <polygon points={pts([D, C, E])} fill={s.base} />
      <polygon points={pts([B, C, E])} fill={s.dark} />
      {rows.map((t) => {
        const [a1, a2] = lerp(E, D, t);
        const [b1, b2] = lerp(E, C, t);
        const [c1, c2] = lerp(E, B, t);
        return <polyline key={t} points={`${a1},${a2} ${b1},${b2} ${c1},${c2}`} fill="none" stroke="#000" strokeOpacity={0.14} strokeWidth={0.9} />;
      })}
      <polygon points={pts([D, C, E])} fill="url(#hf-roof)" />
      <line x1={C[0]} y1={C[1]} x2={E[0]} y2={E[1]} stroke="#fff" strokeOpacity={0.35} strokeWidth={1.1} />
      <polyline points={pts([D, C, B])} fill="none" stroke="#000" strokeOpacity={0.25} strokeWidth={1.4} />
    </g>
  );
}

/** A gable roof with its ridge along X; the gable end wall faces right. */
function GableRoof({ x0, y0, x1, y1, z, rise, o = 6, s, wall }: { x0: number; y0: number; x1: number; y1: number; z: number; rise: number; o?: number; s: Shades; wall: Shades }) {
  const ym = (y0 + y1) / 2;
  const R0 = P(x0 - o, ym, z + rise);
  const R1 = P(x1 + o, ym, z + rise);
  const F0 = P(x0 - o, y1 + o, z);
  const F1 = P(x1 + o, y1 + o, z);
  const G0 = P(x1, y0, z);
  const G1 = P(x1, y1, z);
  const GT = P(x1, ym, z + rise - 4);
  const rows = [0.2, 0.4, 0.6, 0.8];
  const lerp = (p: [number, number], q: [number, number], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  return (
    <g>
      {/* Gable end wall, then the overhanging roof edge above it. */}
      <polygon points={pts([G0, G1, GT])} fill={wall.dark} />
      <polygon points={pts([G0, G1, GT])} fill="url(#hf-side)" />
      <polygon points={pts([P(x1 + o, y0 - o, z), F1, R1])} fill="none" stroke={s.dark} strokeWidth={4} strokeLinejoin="round" />
      <polygon points={pts([R0, R1, F1, F0])} fill={s.base} />
      {rows.map((t) => {
        const [a1, a2] = lerp(R0, F0, t);
        const [b1, b2] = lerp(R1, F1, t);
        return <line key={t} x1={a1} y1={a2} x2={b1} y2={b2} stroke="#000" strokeOpacity={0.14} strokeWidth={0.9} />;
      })}
      <polygon points={pts([R0, R1, F1, F0])} fill="url(#hf-roof)" />
      <line x1={R0[0]} y1={R0[1]} x2={R1[0]} y2={R1[1]} stroke="#fff" strokeOpacity={0.55} strokeWidth={1.6} />
      <line x1={F0[0]} y1={F0[1]} x2={F1[0]} y2={F1[1]} stroke="#000" strokeOpacity={0.25} strokeWidth={1.6} />
    </g>
  );
}

/** A round basin or tower: an upright cylinder. */
function IsoCylinder({ cx, cy, r, z0, z1, s }: { cx: number; cy: number; r: number; z0: number; z1: number; s: Shades }) {
  const [tx, ty] = P(cx, cy, z1);
  const [bx, by] = P(cx, cy, z0);
  const rx = r * 0.707;
  const ry = r * 0.354;
  return (
    <g>
      <ellipse cx={bx} cy={by} rx={rx} ry={ry} fill={s.dark} />
      <rect x={tx - rx} y={ty} width={rx * 2} height={by - ty} fill={s.base} />
      <rect x={tx - rx} y={ty} width={rx * 2} height={by - ty} fill="url(#hf-face)" />
      <rect x={tx + rx * 0.3} y={ty} width={rx * 0.7} height={by - ty} fill="#000" opacity={0.12} />
      <ellipse cx={tx} cy={ty} rx={rx} ry={ry} fill={s.light} />
    </g>
  );
}

function IsoShadow({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const o = 10;
  return (
    <polygon
      points={pts([P(x0 - o + 14, y0 + 14), P(x1 + o + 6, y0 + 6), P(x1 + o + 6, y1 + o + 8), P(x0 - o + 14, y1 + o + 8)])}
      fill="#000"
      opacity={0.22}
    />
  );
}

/** Banners, plating or glow on a building's main body. */
function IsoDecorations({ kind, b, s, lit }: { kind?: string; b: Box; s: Shades; lit: boolean }) {
  if (!kind || kind === 'plain') return null;
  if (kind === 'banners') {
    return (
      <g>
        {[0.16, 0.7].map((u) => (
          <g key={u}>
            <polygon points={leftQuad(b, u, u + 0.14, 0.42, 0.95)} fill={s.base} />
            <polygon points={leftQuad(b, u + 0.07, u + 0.14, 0.42, 0.95)} fill={s.dark} />
            <polygon points={leftQuad(b, u + 0.03, u + 0.11, 0.62, 0.72)} fill={s.light} />
          </g>
        ))}
        <polygon points={rightQuad(b, 0.4, 0.58, 0.45, 0.95)} fill={s.dark} />
      </g>
    );
  }
  if (kind === 'plated') {
    return (
      <g>
        <polygon points={leftQuad(b, 0, 1, 0, 0.22)} fill={METAL.base} />
        <polygon points={rightQuad(b, 0, 1, 0, 0.22)} fill={METAL.dark} />
        {[0.12, 0.37, 0.62, 0.87].map((u) => {
          const [x, y] = P(b.x0 + (b.x1 - b.x0) * u, b.y1, b.z0 + (b.z1 - b.z0) * 0.11);
          return <circle key={u} cx={x} cy={y} r={1.3} fill={METAL.light} />;
        })}
        <polyline points={pts([P(b.x0, b.y1, b.z0 + (b.z1 - b.z0) * 0.22), P(b.x1, b.y1, b.z0 + (b.z1 - b.z0) * 0.22), P(b.x1, b.y0, b.z0 + (b.z1 - b.z0) * 0.22)])} fill="none" stroke={METAL.light} strokeWidth={1.2} />
      </g>
    );
  }
  // glow
  const z = b.z0 + 3;
  return (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      <polyline points={pts([P(b.x0, b.y1, z), P(b.x1, b.y1, z), P(b.x1, b.y0, z)])} fill="none" stroke={lit ? s.light : s.dark} strokeWidth={2.6} strokeLinecap="round" />
      <polyline points={pts([P(b.x0, b.y1, b.z1 - 2), P(b.x1, b.y1, b.z1 - 2), P(b.x1, b.y0, b.z1 - 2)])} fill="none" stroke={lit ? s.light : s.dark} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
    </g>
  );
}

function Beacon({ at, s, lit, r = 5 }: { at: [number, number]; s: Shades; lit: boolean; r?: number }) {
  return (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      {lit && <circle cx={at[0]} cy={at[1]} r={r * 2.4} fill={s.light} opacity={0.25} />}
      <circle cx={at[0]} cy={at[1]} r={r} fill={lit ? s.light : s.dark} />
    </g>
  );
}

function Flag({ at, s, h = 26 }: { at: [number, number]; s: Shades; h?: number }) {
  const [x, y] = at;
  return (
    <g>
      <rect x={x - 1} y={y - h} width={2.2} height={h} fill={METAL.dark} />
      <polygon points={`${x + 1},${y - h} ${x + 17},${y - h + 4} ${x + 1},${y - h + 9}`} fill={s.base} />
      <polygon points={`${x + 1},${y - h + 4.5} ${x + 17},${y - h + 4} ${x + 1},${y - h + 9}`} fill={s.dark} />
    </g>
  );
}

type IsoProps = { ox: number; oy: number; size: number; level: number; lit: boolean; s: Shades; m: Materials; decoration?: string; plan?: TodayPlan | null };

// ---------------------------------------------------------------------------
// Upgrade pieces: thatch, stone foundations, timber framing, gold trim, crests
// ---------------------------------------------------------------------------

const THATCH: Shades = { light: '#f2c66b', base: '#d9a441', dark: '#a8741f' };
const DARK_STONE: Shades = { light: '#8a8f99', base: '#5e636d', dark: '#3c4048' };
const BEAM = '#4a2f1a';
const GOLD: Shades = { light: '#fff0a8', base: '#f7c948', dark: '#b9861a' };

/** Darker, weathered stone for grand levels; follows the player's colour if one is set. */
function darkStone(m: Materials): Shades {
  if (m.stone === STONE) return DARK_STONE;
  const dim = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (sh: number) => Math.round(((n >> sh) & 255) * 0.58);
    return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`;
  };
  return { light: dim(m.stone.light), base: dim(m.stone.base), dark: dim(m.stone.dark) };
}

const lerp2 = (p: [number, number], q: [number, number], t: number): [number, number] => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];

/** A straw gable roof (ridge along X): golden thatch with strands and a ragged eave. */
function ThatchRoof({ x0, y0, x1, y1, z, rise, o = 8, ridge, wall }: { x0: number; y0: number; x1: number; y1: number; z: number; rise: number; o?: number; ridge: Shades; wall: Shades }) {
  const ym = (y0 + y1) / 2;
  const R0 = P(x0 - o, ym, z + rise);
  const R1 = P(x1 + o, ym, z + rise);
  const F0 = P(x0 - o, y1 + o, z - 4);
  const F1 = P(x1 + o, y1 + o, z - 4);
  const B0 = P(x1 + o, y0 - o, z - 4);
  const strands = 16;
  return (
    <g>
      {/* Gable end wall under the thatch */}
      <polygon points={pts([P(x1, y0, z), P(x1, y1, z), P(x1, ym, z + rise - 6)])} fill={wall.dark} />
      {/* Thatch end (right slope edge, seen side-on) */}
      <polygon points={pts([B0, F1, R1])} fill={THATCH.dark} />
      <polygon points={pts([R0, R1, F1, F0])} fill={THATCH.base} />
      {/* Straw strands running down the slope */}
      <g stroke={THATCH.dark} strokeOpacity={0.45} strokeWidth={1}>
        {Array.from({ length: strands }, (_, i) => {
          const t = (i + 0.5) / strands;
          const [a1, a2] = lerp2(R0, R1, t);
          const [b1, b2] = lerp2(F0, F1, t);
          return <line key={i} x1={a1} y1={a2} x2={b1} y2={b2} />;
        })}
      </g>
      {/* Bundled rows */}
      {[0.35, 0.68].map((t) => {
        const [a1, a2] = lerp2(R0, F0, t);
        const [b1, b2] = lerp2(R1, F1, t);
        return <line key={t} x1={a1} y1={a2} x2={b1} y2={b2} stroke={THATCH.dark} strokeWidth={2} strokeOpacity={0.5} />;
      })}
      <polygon points={pts([R0, R1, F1, F0])} fill="url(#hf-roof)" />
      {/* Ragged eave */}
      <polyline
        points={Array.from({ length: 13 }, (_, i) => {
          const [x, y] = lerp2(F0, F1, i / 12);
          return `${x},${y + (i % 2 ? 3.5 : 0)}`;
        }).join(' ')}
        fill="none"
        stroke={THATCH.dark}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Ridge cap in the building's colour */}
      <line x1={R0[0]} y1={R0[1]} x2={R1[0]} y2={R1[1]} stroke={ridge.base} strokeWidth={5} strokeLinecap="round" />
      <line x1={R0[0]} y1={R0[1] - 1.5} x2={R1[0]} y2={R1[1] - 1.5} stroke={ridge.light} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

/** A straw cone roof for small towers and lookouts. */
function ThatchCone({ x0, y0, x1, y1, z, rise, o = 6, tip }: { x0: number; y0: number; x1: number; y1: number; z: number; rise: number; o?: number; tip: Shades }) {
  const B = P(x1 + o, y0 - o, z - 3);
  const C = P(x1 + o, y1 + o, z - 3);
  const D = P(x0 - o, y1 + o, z - 3);
  const E = P((x0 + x1) / 2, (y0 + y1) / 2, z + rise);
  return (
    <g>
      <polygon points={pts([D, C, E])} fill={THATCH.base} />
      <polygon points={pts([B, C, E])} fill={THATCH.dark} />
      <g stroke={THATCH.dark} strokeOpacity={0.45} strokeWidth={1}>
        {Array.from({ length: 9 }, (_, i) => {
          const [x, y] = lerp2(D, C, (i + 0.5) / 9);
          return <line key={i} x1={E[0]} y1={E[1]} x2={x} y2={y} />;
        })}
      </g>
      <polyline points={pts([D, C, B])} fill="none" stroke={THATCH.dark} strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={E[0]} cy={E[1]} r={3.2} fill={tip.base} />
    </g>
  );
}

/** A stone foundation: a short wide block with staggered stone joints. */
function Plinth({ b, s }: { b: Box; s: Shades }) {
  const rows = Math.max(1, Math.round((b.z1 - b.z0) / 7));
  const joints: string[] = [];
  for (let r = 0; r < rows; r++) {
    const v0 = r / rows;
    const v1 = (r + 1) / rows;
    for (let u = (r % 2) * 0.09 + 0.09; u < 1; u += 0.18) {
      const [ax, ay] = P(b.x0 + (b.x1 - b.x0) * u, b.y1, b.z0 + (b.z1 - b.z0) * v0);
      const [bx, by] = P(b.x0 + (b.x1 - b.x0) * u, b.y1, b.z0 + (b.z1 - b.z0) * v1);
      joints.push(`M${ax} ${ay} L${bx} ${by}`);
      const [cx, cy] = P(b.x1, b.y0 + (b.y1 - b.y0) * u, b.z0 + (b.z1 - b.z0) * v0);
      const [dx, dy] = P(b.x1, b.y0 + (b.y1 - b.y0) * u, b.z0 + (b.z1 - b.z0) * v1);
      joints.push(`M${cx} ${cy} L${dx} ${dy}`);
    }
  }
  return (
    <g>
      <IsoBox b={b} s={s} courses={false} />
      {Array.from({ length: rows - 1 }, (_, r) => {
        const z = b.z0 + ((b.z1 - b.z0) * (r + 1)) / rows;
        return <polyline key={r} points={pts([P(b.x0, b.y1, z), P(b.x1, b.y1, z), P(b.x1, b.y0, z)])} fill="none" stroke="#000" strokeOpacity={0.22} strokeWidth={0.9} />;
      })}
      <path d={joints.join(' ')} stroke="#000" strokeOpacity={0.22} strokeWidth={0.9} />
    </g>
  );
}

/** Dark timber framing on both visible walls: corner posts, a mid beam and braces. */
function TimberFrame({ b, brace = true }: { b: Box; brace?: boolean }) {
  const L = (u: number, v: number) => P(b.x0 + (b.x1 - b.x0) * u, b.y1, b.z0 + (b.z1 - b.z0) * v);
  const Rt = (u: number, v: number) => P(b.x1, b.y0 + (b.y1 - b.y0) * u, b.z0 + (b.z1 - b.z0) * v);
  const seg = (a: [number, number], c: [number, number], w = 2.6) => <line x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} stroke={BEAM} strokeWidth={w} strokeLinecap="square" />;
  return (
    <g>
      {seg(L(0, 0), L(0, 1), 3.2)}
      {seg(L(1, 0), L(1, 1), 3.2)}
      {seg(Rt(0, 0), Rt(0, 1), 3.2)}
      {seg(L(0, 0.55), L(1, 0.55))}
      {seg(Rt(0, 0.55), Rt(1, 0.55))}
      {seg(L(0, 1), L(1, 1))}
      {seg(Rt(0, 1), Rt(1, 1))}
      {brace && seg(L(0.03, 0.57), L(0.28, 0.98), 2)}
      {brace && seg(L(0.97, 0.57), L(0.72, 0.98), 2)}
      {brace && seg(Rt(0.05, 0.57), Rt(0.4, 0.98), 2)}
    </g>
  );
}

/** Gold trim along the visible eaves of a gable roof. */
function GoldEaves({ x0, y0, x1, y1, z, rise, o = 8 }: { x0: number; y0: number; x1: number; y1: number; z: number; rise: number; o?: number }) {
  const ym = (y0 + y1) / 2;
  const F0 = P(x0 - o, y1 + o, z);
  const F1 = P(x1 + o, y1 + o, z);
  const R1 = P(x1 + o, ym, z + rise);
  const B0 = P(x1 + o, y0 - o, z);
  const R0 = P(x0 - o, ym, z + rise);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={pts([F0, F1, R1, B0])} stroke={GOLD.dark} strokeWidth={4.5} />
      <polyline points={pts([F0, F1, R1, B0])} stroke={GOLD.base} strokeWidth={2.6} />
      <line x1={R0[0]} y1={R0[1]} x2={R1[0]} y2={R1[1]} stroke={GOLD.base} strokeWidth={3} />
      <circle cx={R1[0]} cy={R1[1] - 3} r={3.4} fill={GOLD.base} stroke={GOLD.dark} strokeWidth={1} />
    </g>
  );
}

/** A heraldic crest: a shield in the building's colour with a gold rim. */
function Crest({ at, size = 12, s, gold = false }: { at: [number, number]; size?: number; s: Shades; gold?: boolean }) {
  const [x, y] = at;
  const w = size * 0.8;
  const d = `M${x - w / 2} ${y - size / 2} H${x + w / 2} V${y + size * 0.05} Q${x + w / 2} ${y + size * 0.4} ${x} ${y + size / 2} Q${x - w / 2} ${y + size * 0.4} ${x - w / 2} ${y + size * 0.05} Z`;
  return (
    <g>
      <path d={d} fill={s.base} stroke={gold ? GOLD.base : '#3a2a1c'} strokeWidth={gold ? 2 : 1.4} />
      <path d={`M${x} ${y - size / 2} V${y + size / 2}`} stroke={s.light} strokeWidth={1.4} opacity={0.8} />
      <circle cx={x} cy={y - size * 0.05} r={size * 0.16} fill={gold ? GOLD.base : s.light} />
    </g>
  );
}

function Lantern({ at, lit }: { at: [number, number]; lit: boolean }) {
  const [x, y] = at;
  return (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      <rect x={x - 1} y={y - 9} width={2} height={4} fill={BEAM} />
      <rect x={x - 3} y={y - 5} width={6} height={7} rx={1.5} fill="#2a1a10" />
      <rect x={x - 2} y={y - 4} width={4} height={5} rx={1} fill={lit ? WINDOW_LIT : WINDOW_DARK} />
      {lit && <circle cx={x} cy={y - 1.5} r={7} fill={WINDOW_LIT} opacity={0.2} />}
    </g>
  );
}

/** A fire basket on top of a tower; flickers when lit. */
function Brazier({ at, lit }: { at: [number, number]; lit: boolean }) {
  const [x, y] = at;
  return (
    <g>
      <path d={`M${x - 7} ${y - 6} L${x + 7} ${y - 6} L${x + 4} ${y} L${x - 4} ${y} Z`} fill={DARK_STONE.dark} stroke={GOLD.dark} strokeWidth={1} />
      <g className={lit ? 'base-flame' : undefined}>
        <path d={`M${x} ${y - 22} C ${x + 7} ${y - 14}, ${x + 6} ${y - 8}, ${x} ${y - 6} C ${x - 6} ${y - 8}, ${x - 7} ${y - 14}, ${x} ${y - 22} Z`} fill={lit ? FIRE : '#6a3a20'} />
        <path d={`M${x} ${y - 15} C ${x + 3} ${y - 11}, ${x + 3} ${y - 8}, ${x} ${y - 7} C ${x - 3} ${y - 8}, ${x - 3} ${y - 11}, ${x} ${y - 15} Z`} fill={lit ? WINDOW_LIT : '#8a4a28'} />
      </g>
      {lit && <circle cx={x} cy={y - 12} r={14} fill={FIRE} opacity={0.18} />}
    </g>
  );
}

/** An iron-banded door: planks in the building's colour with metal straps. */
function BandedDoor({ b, u0, u1, h, s }: { b: Box; u0: number; u1: number; h: number; s: Shades }) {
  return (
    <g>
      <polygon points={leftQuad(b, u0 - 0.03, u1 + 0.03, 0, h + 0.06)} fill={DARK_STONE.dark} />
      <polygon points={leftQuad(b, u0, u1, 0, h)} fill={s.dark} />
      {[0.25, 0.7].map((v) => (
        <polygon key={v} points={leftQuad(b, u0, u1, h * v, h * v + 0.05)} fill="#2a2a30" />
      ))}
      <polygon points={leftQuad(b, (u0 + u1) / 2 - 0.006, (u0 + u1) / 2 + 0.006, 0, h)} fill="#000" opacity={0.3} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Buildings (ox, oy = the footprint's top corner in world units)
// ---------------------------------------------------------------------------

function Headquarters({ ox, oy, level, lit, s, m, decoration }: IsoProps) {
  if (level === 1) {
    // A humble thatched longhouse with a porch.
    const hall: Box = { x0: ox + 22, y0: oy + 34, x1: ox + 178, y1: oy + 160, z0: 0, z1: 56 };
    return (
      <g>
        <IsoShadow x0={hall.x0} y0={hall.y0} x1={hall.x1} y1={hall.y1} />
        <IsoBox b={{ x0: ox + 70, y0: hall.y1, x1: ox + 130, y1: oy + 182, z0: 0, z1: 5 }} s={m.wood} courses={false} />
        <IsoBox b={hall} s={m.wood} />
        <TimberFrame b={hall} brace={false} />
        <IsoDoor points={leftQuad(hall, 0.42, 0.58, 0, 0.62)} />
        <IsoWindow points={leftQuad(hall, 0.12, 0.24, 0.35, 0.62)} lit={lit} />
        <IsoWindow points={leftQuad(hall, 0.76, 0.88, 0.35, 0.62)} lit={lit} />
        <IsoWindow points={rightQuad(hall, 0.4, 0.6, 0.35, 0.62)} lit={lit} />
        {[ox + 72, ox + 128].map((x) => (
          <IsoBox key={x} b={{ x0: x - 3, y0: oy + 177, x1: x + 3, y1: oy + 183, z0: 5, z1: 46 }} s={m.wood} courses={false} />
        ))}
        <IsoDecorations kind={decoration} b={hall} s={s} lit={lit} />
        <ThatchRoof x0={hall.x0} y0={hall.y0} x1={hall.x1} y1={hall.y1} z={56} rise={56} o={10} ridge={s} wall={m.wood} />
        <Crest at={P(hall.x1, (hall.y0 + hall.y1) / 2, 84)} size={16} s={s} />
      </g>
    );
  }
  const grand = level >= 3;
  const plinth: Box = { x0: ox + 14, y0: oy + 14, x1: ox + 186, y1: oy + 186, z0: 0, z1: grand ? 16 : 10 };
  const body: Box = { x0: ox + 30, y0: oy + 30, x1: ox + 170, y1: oy + 170, z0: plinth.z1, z1: plinth.z1 + (grand ? 82 : 70) };
  const wallS = grand ? darkStone(m) : m.stone;
  const towerH = body.z1 + (grand ? 46 : 28);
  const towers: Box[] = [
    { x0: ox + 10, y0: oy + 144, x1: ox + 54, y1: oy + 188, z0: 0, z1: towerH },
    { x0: ox + 144, y0: oy + 10, x1: ox + 188, y1: oy + 54, z0: 0, z1: towerH }
  ];
  return (
    <g>
      <IsoShadow x0={ox + 8} y0={oy + 8} x1={ox + 190} y1={oy + 190} />
      <Plinth b={plinth} s={grand ? darkStone(m) : m.stone} />
      <IsoBox b={body} s={wallS} />
      {grand && <TimberFrame b={body} />}
      {grand ? (
        <BandedDoor b={body} u0={0.4} u1={0.6} h={0.5} s={s} />
      ) : (
        <IsoDoor points={leftQuad(body, 0.4, 0.6, 0, 0.48)} />
      )}
      <IsoWindow points={leftQuad(body, 0.12, 0.26, 0.42, 0.74)} lit={lit} />
      <IsoWindow points={leftQuad(body, 0.74, 0.88, 0.42, 0.74)} lit={lit} />
      <IsoWindow points={rightQuad(body, 0.42, 0.58, 0.42, 0.74)} lit={lit} />
      {grand && (
        <g>
          {[0.08, 0.92].map((u) => (
            <g key={u}>
              <polygon points={leftQuad(body, u - 0.05, u + 0.05, 0.45, 0.98)} fill={s.base} />
              <polygon points={leftQuad(body, u, u + 0.05, 0.45, 0.98)} fill={s.dark} />
              <polygon points={leftQuad(body, u - 0.05, u + 0.05, 0.93, 0.98)} fill={GOLD.base} />
            </g>
          ))}
          <Lantern at={P(body.x0 + (body.x1 - body.x0) * 0.33, body.y1 + 2, body.z0 + 40)} lit={lit} />
          <Lantern at={P(body.x0 + (body.x1 - body.x0) * 0.67, body.y1 + 2, body.z0 + 40)} lit={lit} />
        </g>
      )}
      <IsoDecorations kind={decoration} b={body} s={s} lit={lit} />
      <GableRoof x0={body.x0} y0={body.y0} x1={body.x1} y1={body.y1} z={body.z1} rise={grand ? 62 : 54} o={9} s={s} wall={wallS} />
      {grand && <GoldEaves x0={body.x0} y0={body.y0} x1={body.x1} y1={body.y1} z={body.z1} rise={62} o={9} />}
      <Crest at={P(body.x1, (body.y0 + body.y1) / 2, body.z1 + 24)} size={grand ? 22 : 17} s={s} gold={grand} />
      {towers.map((tw, i) => (
        <g key={i}>
          <IsoBox b={tw} s={grand ? darkStone(m) : m.stone} />
          {grand && [0.35, 0.7].map((v) => <polygon key={v} points={leftQuad(tw, 0, 1, v, v + 0.03)} fill={GOLD.base} opacity={0.9} />)}
          <IsoWindow points={leftQuad(tw, 0.3, 0.7, 0.62, 0.8)} lit={lit} />
          {grand ? (
            <>
              <IsoBox b={{ x0: tw.x0 - 5, y0: tw.y0 - 5, x1: tw.x1 + 5, y1: tw.y1 + 5, z0: towerH, z1: towerH + 8 }} s={darkStone(m)} courses={false} />
              <PyramidRoof x0={tw.x0 - 5} y0={tw.y0 - 5} x1={tw.x1 + 5} y1={tw.y1 + 5} z={towerH + 8} rise={50} o={4} s={s} />
              <circle cx={P((tw.x0 + tw.x1) / 2, (tw.y0 + tw.y1) / 2, towerH + 62)[0]} cy={P((tw.x0 + tw.x1) / 2, (tw.y0 + tw.y1) / 2, towerH + 62)[1]} r={3.5} fill={GOLD.base} />
            </>
          ) : (
            <PyramidRoof x0={tw.x0} y0={tw.y0} x1={tw.x1} y1={tw.y1} z={towerH} rise={40} o={5} s={s} />
          )}
        </g>
      ))}
      {grand ? (
        <g>
          {/* Central spire */}
          <IsoBox b={{ x0: ox + 86, y0: oy + 86, x1: ox + 114, y1: oy + 114, z0: body.z1 + 30, z1: body.z1 + 70 }} s={darkStone(m)} />
          <IsoWindow points={leftQuad({ x0: ox + 86, y0: oy + 86, x1: ox + 114, y1: oy + 114, z0: body.z1 + 30, z1: body.z1 + 70 }, 0.3, 0.7, 0.4, 0.75)} lit={lit} />
          <PyramidRoof x0={ox + 82} y0={oy + 82} x1={ox + 118} y1={oy + 118} z={body.z1 + 70} rise={48} o={3} s={s} />
          <Flag at={P(ox + 100, oy + 100, body.z1 + 118)} s={s} h={32} />
          <circle cx={P(ox + 100, oy + 100, body.z1 + 118)[0]} cy={P(ox + 100, oy + 100, body.z1 + 118)[1]} r={3.6} fill={GOLD.base} />
        </g>
      ) : (
        <Flag at={P(ox + 100, oy + 100, body.z1 + 54)} s={s} h={30} />
      )}
    </g>
  );
}

function Watchtower({ ox, oy, level, lit, s, m, decoration }: IsoProps) {
  if (level === 1) {
    // A wooden lookout on stilts with a thatch cone and a ladder.
    const legs: Array<[number, number]> = [
      [ox + 30, oy + 30],
      [ox + 70, oy + 30],
      [ox + 70, oy + 70],
      [ox + 30, oy + 70]
    ];
    const deck: Box = { x0: ox + 24, y0: oy + 24, x1: ox + 76, y1: oy + 76, z0: 66, z1: 72 };
    return (
      <g>
        <IsoShadow x0={ox + 26} y0={oy + 26} x1={ox + 74} y1={oy + 74} />
        {legs.map(([x, y], i) => (
          <IsoBox key={i} b={{ x0: x - 3, y0: y - 3, x1: x + 3, y1: y + 3, z0: 0, z1: 66 }} s={m.wood} courses={false} />
        ))}
        <line x1={P(ox + 30, oy + 70, 10)[0]} y1={P(ox + 30, oy + 70, 10)[1]} x2={P(ox + 70, oy + 70, 50)[0]} y2={P(ox + 70, oy + 70, 50)[1]} stroke={BEAM} strokeWidth={2} />
        <line x1={P(ox + 70, oy + 30, 10)[0]} y1={P(ox + 70, oy + 30, 10)[1]} x2={P(ox + 70, oy + 70, 50)[0]} y2={P(ox + 70, oy + 70, 50)[1]} stroke={BEAM} strokeWidth={2} />
        {/* Ladder */}
        {[ox + 44, ox + 56].map((x) => (
          <line key={x} x1={P(x, oy + 84, 0)[0]} y1={P(x, oy + 84, 0)[1]} x2={P(x, oy + 76, 68)[0]} y2={P(x, oy + 76, 68)[1]} stroke={m.wood.dark} strokeWidth={1.8} />
        ))}
        {[10, 22, 34, 46, 58].map((z) => {
          const t = z / 68;
          const ya = oy + 84 - 8 * t;
          return <line key={z} x1={P(ox + 44, ya, z)[0]} y1={P(ox + 44, ya, z)[1]} x2={P(ox + 56, ya, z)[0]} y2={P(ox + 56, ya, z)[1]} stroke={m.wood.base} strokeWidth={1.4} />;
        })}
        <IsoBox b={deck} s={m.wood} courses={false} />
        <IsoBox b={{ x0: deck.x0, y0: deck.y0, x1: deck.x1, y1: deck.y1, z0: 72, z1: 82 }} s={m.wood} courses={false} />
        <ThatchCone x0={deck.x0} y0={deck.y0} x1={deck.x1} y1={deck.y1} z={98} rise={34} o={6} tip={s} />
        {legs.slice(0, 2).map(([x, y], i) => (
          <IsoBox key={`p${i}`} b={{ x0: x - 2, y0: y - 2, x1: x + 2, y1: y + 2, z0: 82, z1: 96 }} s={m.wood} courses={false} />
        ))}
      </g>
    );
  }
  const grand = level >= 3;
  const plinth: Box = { x0: ox + 20, y0: oy + 20, x1: ox + 80, y1: oy + 80, z0: 0, z1: grand ? 12 : 8 };
  const body: Box = { x0: ox + 28, y0: oy + 28, x1: ox + 72, y1: oy + 72, z0: plinth.z1, z1: plinth.z1 + (grand ? 106 : 92) };
  const deck: Box = { x0: ox + 18, y0: oy + 18, x1: ox + 82, y1: oy + 82, z0: body.z1, z1: body.z1 + 14 };
  const stone = grand ? darkStone(m) : m.stone;
  return (
    <g>
      <IsoShadow x0={ox + 20} y0={oy + 20} x1={ox + 80} y1={oy + 80} />
      <Plinth b={plinth} s={stone} />
      <IsoBox b={body} s={stone} />
      {grand && [0.3, 0.62].map((v) => (
        <g key={v}>
          <polygon points={leftQuad(body, 0, 1, v, v + 0.03)} fill={GOLD.base} />
          <polygon points={rightQuad(body, 0, 1, v, v + 0.03)} fill={GOLD.dark} />
        </g>
      ))}
      <IsoWindow points={leftQuad(body, 0.32, 0.68, 0.48, 0.66)} lit={lit} />
      <IsoWindow points={rightQuad(body, 0.32, 0.68, 0.72, 0.86)} lit={lit} />
      {grand ? <BandedDoor b={body} u0={0.3} u1={0.7} h={0.24} s={s} /> : <IsoDoor points={leftQuad(body, 0.3, 0.7, 0, 0.24)} />}
      <IsoDecorations kind={decoration} b={body} s={s} lit={lit} />
      <IsoBox b={deck} s={stone} courses={false} />
      {/* Battlements */}
      {[0, 0.36, 0.72].map((u) => (
        <g key={u}>
          <IsoBox b={{ x0: deck.x0 + 64 * u, y0: deck.y1 - 7, x1: deck.x0 + 64 * u + 14, y1: deck.y1, z0: deck.z1, z1: deck.z1 + 10 }} s={stone} courses={false} />
          <IsoBox b={{ x0: deck.x1 - 7, y0: deck.y0 + 64 * u, x1: deck.x1, y1: deck.y0 + 64 * u + 14, z0: deck.z1, z1: deck.z1 + 10 }} s={stone} courses={false} />
        </g>
      ))}
      {grand ? (
        <g>
          <Brazier at={P(ox + 50, oy + 50, deck.z1 + 6)} lit={lit} />
          <Flag at={P(deck.x1 - 4, deck.y1 - 4, deck.z1 + 46)} s={s} h={34} />
        </g>
      ) : (
        <g>
          <PyramidRoof x0={deck.x0 + 6} y0={deck.y0 + 6} x1={deck.x1 - 6} y1={deck.y1 - 6} z={deck.z1 + 10} rise={34} o={3} s={s} />
          <Flag at={P(ox + 50, oy + 50, deck.z1 + 44)} s={s} h={24} />
        </g>
      )}
    </g>
  );
}

function Lodge({ ox, oy, level, lit, s, m, decoration }: IsoProps) {
  if (level === 1) {
    // A small thatched wooden cabin.
    const b: Box = { x0: ox + 16, y0: oy + 26, x1: ox + 84, y1: oy + 82, z0: 0, z1: 38 };
    return (
      <g>
        <IsoShadow x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} />
        <IsoBox b={b} s={m.wood} />
        <IsoDoor points={leftQuad(b, 0.42, 0.62, 0, 0.66)} />
        <polygon points={leftQuad(b, 0.42, 0.62, 0, 0.66)} fill={s.dark} opacity={0.55} />
        <IsoWindow points={leftQuad(b, 0.12, 0.3, 0.38, 0.7)} lit={lit} />
        <IsoDecorations kind={decoration} b={b} s={s} lit={lit} />
        <ThatchRoof x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} z={38} rise={34} o={8} ridge={s} wall={m.wood} />
        {/* Woodpile */}
        {[0, 1, 2].map((i) => {
          const [x, y] = P(ox + 86 + 4, oy + 42 + i * 9, 4);
          return <circle key={i} cx={x} cy={y} r={3.6} fill={m.wood.base} stroke={m.wood.dark} strokeWidth={1} />;
        })}
      </g>
    );
  }
  const grand = level >= 3;
  const plinth: Box = { x0: ox + 10, y0: oy + 20, x1: ox + 90, y1: oy + 88, z0: 0, z1: grand ? 10 : 8 };
  const ground: Box = { x0: ox + 16, y0: oy + 26, x1: ox + 84, y1: oy + 82, z0: plinth.z1, z1: plinth.z1 + (grand ? 30 : 40) };
  const upper: Box | null = grand ? { x0: ox + 12, y0: oy + 22, x1: ox + 88, y1: oy + 86, z0: ground.z1, z1: ground.z1 + 30 } : null;
  const top = upper ?? ground;
  return (
    <g>
      <IsoShadow x0={plinth.x0} y0={plinth.y0} x1={plinth.x1} y1={plinth.y1} />
      <Plinth b={plinth} s={grand ? darkStone(m) : m.stone} />
      <IsoBox b={ground} s={grand ? m.stone : m.wood} />
      {!grand && <TimberFrame b={ground} />}
      {grand ? <BandedDoor b={ground} u0={0.4} u1={0.62} h={0.8} s={s} /> : <IsoDoor points={leftQuad(ground, 0.42, 0.62, 0, 0.62)} />}
      <IsoWindow points={leftQuad(ground, 0.12, 0.3, 0.4, 0.72)} lit={lit} />
      <IsoWindow points={leftQuad(ground, 0.74, 0.9, 0.4, 0.72)} lit={lit} />
      <IsoWindow points={rightQuad(ground, 0.35, 0.65, 0.4, 0.72)} lit={lit} />
      {upper && (
        <g>
          <IsoBox b={upper} s={m.wood} />
          <TimberFrame b={upper} />
          <IsoWindow points={leftQuad(upper, 0.2, 0.36, 0.25, 0.7)} lit={lit} />
          <IsoWindow points={leftQuad(upper, 0.64, 0.8, 0.25, 0.7)} lit={lit} />
          <IsoWindow points={rightQuad(upper, 0.38, 0.62, 0.25, 0.7)} lit={lit} />
          <Lantern at={P(ground.x0 + 22, ground.y1 + 1, ground.z0 + 26)} lit={lit} />
          <Lantern at={P(ground.x0 + 48, ground.y1 + 1, ground.z0 + 26)} lit={lit} />
        </g>
      )}
      <IsoDecorations kind={decoration} b={top} s={s} lit={lit} />
      <GableRoof x0={top.x0} y0={top.y0} x1={top.x1} y1={top.y1} z={top.z1} rise={grand ? 40 : 34} o={6} s={s} wall={grand ? m.wood : m.wood} />
      {grand && <GoldEaves x0={top.x0} y0={top.y0} x1={top.x1} y1={top.y1} z={top.z1} rise={40} o={6} />}
      <Crest at={P(top.x1, (top.y0 + top.y1) / 2, top.z1 + 15)} size={grand ? 13 : 11} s={s} gold={grand} />
      {/* Chimney */}
      <IsoBox b={{ x0: ox + 60, y0: oy + 32, x1: ox + 72, y1: oy + 44, z0: top.z1 + 8, z1: top.z1 + (grand ? 44 : 36) }} s={grand ? darkStone(m) : m.stone} courses={false} />
      {lit && (
        <g opacity={0.5} className="base-smoke">
          <circle cx={P(ox + 66, oy + 38, top.z1 + 54)[0]} cy={P(ox + 66, oy + 38, top.z1 + 54)[1]} r={4} fill="#c9ced6" />
          <circle cx={P(ox + 66, oy + 38, top.z1 + 66)[0] + 5} cy={P(ox + 66, oy + 38, top.z1 + 66)[1]} r={3} fill="#c9ced6" />
        </g>
      )}
      {grand && <Flag at={P(top.x0 + 4, (top.y0 + top.y1) / 2, top.z1 + 40)} s={s} h={22} />}
    </g>
  );
}

function Forge({ ox, oy, level, lit, s, m, decoration }: IsoProps) {
  if (level === 1) {
    // An open thatched shed over an anvil and a small fire.
    const posts: Array<[number, number]> = [
      [ox + 18, oy + 24],
      [ox + 82, oy + 24],
      [ox + 82, oy + 82],
      [ox + 18, oy + 82]
    ];
    const [hx, hy] = P(ox + 34, oy + 50, 0);
    return (
      <g>
        <IsoShadow x0={ox + 16} y0={oy + 22} x1={ox + 84} y1={oy + 84} />
        <IsoBox b={{ x0: ox + 24, y0: oy + 40, x1: ox + 46, y1: oy + 62, z0: 0, z1: 12 }} s={m.stone} courses={false} />
        <g className={lit ? 'base-flame' : undefined}>
          <path d={`M${hx + 2} ${hy - 24} C ${hx + 10} ${hy - 16}, ${hx + 8} ${hy - 9}, ${hx + 2} ${hy - 8} C ${hx - 4} ${hy - 9}, ${hx - 6} ${hy - 16}, ${hx + 2} ${hy - 24} Z`} fill={lit ? FIRE : '#6a3a20'} />
        </g>
        <IsoBox b={{ x0: ox + 56, y0: oy + 52, x1: ox + 70, y1: oy + 62, z0: 0, z1: 10 }} s={darkStone(m)} courses={false} />
        <IsoBox b={{ x0: ox + 52, y0: oy + 52, x1: ox + 74, y1: oy + 62, z0: 10, z1: 15 }} s={METAL} courses={false} />
        {posts.map(([x, y], i) => (
          <IsoBox key={i} b={{ x0: x - 3, y0: y - 3, x1: x + 3, y1: y + 3, z0: 0, z1: 42 }} s={m.wood} courses={false} />
        ))}
        <ThatchRoof x0={ox + 18} y0={oy + 24} x1={ox + 82} y1={oy + 82} z={42} rise={28} o={7} ridge={s} wall={m.wood} />
      </g>
    );
  }
  const grand = level >= 3;
  const stone = grand ? darkStone(m) : m.stone;
  const plinth: Box = { x0: ox + 8, y0: oy + 14, x1: ox + 92, y1: oy + 90, z0: 0, z1: 8 };
  const b: Box = { x0: ox + 14, y0: oy + 20, x1: ox + 86, y1: oy + 84, z0: 8, z1: grand ? 54 : 48 };
  return (
    <g>
      <IsoShadow x0={plinth.x0} y0={plinth.y0} x1={plinth.x1} y1={plinth.y1} />
      <Plinth b={plinth} s={stone} />
      <IsoBox b={b} s={stone} />
      {grand && [0.25, 0.75].map((u) => (
        <g key={u}>
          <polygon points={leftQuad(b, u - 0.02, u + 0.02, 0, 1)} fill="#2a2a30" />
          <polygon points={rightQuad(b, u - 0.03, u + 0.03, 0, 1)} fill="#1e1e24" />
        </g>
      ))}
      {/* Furnace mouth */}
      <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
        <polygon points={leftQuad(b, 0.34, 0.66, 0, grand ? 0.66 : 0.58)} fill="#2a1a12" />
        <polygon points={leftQuad(b, 0.38, 0.62, 0, grand ? 0.56 : 0.48)} fill={lit ? FIRE : '#5a3020'} className={lit ? 'base-flame' : undefined} />
        <polygon points={leftQuad(b, 0.43, 0.57, 0, grand ? 0.34 : 0.28)} fill={lit ? WINDOW_LIT : '#7a4a28'} />
      </g>
      <IsoWindow points={rightQuad(b, 0.35, 0.65, 0.45, 0.72)} lit={lit} />
      <IsoDecorations kind={decoration} b={b} s={s} lit={lit} />
      <GableRoof x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} z={b.z1} rise={26} o={5} s={s} wall={stone} />
      {grand && <GoldEaves x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} z={b.z1} rise={26} o={5} />}
      {(grand ? [ox + 24, ox + 64] : [ox + 62]).map((x) => (
        <g key={x}>
          <IsoBox b={{ x0: x, y0: oy + 28, x1: x + 14, y1: oy + 42, z0: b.z1 + 4, z1: b.z1 + (grand ? 66 : 54) }} s={stone} />
          {grand && <polygon points={leftQuad({ x0: x, y0: oy + 28, x1: x + 14, y1: oy + 42, z0: b.z1 + 4, z1: b.z1 + 66 }, 0, 1, 0.9, 0.97)} fill={GOLD.base} />}
          {lit && (
            <g opacity={0.55} className="base-smoke">
              <circle cx={P(x + 7, oy + 35, b.z1 + (grand ? 80 : 68))[0]} cy={P(x + 7, oy + 35, b.z1 + (grand ? 80 : 68))[1]} r={5} fill="#c9ced6" />
              <circle cx={P(x + 7, oy + 35, b.z1 + (grand ? 96 : 84))[0] + 6} cy={P(x + 7, oy + 35, b.z1 + (grand ? 96 : 84))[1]} r={3.5} fill="#c9ced6" />
            </g>
          )}
        </g>
      ))}
      {/* Anvil out front */}
      <IsoBox b={{ x0: ox + 60, y0: oy + 92, x1: ox + 72, y1: oy + 98, z0: 0, z1: 8 }} s={darkStone(m)} courses={false} />
      <IsoBox b={{ x0: ox + 56, y0: oy + 91, x1: ox + 78, y1: oy + 99, z0: 8, z1: 13 }} s={METAL} courses={false} />
    </g>
  );
}

function Crystal({ at, h, s }: { at: [number, number]; h: number; s: Shades }) {
  const [x, y] = at;
  const w = h * 0.38;
  return (
    <g>
      <polygon points={`${x},${y} ${x - w / 2},${y - h * 0.62} ${x},${y - h}`} fill={s.light} />
      <polygon points={`${x},${y} ${x + w / 2},${y - h * 0.62} ${x},${y - h}`} fill={s.base} />
      <polygon points={`${x},${y} ${x + w / 2},${y - h * 0.62} ${x + w * 0.18},${y - h * 0.48}`} fill={s.dark} />
    </g>
  );
}

function Spring({ ox, oy, level, lit, s, m }: IsoProps) {
  const cx = ox + 50;
  const cy = oy + 50;
  if (level === 1) {
    // A pond ringed by rough rocks, with one crystal.
    const [wx, wy] = P(cx, cy, 2);
    const rocks = Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return P(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38, 0);
    });
    return (
      <g>
        <ellipse cx={wx} cy={wy} rx={30} ry={15} fill={s.dark} />
        <ellipse cx={wx} cy={wy + 1} rx={26} ry={12} fill={s.base} className={lit ? 'base-light is-lit' : undefined} />
        <ellipse cx={wx - 6} cy={wy - 2} rx={8} ry={2.5} fill={s.light} opacity={0.7} />
        {rocks.map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y - 3} rx={7} ry={4.5} fill={m.stone.base} />
            <ellipse cx={x - 2} cy={y - 5} rx={3.5} ry={1.8} fill={m.stone.light} opacity={0.8} />
          </g>
        ))}
        <Crystal at={P(cx, cy, 4)} h={28} s={s} />
      </g>
    );
  }
  const grand = level >= 3;
  const [wx, wy] = P(cx, cy, 14);
  return (
    <g>
      <IsoShadow x0={ox + 14} y0={oy + 14} x1={ox + 86} y1={oy + 86} />
      <IsoCylinder cx={cx} cy={cy} r={44} z0={0} z1={14} s={grand ? darkStone(m) : m.stone} />
      {grand && <ellipse cx={wx} cy={wy} rx={44 * 0.707} ry={44 * 0.354} fill="none" stroke={GOLD.base} strokeWidth={2.6} />}
      <ellipse cx={wx} cy={wy} rx={44 * 0.707 - 5} ry={44 * 0.354 - 3} fill={s.dark} />
      <ellipse cx={wx} cy={wy + 1} rx={44 * 0.707 - 8} ry={44 * 0.354 - 5} fill={s.base} className={lit ? 'base-light is-lit' : undefined} />
      <ellipse cx={wx - 6} cy={wy - 1} rx={8} ry={2.5} fill={s.light} opacity={0.75} />
      <Crystal at={P(cx, cy, 16)} h={grand ? 52 : 44} s={s} />
      <Crystal at={P(cx - 18, cy + 8, 16)} h={26} s={s} />
      <Crystal at={P(cx + 10, cy - 16, 16)} h={22} s={s} />
      {grand && (
        <g>
          {[
            [ox + 14, oy + 14],
            [ox + 86, oy + 14],
            [ox + 86, oy + 86],
            [ox + 14, oy + 86]
          ].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <IsoBox b={{ x0: x - 5, y0: y - 5, x1: x + 5, y1: y + 5, z0: 0, z1: 98 }} s={darkStone(m)} courses={false} />
              <IsoBox b={{ x0: x - 7, y0: y - 7, x1: x + 7, y1: y + 7, z0: 92, z1: 98 }} s={GOLD} courses={false} />
            </g>
          ))}
          <IsoBox b={{ x0: ox + 4, y0: oy + 4, x1: ox + 96, y1: oy + 96, z0: 98, z1: 104 }} s={darkStone(m)} courses={false} />
          <PyramidRoof x0={ox + 4} y0={oy + 4} x1={ox + 96} y1={oy + 96} z={104} rise={30} o={3} s={s} />
          <circle cx={P(cx, cy, 136)[0]} cy={P(cx, cy, 136)[1]} r={4} fill={GOLD.base} />
        </g>
      )}
    </g>
  );
}

const STATION_COLOR: Record<string, string> = { push: '#b3bdca', pull: '#bf8148', legs: '#ff5fd2', core: '#37d8ff', recovery: '#3bb36a' };

function TrainingYard({ ox, oy, level, lit, s, m, plan }: IsoProps) {
  const pad: Box = { x0: ox + 8, y0: oy + 8, x1: ox + 192, y1: oy + 192, z0: 0, z1: 6 };
  const turf: Shades = level >= 3 ? { light: '#5cc47a', base: '#2f8a50', dark: '#1f6a3a' } : GRASS;
  const stations = (plan?.exercises ?? []).slice(0, 6);
  const spots: Array<[number, number]> = [
    [ox + 50, oy + 50],
    [ox + 100, oy + 50],
    [ox + 150, oy + 50],
    [ox + 50, oy + 130],
    [ox + 100, oy + 130],
    [ox + 150, oy + 130]
  ];
  const postZ = level >= 2 ? 26 : 16;
  const posts: Array<[number, number]> = [];
  for (let i = 0; i <= 4; i++) {
    posts.push([ox + 8 + i * 46, oy + 192]);
    posts.push([ox + 192, oy + 8 + i * 46]);
  }
  return (
    <g>
      <IsoBox b={pad} s={turf} courses={false} />
      {level >= 3 && (
        <polygon
          points={pts([P(ox + 24, oy + 24, 6), P(ox + 176, oy + 24, 6), P(ox + 176, oy + 176, 6), P(ox + 24, oy + 176, 6)])}
          fill="none"
          stroke="#e8ffe9"
          strokeOpacity={0.6}
          strokeWidth={1.4}
        />
      )}
      {(stations.length ? stations : []).map((st, i) => {
        const [x, y] = spots[i];
        const c = STATION_COLOR[st.pattern] ?? WINDOW_LIT;
        const done = st.done >= st.target;
        return (
          <g key={st.id} opacity={done ? 1 : 0.75}>
            {done && <ellipse cx={P(x, y, 6)[0]} cy={P(x, y, 6)[1]} rx={18} ry={9} fill={WINDOW_LIT} opacity={0.35} />}
            {st.pattern === 'pull' || st.pattern === 'push' ? (
              <g>
                <IsoBox b={{ x0: x - 14, y0: y - 2, x1: x - 10, y1: y + 2, z0: 6, z1: st.pattern === 'pull' ? 46 : 26 }} s={METAL} courses={false} />
                <IsoBox b={{ x0: x + 10, y0: y - 2, x1: x + 14, y1: y + 2, z0: 6, z1: st.pattern === 'pull' ? 46 : 26 }} s={METAL} courses={false} />
                <IsoBox b={{ x0: x - 16, y0: y - 2, x1: x + 16, y1: y + 2, z0: st.pattern === 'pull' ? 44 : 24, z1: st.pattern === 'pull' ? 48 : 28 }} s={METAL} courses={false} />
              </g>
            ) : st.pattern === 'legs' ? (
              <IsoBox b={{ x0: x - 12, y0: y - 10, x1: x + 12, y1: y + 10, z0: 6, z1: 26 }} s={m.wood} courses={false} />
            ) : (
              <polygon points={pts([P(x - 16, y - 10, 7), P(x + 16, y - 10, 7), P(x + 16, y + 10, 7), P(x - 16, y + 10, 7)])} fill={c} opacity={0.9} />
            )}
          </g>
        );
      })}
      {posts.map(([x, y], i) => (
        <IsoBox key={i} b={{ x0: x - 3, y0: y - 3, x1: x + 3, y1: y + 3, z0: 6, z1: 6 + postZ }} s={s} courses={false} />
      ))}
      <polyline points={pts([P(ox + 8, oy + 192, 6 + postZ - 4), P(ox + 192, oy + 192, 6 + postZ - 4), P(ox + 192, oy + 8, 6 + postZ - 4)])} fill="none" stroke={level >= 2 ? METAL.light : m.wood.base} strokeWidth={2.2} />
      {level >= 2 &&
        [P(ox + 8, oy + 192, 70), P(ox + 192, oy + 8, 70)].map(([x, y], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={y + 40} stroke={METAL.dark} strokeWidth={2.5} />
            <Beacon at={[x, y]} s={s} lit={lit} r={4} />
          </g>
        ))}
      {level >= 3 && (
        <g>
          <Flag at={P(ox + 8, oy + 192, 64)} s={s} h={30} />
          <Flag at={P(ox + 192, oy + 8, 64)} s={s} h={30} />
          {posts.map(([x, y], i) => (
            <IsoBox key={`cap${i}`} b={{ x0: x - 4, y0: y - 4, x1: x + 4, y1: y + 4, z0: 6 + postZ, z1: 10 + postZ }} s={GOLD} courses={false} />
          ))}
          <IsoBox b={{ x0: ox + 70, y0: oy + 0, x1: ox + 130, y1: oy + 8, z0: 30, z1: 60 }} s={METAL} courses={false} />
          <polygon points={leftQuad({ x0: ox + 70, y0: oy + 0, x1: ox + 130, y1: oy + 8, z0: 30, z1: 60 }, 0.08, 0.92, 0.2, 0.8)} fill={lit ? s.light : s.dark} className={lit ? 'base-light is-lit' : undefined} />
        </g>
      )}
    </g>
  );
}

/** Ground-hugging walls that join up with their neighbours. */
function IsoWall({ ox, oy, style }: { ox: number; oy: number; style?: string }) {
  if (style === 'hedge') {
    const hedge: Shades = { light: '#7ee2a0', base: '#3bb36a', dark: '#22784a' };
    return <IsoBox b={{ x0: ox + 6, y0: oy + 22, x1: ox + 94, y1: oy + 78, z0: 0, z1: 26 }} s={hedge} courses={false} />;
  }
  if (style === 'fence') {
    const wood: Shades = { light: '#e8b47a', base: '#bf8148', dark: '#87552a' };
    return (
      <g>
        {[10, 50, 90].map((x) => (
          <IsoBox key={x} b={{ x0: ox + x - 4, y0: oy + 46, x1: ox + x + 4, y1: oy + 54, z0: 0, z1: 30 }} s={wood} courses={false} />
        ))}
        {[12, 24].map((z) => (
          <IsoBox key={z} b={{ x0: ox + 2, y0: oy + 48, x1: ox + 98, y1: oy + 52, z0: z, z1: z + 4 }} s={wood} courses={false} />
        ))}
      </g>
    );
  }
  const stone: Shades = { light: '#e3e8ee', base: '#b3bdca', dark: '#7d8899' };
  return (
    <g>
      <IsoBox b={{ x0: ox + 2, y0: oy + 30, x1: ox + 98, y1: oy + 70, z0: 0, z1: 26 }} s={stone} />
      {[2, 36, 70].map((x) => (
        <IsoBox key={x} b={{ x0: ox + x, y0: oy + 30, x1: ox + x + 26, y1: oy + 70, z0: 26, z1: 34 }} s={stone} courses={false} />
      ))}
    </g>
  );
}

const BED_METAL: Shades = { light: '#6b717c', base: '#454a53', dark: '#2c3037' };

/**
 * A raised garden bed: corrugated metal walls standing on the tile, soil set
 * just below the rim, and flowers planted in rows (drawn back to front).
 */
function IsoGarden({ ox, oy, style, color }: { ox: number; oy: number; style?: string; color?: string }) {
  const b: Box = { x0: ox + 8, y0: oy + 20, x1: ox + 92, y1: oy + 80, z0: 0, z1: 24 };
  const ribs = Array.from({ length: 9 }, (_, i) => (i + 0.5) / 9);
  const sideRibs = Array.from({ length: 6 }, (_, i) => (i + 0.5) / 6);
  const soilZ = b.z1 - 4;
  const soil = pts([P(b.x0 + 4, b.y0 + 4, soilZ), P(b.x1 - 4, b.y0 + 4, soilZ), P(b.x1 - 4, b.y1 - 4, soilZ), P(b.x0 + 4, b.y1 - 4, soilZ)]);
  const accent = color ? themeFor('garden', color) : null;
  const palettes: Record<string, string[]> = {
    roses: ['#e5484d', '#ff7a7a', '#c22f3a'],
    lavender: ['#8f6ff0', '#b9a3ff', '#6c4fd6'],
    tulips: accent ? [accent.base, accent.light, accent.dark] : ['#f7c948', '#ffdf70', '#f2a541'],
    wildflowers: ['#ff5fd2', '#f7c948', '#37d8ff', '#ffffff', '#ff8a3d']
  };
  const petals = palettes[style ?? 'wildflowers'] ?? palettes.wildflowers;
  // Planting grid inside the bed, back row first so nearer flowers overlap.
  const plants: Array<[number, number, number]> = [];
  let k = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const x = b.x0 + 14 + col * 15 + (row % 2) * 6;
      const y = b.y0 + 12 + row * 17;
      plants.push([x, y, k++]);
    }
  }
  plants.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  return (
    <g>
      <IsoShadow x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} />
      {/* Metal walls with vertical ribs */}
      <IsoBox b={b} s={BED_METAL} courses={false} />
      <g stroke="#1c1f24" strokeOpacity={0.55} strokeWidth={1.1}>
        {ribs.map((u) => {
          const x = b.x0 + (b.x1 - b.x0) * u;
          return <line key={`l${u}`} x1={P(x, b.y1, 1)[0]} y1={P(x, b.y1, 1)[1]} x2={P(x, b.y1, b.z1 - 1)[0]} y2={P(x, b.y1, b.z1 - 1)[1]} />;
        })}
        {sideRibs.map((u) => {
          const y = b.y0 + (b.y1 - b.y0) * u;
          return <line key={`r${u}`} x1={P(b.x1, y, 1)[0]} y1={P(b.x1, y, 1)[1]} x2={P(b.x1, y, b.z1 - 1)[0]} y2={P(b.x1, y, b.z1 - 1)[1]} />;
        })}
      </g>
      <g stroke="#8a919c" strokeOpacity={0.35} strokeWidth={0.8}>
        {ribs.map((u) => {
          const x = b.x0 + (b.x1 - b.x0) * u + 3;
          return <line key={`h${u}`} x1={P(x, b.y1, 2)[0]} y1={P(x, b.y1, 2)[1]} x2={P(x, b.y1, b.z1 - 2)[0]} y2={P(x, b.y1, b.z1 - 2)[1]} />;
        })}
      </g>
      {/* Soil, just below the rim */}
      <polygon points={soil} fill="#3d2a1c" />
      <polygon points={soil} fill="url(#hf-side)" opacity={0.6} />
      {/* Flowers */}
      {plants.map(([x, y, i]) => {
        const [px, py] = P(x, y, soilZ);
        const tall = style === 'tulips' ? 16 : style === 'lavender' ? 18 : 12;
        const c = petals[i % petals.length];
        return (
          <g key={i}>
            <ellipse cx={px} cy={py - 2} rx={6.5} ry={3.4} fill="#2f7a3a" />
            <ellipse cx={px - 2} cy={py - 3.5} rx={3.5} ry={2} fill="#4fae5a" />
            <line x1={px} y1={py - 2} x2={px} y2={py - tall} stroke="#2f7a3a" strokeWidth={1.4} />
            {style === 'lavender' ? (
              <g>
                {[0, 1, 2, 3].map((j) => (
                  <circle key={j} cx={px} cy={py - tall + j * 3} r={1.9 - j * 0.2} fill={petals[(i + j) % petals.length]} />
                ))}
              </g>
            ) : style === 'tulips' ? (
              <g>
                <path d={`M${px - 3.4} ${py - tall + 1} Q${px - 3.6} ${py - tall - 7} ${px} ${py - tall - 4.5} Q${px + 3.6} ${py - tall - 7} ${px + 3.4} ${py - tall + 1} Z`} fill={c} />
                <path d={`M${px} ${py - tall - 4.5} Q${px + 3.6} ${py - tall - 7} ${px + 3.4} ${py - tall + 1} L${px} ${py - tall + 1} Z`} fill="#000" opacity={0.15} />
              </g>
            ) : (
              <g>
                {[0, 72, 144, 216, 288].map((deg) => {
                  const r = (deg * Math.PI) / 180;
                  return <ellipse key={deg} cx={px + Math.cos(r) * 2.6} cy={py - tall + Math.sin(r) * 1.6} rx={2.3} ry={1.7} fill={c} />;
                })}
                <circle cx={px} cy={py - tall} r={1.4} fill={style === 'roses' ? '#8a1f28' : '#fff4b0'} />
              </g>
            )}
          </g>
        );
      })}
      {/* Rim catches the light */}
      <polyline points={pts([P(b.x0, b.y1, b.z1), P(b.x1, b.y1, b.z1), P(b.x1, b.y0, b.z1)])} fill="none" stroke="#9aa1ab" strokeWidth={1.6} />
    </g>
  );
}

/** Which items are drawn as true isometric models. */
export const ISO_ITEMS = new Set(['hq', 'watchtower', 'lodge', 'forge', 'spring', 'yard', 'wall', 'garden']);
/** True for anything drawn as an isometric model (buildings, walls, gardens, trophies). */
export function isIsoItem(itemId: string): boolean {
  return ISO_ITEMS.has(itemId) || itemId.startsWith('trophy:');
}

/**
 * Draw an isometric model for a placed item at (ox, oy) = its footprint's
 * top corner in world units.
 */
export function IsoItemArt({
  item,
  ox,
  oy,
  lit,
  plan,
  verified
}: {
  item: PlacedItem;
  ox: number;
  oy: number;
  lit: boolean;
  plan?: TodayPlan | null;
  verified?: boolean;
}): ReactNode {
  if (item.itemId.startsWith('trophy:')) {
    return <IsoTrophy trophyId={item.itemId.slice('trophy:'.length)} ox={ox} oy={oy} lit={lit} verified={verified} color={item.color} />;
  }
  const s = themeFor(item.itemId, item.color);
  const props: IsoProps = {
    ox,
    oy,
    size: item.itemId === 'hq' || item.itemId === 'yard' ? 2 : 1,
    level: Math.max(item.level, 1),
    lit,
    s,
    m: materialsFor(item.color, s),
    decoration: item.style,
    plan
  };
  switch (item.itemId) {
    case 'hq':
      return <Headquarters {...props} />;
    case 'watchtower':
      return <Watchtower {...props} />;
    case 'lodge':
      return <Lodge {...props} />;
    case 'forge':
      return <Forge {...props} />;
    case 'spring':
      return <Spring {...props} />;
    case 'yard':
      return <TrainingYard {...props} />;
    case 'wall':
      return <IsoWall ox={ox} oy={oy} style={item.style} />;
    case 'garden':
      return <IsoGarden ox={ox} oy={oy} style={item.style} color={item.color} />;
    default:
      return null;
  }
}

/** Scaffolding over a footprint while something is being built. */
export function IsoScaffold({
  ox,
  oy,
  size,
  setsRemaining,
  height
}: {
  ox: number;
  oy: number;
  size: number;
  setsRemaining: number;
  /** Scaffold height; smaller things get a lower one. */
  height?: number;
}) {
  const w = size * 100;
  const h = height ?? (size === 2 ? 90 : 60);
  const b: Box = { x0: ox + 14, y0: oy + 14, x1: ox + w - 14, y1: oy + w - 14, z0: 0, z1: h };
  const corners: Array<[number, number]> = [
    [b.x0, b.y1],
    [b.x1, b.y1],
    [b.x1, b.y0]
  ];
  const [bx, by] = P(b.x1, b.y0, h);
  return (
    <g className="base-scaffold">
      {/* The tile being built on, outlined on the ground. */}
      <polygon
        points={pts([P(ox + 6, oy + 6), P(ox + w - 6, oy + 6), P(ox + w - 6, oy + w - 6), P(ox + 6, oy + w - 6)])}
        className="base-scaffold-ground"
      />
      <polygon points={leftQuad(b, 0, 1, 0, 1)} fill="rgba(242,165,65,0.14)" />
      <polygon points={rightQuad(b, 0, 1, 0, 1)} fill="rgba(242,165,65,0.08)" />
      <polygon points={leftQuad(b, 0, 1, 0, 1)} fill="url(#base-scaffold-hatch)" className="base-scaffold-fill" />
      <polygon points={rightQuad(b, 0, 1, 0, 1)} fill="url(#base-scaffold-hatch)" className="base-scaffold-fill" />
      {corners.map(([x, y]) => (
        <line key={`${x}${y}`} x1={P(x, y, 0)[0]} y1={P(x, y, 0)[1]} x2={P(x, y, h)[0]} y2={P(x, y, h)[1]} className="base-scaffold-frame" />
      ))}
      <polyline points={pts([P(b.x0, b.y1, h), P(b.x1, b.y1, h), P(b.x1, b.y0, h)])} className="base-scaffold-frame" fill="none" />
      <polyline points={pts([P(b.x0, b.y1, h / 2), P(b.x1, b.y1, h / 2), P(b.x1, b.y0, h / 2)])} className="base-scaffold-frame" fill="none" />
      <circle cx={bx} cy={by - 4} r={14} className="base-scaffold-badge" />
      <text x={bx} y={by + 2} textAnchor="middle" className="base-scaffold-count">
        {setsRemaining}
      </text>
    </g>
  );
}
