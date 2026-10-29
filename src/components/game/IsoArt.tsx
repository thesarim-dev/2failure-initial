import { IsoTrophy } from './IsoTrophy';
import type { ReactNode } from 'react';
import type { PlacedItem, TodayPlan } from '../../game/engine';
import {
  FIRE,
  GRASS,
  LEAF,
  METAL,
  STONE,
  WOOD,
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
/**
 * A block with real materials: stone walls get cut-stone courses, wooden ones
 * planks, both mapped into the wall's plane so they follow the perspective.
 * Small parts (courses = false) stay smooth. A soft shade sits where walls
 * meet the ground.
 */
function IsoBox({
  b,
  s,
  courses = true,
  mat = 'stone',
  hideRight = false,
  hideLeft = false
}: {
  b: Box;
  s: Shades;
  courses?: boolean;
  mat?: 'stone' | 'plank';
  /** Skip a face that a neighbouring piece continues (seamless runs). */
  hideRight?: boolean;
  hideLeft?: boolean;
}) {
  const { x0, y0, x1, y1, z0, z1 } = b;
  const left = pts([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]);
  const right = pts([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)]);
  const top = pts([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]);
  const textured = courses && z1 - z0 > 14;
  const aoH = Math.min(10, (z1 - z0) * 0.35);
  return (
    <g>
      {!hideLeft && (
        <g>
          <polygon points={left} fill={s.base} />
          {textured && <polygon points={left} fill={`url(#mat-${mat}-L)`} />}
          <polygon points={left} fill="url(#hf-face)" />
        </g>
      )}
      {!hideRight && (
        <g>
          <polygon points={right} fill={s.dark} />
          {textured && <polygon points={right} fill={`url(#mat-${mat}-R)`} />}
          <polygon points={right} fill="url(#hf-side)" />
        </g>
      )}
      {z0 <= 1 && z1 - z0 > 8 && (
        <g>
          {!hideLeft && <polygon points={pts([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z0 + aoH), P(x0, y1, z0 + aoH)])} fill="url(#mat-ao)" />}
          {!hideRight && <polygon points={pts([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z0 + aoH), P(x1, y0, z0 + aoH)])} fill="url(#mat-ao)" />}
        </g>
      )}
      <polygon points={top} fill={s.light} />
      <polygon points={top} fill="url(#hf-top)" />
      {/* Lit top edges and the shaded corner. */}
      <polyline
        points={pts(
          hideRight ? [P(x0, y1, z1), P(x1, y1, z1)] : hideLeft ? [P(x1, y1, z1), P(x1, y0, z1)] : [P(x0, y1, z1), P(x1, y1, z1), P(x1, y0, z1)]
        )}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.45}
        strokeWidth={1}
      />
      {!hideLeft && !hideRight && (
        <line x1={P(x1, y1, z0)[0]} y1={P(x1, y1, z0)[1]} x2={P(x1, y1, z1)[0]} y2={P(x1, y1, z1)[1]} stroke="#000" strokeOpacity={0.2} strokeWidth={0.9} />
      )}
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
  // Lived in: windows are always warm; brighter on training days. About a
  // third flicker gently like candlelight (picked from the window's position).
  const corners = points.split(' ').map((p) => p.split(',').map(Number) as [number, number]);
  const mid = (i: number, j: number): [number, number] => [(corners[i][0] + corners[j][0]) / 2, (corners[i][1] + corners[j][1]) / 2];
  const seed = Math.abs(Math.round((corners[0][0] * 7 + corners[0][1] * 13) % 3));
  const [a1, a2] = [mid(0, 1), mid(3, 2)];
  const [b1, b2] = [mid(0, 3), mid(1, 2)];
  return (
    <g className={`base-light is-warm ${lit ? 'is-lit' : ''} ${seed === 0 ? 'is-candle' : ''}`}>
      <polygon points={points} fill="#3a2a1c" stroke="#3a2a1c" strokeWidth={2.2} strokeLinejoin="round" />
      <polygon points={points} fill={WINDOW_LIT} />
      <polygon points={points} fill="url(#hf-face)" />
      <path d={`M${a1[0]} ${a1[1]} L${a2[0]} ${a2[1]} M${b1[0]} ${b1[1]} L${b2[0]} ${b2[1]}`} stroke="#3a2a1c" strokeWidth={1.1} opacity={0.75} />
    </g>
  );
}

/** Two puffs of smoke drifting up, offset in time so the chimney never stops. */
function ChimneySmoke({ at, strong }: { at: [number, number]; strong: boolean }) {
  const [x, y] = at;
  return (
    <g pointerEvents="none" opacity={strong ? 0.7 : 0.5}>
      <circle cx={x} cy={y} r={4.2} fill="#d5d9e0" className="base-smoke" />
      <circle cx={x + 3} cy={y - 5} r={3.2} fill="#d5d9e0" className="base-smoke" style={{ animationDelay: '1.6s' }} />
    </g>
  );
}

/** A few sparks rising from a furnace. */
function Sparks({ at }: { at: [number, number] }) {
  const [x, y] = at;
  return (
    <g pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x - 4 + i * 4} cy={y} r={1.2} fill="#ffcf5a" className="base-spark" style={{ animationDelay: `${i * 0.45}s` }} />
      ))}
    </g>
  );
}

/** Firewood stacked against a wall, with a chopping block and axe. */
function Firewood({ at, wood }: { at: [number, number]; wood: Shades }) {
  const [x, y] = at;
  return (
    <g pointerEvents="none">
      {[[0, 0], [5.6, 0], [11.2, 0], [2.8, -5], [8.4, -5], [5.6, -10]].map(([dx, dy], i) => (
        <g key={i}>
          <circle cx={x + dx} cy={y + dy} r={3} fill={wood.base} stroke={wood.dark} strokeWidth={0.9} />
          <circle cx={x + dx} cy={y + dy} r={1.2} fill={wood.light} />
        </g>
      ))}
      <ellipse cx={x + 20} cy={y + 1} rx={4.6} ry={2.2} fill={wood.dark} />
      <rect x={x + 15.4} y={y - 4} width={9.2} height={5} fill={wood.base} stroke={wood.dark} strokeWidth={0.8} />
      <ellipse cx={x + 20} cy={y - 4} rx={4.6} ry={2.2} fill={wood.light} stroke={wood.dark} strokeWidth={0.8} />
      <line x1={x + 19} y1={y - 5} x2={x + 25} y2={y - 13} stroke="#6b4a2a" strokeWidth={1.4} strokeLinecap="round" />
      <path d={`M${x + 23.5} ${y - 14.5} l4 1 l-2.2 3.4 Z`} fill="#c9ced6" stroke="#6b7280" strokeWidth={0.6} />
    </g>
  );
}

/** A flower box under a window. */
function FlowerBox({ a, b }: { a: [number, number]; b: [number, number] }) {
  const dx = (b[0] - a[0]) / 4;
  const dy = (b[1] - a[1]) / 4;
  const colors = ['#ff6b8b', '#ffd23f', '#ff8fd1', '#ff6b8b'];
  return (
    <g pointerEvents="none">
      <path d={`M${a[0] - 1} ${a[1]} L${b[0] + 1} ${b[1]} L${b[0] + 1} ${b[1] + 3.4} L${a[0] - 1} ${a[1] + 3.4} Z`} fill="#8a5a2b" stroke="#5a3a1c" strokeWidth={0.6} />
      {colors.map((c, i) => (
        <g key={i}>
          <circle cx={a[0] + dx * (i + 0.5)} cy={a[1] + dy * (i + 0.5) - 1.6} r={1.9} fill="#3f8a3a" />
          <circle cx={a[0] + dx * (i + 0.5)} cy={a[1] + dy * (i + 0.5) - 2.4} r={1.3} fill={c} />
        </g>
      ))}
    </g>
  );
}

/** Barrels and a crate by the door. */
function Stores({ at, wood }: { at: [number, number]; wood: Shades }) {
  const [x, y] = at;
  const barrel = (bx: number, by: number) => (
    <g>
      <rect x={bx - 4} y={by - 9} width={8} height={9} rx={2} fill={wood.base} stroke={wood.dark} strokeWidth={0.8} />
      <ellipse cx={bx} cy={by - 9} rx={4} ry={1.7} fill={wood.light} stroke={wood.dark} strokeWidth={0.7} />
      <path d={`M${bx - 4} ${by - 6.5} h8 M${bx - 4} ${by - 2.5} h8`} stroke="#4b5563" strokeWidth={0.9} />
    </g>
  );
  return (
    <g pointerEvents="none">
      {barrel(x, y)}
      {barrel(x + 9, y + 3)}
      <polygon points={`${x - 13},${y - 1} ${x - 5},${y + 3} ${x - 5},${y - 5} ${x - 13},${y - 9}`} fill={wood.base} stroke={wood.dark} strokeWidth={0.8} />
      <polygon points={`${x - 5},${y + 3} ${x + 1},${y} ${x + 1},${y - 8} ${x - 5},${y - 5}`} fill={wood.dark} stroke={wood.dark} strokeWidth={0.8} />
      <polygon points={`${x - 13},${y - 9} ${x - 5},${y - 5} ${x + 1},${y - 8} ${x - 7},${y - 12}`} fill={wood.light} stroke={wood.dark} strokeWidth={0.8} />
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
  const rows = [0.17, 0.34, 0.51, 0.68, 0.85];
  const lerp = (p: [number, number], q: [number, number], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  // Scalloped shingles: each row is a run of small arcs that bulge toward the eave.
  const down: [number, number] = [(F0[0] - R0[0]) * 0.07, (F0[1] - R0[1]) * 0.07];
  const shingleRow = (t: number, k: number) => {
    const a = lerp(R0, F0, t);
    const b = lerp(R1, F1, t);
    const n = 9;
    const off = k % 2 ? 0.5 / n : 0;
    let d = '';
    for (let i = 0; i < n; i++) {
      const u0 = Math.min(1, i / n + off);
      const u1 = Math.min(1, (i + 1) / n + off);
      if (u0 >= 1) break;
      const p0 = [a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0];
      const p1 = [a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1];
      const mid = [(p0[0] + p1[0]) / 2 + down[0], (p0[1] + p1[1]) / 2 + down[1]];
      d += `M${p0[0]} ${p0[1]} Q ${mid[0]} ${mid[1]} ${p1[0]} ${p1[1]} `;
    }
    return d;
  };
  return (
    <g>
      {/* Gable end wall, then the overhanging roof edge above it. */}
      <polygon points={pts([G0, G1, GT])} fill={wall.dark} />
      <polygon points={pts([G0, G1, GT])} fill="url(#hf-side)" />
      <polygon points={pts([P(x1 + o, y0 - o, z), F1, R1])} fill="none" stroke={s.dark} strokeWidth={4} strokeLinejoin="round" />
      <polygon points={pts([R0, R1, F1, F0])} fill={s.base} />
      <path d={rows.map(shingleRow).join(' ')} fill="none" stroke="#000" strokeOpacity={0.26} strokeWidth={1} />
      <path d={rows.map((t, k) => shingleRow(t - 0.03, k)).join(' ')} fill="none" stroke="#fff" strokeOpacity={0.16} strokeWidth={0.8} />
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
      <g className="base-flag">
        <polygon points={`${x + 1},${y - h} ${x + 17},${y - h + 4} ${x + 1},${y - h + 9}`} fill={s.base} />
        <polygon points={`${x + 1},${y - h + 4.5} ${x + 17},${y - h + 4} ${x + 1},${y - h + 9}`} fill={s.dark} />
      </g>
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
        <IsoBox b={hall} s={m.wood} mat="plank" />
        <TimberFrame b={hall} brace={false} />
        <IsoDoor points={leftQuad(hall, 0.42, 0.58, 0, 0.62)} />
        <Lantern at={P(hall.x0 + (hall.x1 - hall.x0) * 0.62, hall.y1 + 1, 34)} lit />
        <IsoWindow points={leftQuad(hall, 0.12, 0.24, 0.35, 0.62)} lit={lit} />
        <IsoWindow points={leftQuad(hall, 0.76, 0.88, 0.35, 0.62)} lit={lit} />
        <IsoWindow points={rightQuad(hall, 0.4, 0.6, 0.35, 0.62)} lit={lit} />
        {[ox + 72, ox + 128].map((x) => (
          <IsoBox key={x} b={{ x0: x - 3, y0: oy + 177, x1: x + 3, y1: oy + 183, z0: 5, z1: 46 }} s={m.wood} courses={false} />
        ))}
        <IsoDecorations kind={decoration} b={hall} s={s} lit={lit} />
        <ThatchRoof x0={hall.x0} y0={hall.y0} x1={hall.x1} y1={hall.y1} z={56} rise={56} o={10} ridge={s} wall={m.wood} />
        <Crest at={P(hall.x1, (hall.y0 + hall.y1) / 2, 84)} size={16} s={s} />
        <Stores at={P(ox + 184, oy + 116, 0)} wood={m.wood} />
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
      <Stores at={P(ox + 186, oy + 120, 0)} wood={m.wood} />
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
        <IsoBox b={b} s={m.wood} mat="plank" />
        <IsoDoor points={leftQuad(b, 0.42, 0.62, 0, 0.66)} />
        <polygon points={leftQuad(b, 0.42, 0.62, 0, 0.66)} fill={s.dark} opacity={0.55} />
        <IsoWindow points={leftQuad(b, 0.12, 0.3, 0.38, 0.7)} lit={lit} />
        <IsoDecorations kind={decoration} b={b} s={s} lit={lit} />
        <ThatchRoof x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} z={38} rise={34} o={8} ridge={s} wall={m.wood} />
        <Firewood at={P(ox + 88, oy + 36, 3)} wood={m.wood} />
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
      <IsoBox b={ground} s={grand ? m.stone : m.wood} mat={grand ? 'stone' : 'plank'} />
      {!grand && <TimberFrame b={ground} />}
      {grand ? <BandedDoor b={ground} u0={0.4} u1={0.62} h={0.8} s={s} /> : <IsoDoor points={leftQuad(ground, 0.42, 0.62, 0, 0.62)} />}
      <IsoWindow points={leftQuad(ground, 0.12, 0.3, 0.4, 0.72)} lit={lit} />
      <IsoWindow points={leftQuad(ground, 0.74, 0.9, 0.4, 0.72)} lit={lit} />
      <IsoWindow points={rightQuad(ground, 0.35, 0.65, 0.4, 0.72)} lit={lit} />
      {[[0.1, 0.32], [0.72, 0.92]].map(([u0, u1]) => {
        const zz = ground.z0 + (ground.z1 - ground.z0) * 0.36;
        const fx = (u: number) => ground.x0 + (ground.x1 - ground.x0) * u;
        return <FlowerBox key={u0} a={P(fx(u0), ground.y1 + 2, zz)} b={P(fx(u1), ground.y1 + 2, zz)} />;
      })}
      <Firewood at={P(ox + 92, oy + 34, plinth.z1)} wood={m.wood} />
      {upper && (
        <g>
          <IsoBox b={upper} s={m.wood} mat="plank" />
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
      <ChimneySmoke at={P(ox + 66, oy + 38, top.z1 + (grand ? 46 : 38))} strong={lit} />
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
      <Sparks at={P(b.x0 + (b.x1 - b.x0) * 0.5, b.y1 + 2, b.z0 + (b.z1 - b.z0) * 0.3)} />
      <IsoWindow points={rightQuad(b, 0.35, 0.65, 0.45, 0.72)} lit={lit} />
      <IsoDecorations kind={decoration} b={b} s={s} lit={lit} />
      <GableRoof x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} z={b.z1} rise={26} o={5} s={s} wall={stone} />
      {grand && <GoldEaves x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} z={b.z1} rise={26} o={5} />}
      {(grand ? [ox + 24, ox + 64] : [ox + 62]).map((x) => (
        <g key={x}>
          <IsoBox b={{ x0: x, y0: oy + 28, x1: x + 14, y1: oy + 42, z0: b.z1 + 4, z1: b.z1 + (grand ? 66 : 54) }} s={stone} />
          {grand && <polygon points={leftQuad({ x0: x, y0: oy + 28, x1: x + 14, y1: oy + 42, z0: b.z1 + 4, z1: b.z1 + 66 }, 0, 1, 0.9, 0.97)} fill={GOLD.base} />}
          <ChimneySmoke at={P(x + 7, oy + 35, b.z1 + (grand ? 68 : 56))} strong={lit} />
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
  // A real arena: packed sand, then a running track (L2+) and bright turf with chalk lines (L3).
  const sand: Shades = { light: '#efd8a6', base: '#d8b878', dark: '#a98545' };
  const quad = (i: number) => pts([P(ox + i, oy + i, 6), P(ox + 200 - i, oy + i, 6), P(ox + 200 - i, oy + 200 - i, 6), P(ox + i, oy + 200 - i, 6)]);
  const speckles = Array.from({ length: 26 }, (_, k) => {
    const u = ((k * 37) % 100) / 100;
    const v = ((k * 61) % 100) / 100;
    return P(ox + 20 + u * 160, oy + 20 + v * 160, 6);
  });
  void turf;
  return (
    <g>
      <IsoBox b={pad} s={sand} courses={false} />
      {/* Timber border */}
      <polygon points={quad(8)} fill="none" stroke="#8a5a2b" strokeWidth={3} strokeLinejoin="round" />
      <polygon points={quad(8)} fill="none" stroke="#c48a4c" strokeWidth={1.2} strokeLinejoin="round" />
      {speckles.map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r={k % 3 ? 0.9 : 1.4} fill={k % 2 ? '#b8975a' : '#f6e3b8'} opacity={0.8} />
      ))}
      {level >= 2 && (
        <g>
          <polygon points={quad(16)} fill="#c0573e" />
          <polygon points={quad(40)} fill={level >= 3 ? '#4fb56a' : '#e3c48a'} />
          {[22, 28, 34].map((i) => (
            <polygon key={i} points={quad(i)} fill="none" stroke="#ffffff" strokeOpacity={0.75} strokeWidth={0.8} />
          ))}
          <polygon points={quad(16)} fill="none" stroke="#7a2f20" strokeOpacity={0.6} strokeWidth={0.8} />
        </g>
      )}
      {level >= 3 && (
        <g fill="none" stroke="#f2fff4" strokeOpacity={0.85} strokeWidth={1.1}>
          <polygon points={quad(52)} />
          <polyline points={pts([P(ox + 100, oy + 40, 6), P(ox + 100, oy + 160, 6)])} />
          <ellipse cx={P(ox + 100, oy + 100, 6)[0]} cy={P(ox + 100, oy + 100, 6)[1]} rx={14} ry={7} />
        </g>
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
// ---------------------------------------------------------------------------
// Decorations in true isometric: same projection, light (lit left face,
// shaded right face), materials and textures as the buildings.
// ---------------------------------------------------------------------------
const decorAt = (ox: number, oy: number) => (x: number, y: number, z = 0) => P(ox + x, oy + y, z);
const circleAt = (Q: (x: number, y: number, z?: number) => [number, number], cx: number, cy: number, r: number, z: number, n = 20) =>
  pts(Array.from({ length: n }, (_, i) => Q(cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r, z)));

/** One five-petal flower head in screen space. */
function Bloom({ x, y, r, petal, light }: { x: number; y: number; r: number; petal: string; light: string }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <ellipse key={i} cx={x + Math.cos(a) * r} cy={y + Math.sin(a) * r * 0.8} rx={r * 0.85} ry={r * 0.7} fill={i % 2 ? light : petal} />;
      })}
      <circle cx={x} cy={y} r={r * 0.55} fill="#ffd76a" />
      <circle cx={x - r * 0.2} cy={y - r * 0.2} r={r * 0.2} fill="#fff4c4" />
    </g>
  );
}

function IsoArch({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const bloom = themeFor('arch', color);
  const arc = (y: number) =>
    Array.from({ length: 17 }, (_, i) => {
      const t = Math.PI * (i / 16);
      return Q(50 - 38 * Math.cos(t), y, 74 + 30 * Math.sin(t));
    });
  const back = arc(42);
  const front = arc(58);
  const line = (list: Array<[number, number]>) => list.map((p) => p.join(',')).join(' ');
  const lantern = Q(50, 50, 86);
  return (
    <g pointerEvents="none">
      {/* stepping stones under the arch */}
      {[30, 50, 70].map((y, i) => (
        <polygon key={y} points={circleAt(Q, 50 + (i - 1) * 3, y, 8.5, 0.6, 12)} fill={STONE.base} stroke={STONE.dark} strokeOpacity={0.5} strokeWidth={0.6} />
      ))}
      {/* the back half of the trellis, slats, then posts, then the front arch */}
      <polyline points={line(back)} fill="none" stroke={WOOD.dark} strokeWidth={5.4} strokeLinecap="round" />
      <polyline points={line(back)} fill="none" stroke={WOOD.base} strokeWidth={3.4} strokeLinecap="round" />
      {back.map((b, i) => (i % 2 === 0 ? <line key={i} x1={b[0]} y1={b[1]} x2={front[i][0]} y2={front[i][1]} stroke={WOOD.dark} strokeWidth={1.6} /> : null))}
      <IsoBox b={{ x0: ox + 8, x1: ox + 16, y0: oy + 40, y1: oy + 60, z0: 0, z1: 75 }} s={WOOD} mat="plank" />
      <IsoBox b={{ x0: ox + 84, x1: ox + 92, y0: oy + 40, y1: oy + 60, z0: 0, z1: 75 }} s={WOOD} mat="plank" />
      <polyline points={line(front)} fill="none" stroke={WOOD.dark} strokeWidth={6} strokeLinecap="round" />
      <polyline points={line(front)} fill="none" stroke={WOOD.light} strokeWidth={3.6} strokeLinecap="round" />
      {/* vines climbing the posts and over the arch */}
      {[...front, ...[10, 22, 34, 46, 58, 70].map((z) => Q(12, 61, z)), ...[14, 28, 42, 56, 68].map((z) => Q(88, 61, z))].map(([x, y], i) => (
        <g key={`v${i}`}>
          <ellipse cx={x - 2.2} cy={y + 0.5} rx={3} ry={1.9} fill={LEAF.dark} transform={`rotate(-28 ${x - 2.2} ${y + 0.5})`} />
          <ellipse cx={x + 2.2} cy={y - 0.6} rx={2.8} ry={1.8} fill={i % 3 ? LEAF.base : LEAF.light} transform={`rotate(24 ${x + 2.2} ${y - 0.6})`} />
        </g>
      ))}
      {/* clusters of flowers in the chosen colour */}
      {[1, 3, 5, 7, 9, 11, 13, 15].map((i) => {
        const [x, y] = front[i];
        return <Bloom key={`b${i}`} x={x} y={y - 1.5} r={2.9} petal={bloom.base} light={bloom.light} />;
      })}
      {[Q(12, 61, 26), Q(88, 61, 20), Q(12, 61, 52), Q(88, 61, 46)].map(([x, y], i) => (
        <Bloom key={`p${i}`} x={x + 2} y={y} r={2.5} petal={bloom.base} light={bloom.light} />
      ))}
      {/* a lantern hanging from the top */}
      <line x1={lantern[0]} y1={Q(50, 50, 104)[1]} x2={lantern[0]} y2={lantern[1] - 4} stroke="#3c3326" strokeWidth={0.8} />
      <rect x={lantern[0] - 3} y={lantern[1] - 4} width={6} height={7} rx={1.2} fill="#3c3326" />
      <rect x={lantern[0] - 2} y={lantern[1] - 3} width={4} height={5} rx={0.8} fill={WINDOW_LIT} className="base-window is-warm is-candle" />
    </g>
  );
}

function IsoFlowers({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const bloom = themeFor('flowers', color);
  const spots: Array<[number, number, number]> = [
    [34, 30, 15], [52, 26, 18], [68, 34, 14], [28, 46, 17], [46, 44, 21], [64, 50, 16],
    [74, 64, 18], [36, 62, 15], [54, 64, 19], [44, 76, 14], [62, 76, 16]
  ];
  spots.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  return (
    <g pointerEvents="none">
      {/* a soft mound of dark soil with a lighter rim */}
      <polygon points={circleAt(Q, 50, 52, 38, 0, 24)} fill="#5e4128" />
      <polygon points={circleAt(Q, 50, 52, 34, 2.5, 24)} fill="#7a5636" />
      <polygon points={circleAt(Q, 48, 50, 26, 3.5, 24)} fill="#6b4a2e" />
      {spots.map(([x, y, h], i) => {
        const base = Q(x, y, 3);
        const head = Q(x, y, h);
        return (
          <g key={i}>
            <line x1={base[0]} y1={base[1]} x2={head[0]} y2={head[1]} stroke="#2f7a3f" strokeWidth={1.2} />
            <ellipse cx={base[0] - 2.4} cy={(base[1] + head[1]) / 2 + 2} rx={2.8} ry={1.3} fill={LEAF.dark} transform={`rotate(-25 ${base[0] - 2.4} ${(base[1] + head[1]) / 2 + 2})`} />
            <ellipse cx={base[0] + 2.4} cy={(base[1] + head[1]) / 2 + 3} rx={2.6} ry={1.2} fill={LEAF.base} transform={`rotate(25 ${base[0] + 2.4} ${(base[1] + head[1]) / 2 + 3})`} />
            <Bloom x={head[0]} y={head[1]} r={i % 3 === 0 ? 3 : 2.5} petal={i % 4 === 1 ? bloom.light : bloom.base} light={i % 4 === 1 ? '#ffffff' : bloom.light} />
          </g>
        );
      })}
    </g>
  );
}

function IsoBanner({ ox, oy, style, color }: { ox: number; oy: number; style?: string; color?: string }) {
  const Q = decorAt(ox, oy);
  const cloth = themeFor('banner', color);
  const y = 53;
  const top = 98;
  const bottom = 34;
  const quad = (a: [number, number, number][]) => pts(a.map(([x, yy, z]) => Q(x, yy, z)));
  const outline = quad([[24, y, top], [76, y, top], [76, y, bottom], [50, y, bottom + 14], [24, y, bottom]]);
  const top2 = Q(50, 50, 114);
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: ox + 40, x1: ox + 60, y0: oy + 40, y1: oy + 60, z0: 0, z1: 7 }} s={STONE} />
      <IsoBox b={{ x0: ox + 47, x1: ox + 53, y0: oy + 47, y1: oy + 53, z0: 7, z1: 110 }} s={WOOD} courses={false} />
      <IsoBox b={{ x0: ox + 20, x1: ox + 80, y0: oy + 49, y1: oy + 52, z0: top, z1: top + 4 }} s={WOOD} courses={false} />
      <circle cx={top2[0]} cy={top2[1]} r={3.4} fill={GOLD.base} />
      <circle cx={top2[0] - 1} cy={top2[1] - 1} r={1.3} fill={GOLD.light} />
      <g className="base-flag">
        <polygon points={outline} fill={cloth.base} />
        {/* folds: soft shade bands */}
        <polygon points={quad([[37, y, top], [42, y, top], [42, y, bottom + 6], [37, y, bottom + 3]])} fill={cloth.dark} opacity={0.35} />
        <polygon points={quad([[58, y, top], [63, y, top], [63, y, bottom + 6], [58, y, bottom + 9]])} fill={cloth.dark} opacity={0.3} />
        {style === 'stripe' && <polygon points={quad([[24, y, 74], [76, y, 74], [76, y, 64], [24, y, 64]])} fill={cloth.light} />}
        {style === 'chevron' && (
          <polyline points={quad([[24, y, 82], [50, y, 64], [76, y, 82]])} fill="none" stroke={cloth.light} strokeWidth={5} strokeLinejoin="round" />
        )}
        <polygon points={outline} fill="none" stroke={cloth.dark} strokeWidth={1} />
        <polyline points={quad([[24, y, top - 1], [76, y, top - 1]])} stroke="#fff" strokeOpacity={0.35} strokeWidth={1} />
      </g>
    </g>
  );
}

function IsoWindmill({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const cap = themeFor('windmill', color);
  const apex = Q(50, 50, 108);
  const base = [Q(33, 33, 80), Q(67, 33, 80), Q(67, 67, 80), Q(33, 67, 80)];
  const hub = Q(50, 69, 70);
  // Sails turn in the plane of the front-left face (x–z at y = 69).
  const blade = (a: number) => {
    const d = (r: number, w: number) => Q(50 + Math.cos(a) * r - Math.sin(a) * w, 69, 70 + Math.sin(a) * r + Math.cos(a) * w);
    return { frame: pts([d(6, -5), d(38, -5), d(38, 5), d(6, 5)]), spar: [d(0, 0), d(40, 0)] as const, lattice: [10, 18, 26, 34].map((r) => [d(r, -5), d(r, 5)] as const) };
  };
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: ox + 26, x1: ox + 74, y0: oy + 26, y1: oy + 74, z0: 0, z1: 32 }} s={STONE} />
      <IsoBox b={{ x0: ox + 30, x1: ox + 70, y0: oy + 30, y1: oy + 70, z0: 32, z1: 58 }} s={STONE} />
      <IsoBox b={{ x0: ox + 33, x1: ox + 67, y0: oy + 33, y1: oy + 67, z0: 58, z1: 80 }} s={STONE} />
      {/* door and window on the lit face */}
      <polygon points={pts([Q(44, 74, 0), Q(56, 74, 0), Q(56, 74, 18), Q(44, 74, 18)])} fill={WOOD.dark} />
      <polygon points={pts([Q(46, 70, 40), Q(54, 70, 40), Q(54, 70, 50), Q(46, 70, 50)])} fill={WINDOW_LIT} className="base-window is-warm" />
      {/* cap */}
      <polygon points={pts([base[3], base[2], apex])} fill={cap.base} />
      <polygon points={pts([base[2], base[1], apex])} fill={cap.dark} />
      <polyline points={pts([base[3], apex, base[1]])} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={1} />
      {/* sails */}
      {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((a) => {
        const b = blade(a);
        return (
          <g key={a}>
            <polygon points={b.frame} fill="#f3ead8" fillOpacity={0.92} stroke={WOOD.dark} strokeWidth={0.9} />
            {b.lattice.map(([p, q], i) => (
              <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={WOOD.dark} strokeWidth={0.6} />
            ))}
            <line x1={b.spar[0][0]} y1={b.spar[0][1]} x2={b.spar[1][0]} y2={b.spar[1][1]} stroke={WOOD.dark} strokeWidth={1.6} />
          </g>
        );
      })}
      <circle cx={hub[0]} cy={hub[1]} r={3.2} fill={WOOD.dark} />
      <circle cx={hub[0] - 0.8} cy={hub[1] - 0.8} r={1.2} fill={WOOD.light} />
    </g>
  );
}

function IsoBridge({ ox, oy }: { ox: number; oy: number }) {
  const Q = decorAt(ox, oy);
  const posts = (y: number) => [8, 30, 52, 74, 92].map((x) => <IsoBox key={`${y}-${x}`} b={{ x0: ox + x - 1.8, x1: ox + x + 1.8, y0: oy + y - 1.8, y1: oy + y + 1.8, z0: 15, z1: 32 }} s={WOOD} courses={false} />);
  const rail = (y: number) => <IsoBox b={{ x0: ox + 6, x1: ox + 94, y0: oy + y - 1.2, y1: oy + y + 1.2, z0: 28, z1: 31 }} s={WOOD} courses={false} />;
  return (
    <g pointerEvents="none">
      {[[12, 34], [88, 34], [12, 66], [88, 66]].map(([x, y]) => (
        <IsoBox key={`s${x}${y}`} b={{ x0: ox + x - 3, x1: ox + x + 3, y0: oy + y - 3, y1: oy + y + 3, z0: -8, z1: 10 }} s={WOOD} courses={false} />
      ))}
      {posts(31)}
      {rail(31)}
      <IsoBox b={{ x0: ox + 2, x1: ox + 98, y0: oy + 30, y1: oy + 70, z0: 10, z1: 15 }} s={WOOD} mat="plank" />
      {[12, 22, 32, 42, 52, 62, 72, 82, 92].map((x) => {
        const a = Q(x, 30, 15);
        const b = Q(x, 70, 15);
        return <line key={x} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={WOOD.dark} strokeOpacity={0.45} strokeWidth={0.7} />;
      })}
      {posts(69)}
      {rail(69)}
    </g>
  );
}

function IsoLilypad({ ox, oy }: { ox: number; oy: number }) {
  const Q = decorAt(ox, oy);
  const pad = (cx: number, cy: number, r: number, notch: number) => {
    const n = 22;
    const list: Array<[number, number]> = [Q(cx, cy, 0.5)];
    for (let i = 0; i <= n; i++) {
      const a = notch + 0.35 + (i / n) * (Math.PI * 2 - 0.7);
      list.push(Q(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.5));
    }
    return pts(list);
  };
  const pads: Array<[number, number, number, number]> = [[38, 40, 16, 0.4], [66, 58, 12, 2.4], [40, 70, 9, 4.2]];
  const lotus = Q(38, 40, 4);
  return (
    <g pointerEvents="none">
      <polygon points={circleAt(Q, 50, 55, 40, 0.2, 24)} fill="none" stroke="#ffffff" strokeOpacity={0.25} strokeWidth={1} />
      {pads.map(([x, y, r, notch], i) => (
        <g key={i}>
          <polygon points={pad(x, y + 1.5, r, notch)} fill="#1d5e3a" opacity={0.5} />
          <polygon points={pad(x, y, r, notch)} fill={i === 1 ? '#3fa862' : '#36a05a'} stroke="#226b3e" strokeWidth={0.8} />
          {[0.9, 1.9, 3.0, 4.1, 5.2].map((a) => {
            const c = Q(x, y, 0.5);
            const e = Q(x + Math.cos(a + notch) * r * 0.8, y + Math.sin(a + notch) * r * 0.8, 0.5);
            return <line key={a} x1={c[0]} y1={c[1]} x2={e[0]} y2={e[1]} stroke="#7fd39a" strokeOpacity={0.6} strokeWidth={0.6} />;
          })}
        </g>
      ))}
      {/* a lotus on the big pad */}
      {[-2, -1, 0, 1, 2].map((k) => (
        <ellipse key={k} cx={lotus[0] + k * 2.6} cy={lotus[1] - 2 + Math.abs(k) * 0.8} rx={2.2} ry={4.2} fill={k % 2 ? '#f7a8c8' : '#fbc8de'} transform={`rotate(${k * 22} ${lotus[0] + k * 2.6} ${lotus[1] - 2})`} />
      ))}
      <circle cx={lotus[0]} cy={lotus[1] - 2.5} r={1.8} fill="#ffd76a" />
    </g>
  );
}

function IsoTrainingBars({ ox, oy, kind, color }: { ox: number; oy: number; kind: 'pullupbar' | 'dipbars'; color?: string }) {
  const Q = decorAt(ox, oy);
  const metal = color ? themeFor(kind, color) : METAL;
  const post = (x: number, y: number, h: number) => (
    <g key={`${x}-${y}`}>
      <IsoBox b={{ x0: ox + x - 6, x1: ox + x + 6, y0: oy + y - 6, y1: oy + y + 6, z0: 0, z1: 2.5 }} s={DARK_STONE} courses={false} />
      <IsoBox b={{ x0: ox + x - 2.2, x1: ox + x + 2.2, y0: oy + y - 2.2, y1: oy + y + 2.2, z0: 2.5, z1: h }} s={metal} courses={false} />
    </g>
  );
  if (kind === 'pullupbar') {
    const t0 = Q(32, 51, 80);
    return (
      <g pointerEvents="none">
        {post(22, 50, 84)}
        <IsoBox b={{ x0: ox + 20, x1: ox + 80, y0: oy + 48.8, y1: oy + 51.2, z0: 80, z1: 82.4 }} s={METAL} courses={false} />
        {post(78, 50, 84)}
        {/* a towel hanging over the bar */}
        <polygon points={pts([Q(30, 51.5, 80.5), Q(38, 51.5, 80.5), Q(38, 51.5, 60), Q(30, 51.5, 63)])} fill="#f4f1ea" stroke="#c9c2b5" strokeWidth={0.6} />
        <polygon points={pts([Q(30, 51.5, 70), Q(38, 51.5, 70), Q(38, 51.5, 67), Q(30, 51.5, 67)])} fill={metal.base} />
        <circle cx={t0[0]} cy={t0[1]} r={0.1} fill="none" />
      </g>
    );
  }
  const bucket = Q(80, 78, 0);
  return (
    <g pointerEvents="none">
      {post(34, 26, 50)}
      {post(66, 26, 50)}
      <IsoBox b={{ x0: ox + 32.6, x1: ox + 35.4, y0: oy + 22, y1: oy + 78, z0: 48, z1: 51 }} s={METAL} courses={false} />
      <IsoBox b={{ x0: ox + 64.6, x1: ox + 67.4, y0: oy + 22, y1: oy + 78, z0: 48, z1: 51 }} s={METAL} courses={false} />
      {post(34, 74, 50)}
      {post(66, 74, 50)}
      {/* a chalk bucket */}
      <ellipse cx={bucket[0]} cy={bucket[1]} rx={6} ry={3} fill="#9aa3ad" />
      <rect x={bucket[0] - 6} y={bucket[1] - 9} width={12} height={9} fill="#c8cfd6" />
      <ellipse cx={bucket[0]} cy={bucket[1] - 9} rx={6} ry={3} fill="#f4f6f8" />
    </g>
  );
}

/**
 * A vertical cylinder in the iso projection: lit left half, shaded right half,
 * a top cap and optional horizontal bands (stone courses, bag seams).
 */
function DecorCylinder({ x, y, r, z0, z1, s, bands = [], top = true, ox, oy }: { x: number; y: number; r: number; z0: number; z1: number; s: Shades; bands?: number[]; top?: boolean; ox: number; oy: number }) {
  const Q = decorAt(ox, oy);
  const ring = (z: number, from: number, to: number, n = 16) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = from + ((to - from) * i) / n;
      return Q(x + Math.cos(a) * r, y + Math.sin(a) * r, z);
    });
  // The visible front half runs from the back-left silhouette to the back-right one.
  const front = (z: number) => ring(z, -Math.PI * 0.25, Math.PI * 0.75, 18);
  const left = (z: number) => ring(z, Math.PI * 0.25, Math.PI * 0.75, 10);
  const right = (z: number) => ring(z, -Math.PI * 0.25, Math.PI * 0.25, 10);
  const side = (f: (z: number) => Array<[number, number]>) => pts([...f(z0), ...f(z1).reverse()]);
  return (
    <g>
      <polygon points={side(left)} fill={s.base} />
      <polygon points={side(right)} fill={s.dark} />
      {bands.map((z) => (
        <polyline key={z} points={pts(front(z))} fill="none" stroke="#000" strokeOpacity={0.18} strokeWidth={0.8} />
      ))}
      {top && <polygon points={pts(ring(z1, 0, Math.PI * 2, 24))} fill={s.light} />}
      <polyline points={pts(left(z1))} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={0.8} />
    </g>
  );
}

function IsoPunchbag({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const bag = themeFor('punchbag', color);
  const hook = Q(62, 50, 86);
  const bagTop = Q(62, 50, 74);
  const gloves = [Q(70, 74, 0), Q(78, 68, 0)];
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: ox + 14, x1: ox + 30, y0: oy + 40, y1: oy + 56, z0: 0, z1: 3 }} s={DARK_STONE} courses={false} />
      <IsoBox b={{ x0: ox + 19, x1: ox + 25, y0: oy + 45, y1: oy + 51, z0: 3, z1: 94 }} s={WOOD} mat="plank" />
      <IsoBox b={{ x0: ox + 19, x1: ox + 66, y0: oy + 46.5, y1: oy + 49.5, z0: 88, z1: 92 }} s={WOOD} courses={false} />
      <line x1={hook[0]} y1={hook[1]} x2={bagTop[0]} y2={bagTop[1]} stroke="#5b6678" strokeWidth={1.4} strokeDasharray="2 1.2" />
      <DecorCylinder ox={ox} oy={oy} x={62} y={50} r={10} z0={30} z1={74} s={bag} bands={[38, 66]} />
      {gloves.map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + 1} rx={5} ry={2} fill="#000" opacity={0.18} />
          <path d={`M${x - 4} ${y} q0 -6 4 -6 q4 0 4 5 q0 3 -3 3 h-3 q-2 0 -2 -2 Z`} fill={bag.base} stroke={bag.dark} strokeWidth={0.7} />
          <path d={`M${x - 2} ${y - 4} q2 -2 4 0`} fill="none" stroke={bag.light} strokeWidth={0.9} />
        </g>
      ))}
    </g>
  );
}

function IsoLanterns({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const paper = themeFor('lanterns', color);
  const sag = (t: number) => 72 - Math.sin(t * Math.PI) * 12;
  const string = Array.from({ length: 21 }, (_, i) => Q(12 + (76 * i) / 20, 50, sag(i / 20)));
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: ox + 9, x1: ox + 15, y0: oy + 47, y1: oy + 53, z0: 0, z1: 76 }} s={WOOD} mat="plank" />
      <IsoBox b={{ x0: ox + 85, x1: ox + 91, y0: oy + 47, y1: oy + 53, z0: 0, z1: 76 }} s={WOOD} mat="plank" />
      <polyline points={pts(string)} fill="none" stroke="#3c3326" strokeWidth={0.9} />
      {[0.18, 0.34, 0.5, 0.66, 0.82].map((t, i) => {
        const [x, y] = Q(12 + 76 * t, 50, sag(t) - 2);
        return (
          <g key={t}>
            <circle cx={x} cy={y + 6} r={8} fill={WINDOW_LIT} opacity={0.16} />
            <line x1={x} y1={y - 2} x2={x} y2={y + 1} stroke="#3c3326" strokeWidth={0.8} />
            <rect x={x - 4} y={y + 1} width={8} height={10} rx={3.5} fill={i % 2 ? paper.light : paper.base} className="base-window is-warm is-candle" />
            <rect x={x - 4} y={y + 1} width={8} height={10} rx={3.5} fill="none" stroke={paper.dark} strokeWidth={0.6} />
            <line x1={x - 3.4} y1={y + 6} x2={x + 3.4} y2={y + 6} stroke={paper.dark} strokeOpacity={0.4} strokeWidth={0.5} />
            <rect x={x - 2.5} y={y + 0.4} width={5} height={1.4} fill="#3c3326" />
            <rect x={x - 2.5} y={y + 10.2} width={5} height={1.4} fill="#3c3326" />
          </g>
        );
      })}
    </g>
  );
}

function IsoParasol({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const cloth = themeFor('parasol', color);
  const n = 8;
  const rim = Array.from({ length: n }, (_, i) => Q(50 + Math.cos((i / n) * Math.PI * 2) * 32, 50 + Math.sin((i / n) * Math.PI * 2) * 32, 70));
  const apex = Q(50, 50, 86);
  const pole0 = Q(50, 50, 0);
  const ball = Q(78, 76, 5);
  // Draw the canopy panels back to front.
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => rim[a][1] + rim[(a + 1) % n][1] - (rim[b][1] + rim[(b + 1) % n][1]));
  return (
    <g pointerEvents="none">
      <ellipse cx={Q(50, 50, 0)[0]} cy={Q(50, 50, 0)[1]} rx={30} ry={15} fill="#000" opacity={0.14} />
      {/* a striped towel */}
      <polygon points={pts([Q(24, 56, 0.5), Q(46, 56, 0.5), Q(46, 86, 0.5), Q(24, 86, 0.5)])} fill="#ffffff" />
      {[62, 70, 78].map((y) => (
        <polygon key={y} points={pts([Q(24, y, 0.6), Q(46, y, 0.6), Q(46, y + 4, 0.6), Q(24, y + 4, 0.6)])} fill={cloth.base} />
      ))}
      <line x1={pole0[0]} y1={pole0[1]} x2={apex[0]} y2={apex[1]} stroke="#f4f1ea" strokeWidth={2.4} />
      <line x1={pole0[0] + 0.8} y1={pole0[1]} x2={apex[0] + 0.8} y2={apex[1]} stroke="#b9b2a6" strokeWidth={0.8} />
      {order.map((i) => {
        const a = rim[i];
        const b = rim[(i + 1) % n];
        const front = (a[1] + b[1]) / 2 > apex[1] + 10;
        return <polygon key={i} points={pts([apex, a, b])} fill={i % 2 ? '#ffffff' : cloth.base} stroke={i % 2 ? '#d9d4ca' : cloth.dark} strokeWidth={0.6} opacity={front ? 1 : 0.95} />;
      })}
      <circle cx={apex[0]} cy={apex[1] - 1} r={1.8} fill={cloth.dark} />
      {/* a beach ball */}
      <circle cx={ball[0]} cy={ball[1]} r={5.5} fill="#ffffff" />
      <path d={`M${ball[0] - 5.5} ${ball[1]} A5.5 5.5 0 0 1 ${ball[0]} ${ball[1] - 5.5} L${ball[0]} ${ball[1]} Z`} fill={cloth.base} />
      <path d={`M${ball[0] + 5.5} ${ball[1]} A5.5 5.5 0 0 1 ${ball[0]} ${ball[1] + 5.5} L${ball[0]} ${ball[1]} Z`} fill="#f7c948" />
      <circle cx={ball[0] - 1.8} cy={ball[1] - 1.8} r={1.4} fill="#fff" opacity={0.7} />
    </g>
  );
}

const MARBLE: Shades = { light: '#f6f4ef', base: '#dcd6cb', dark: '#a8a193' };

function IsoStatue({ ox, oy, style }: { ox: number; oy: number; style?: string }) {
  const Q = decorAt(ox, oy);
  const plaque = [Q(42, 70.5, 12), Q(58, 70.5, 12), Q(58, 70.5, 22), Q(42, 70.5, 22)];
  const [fx, fy] = Q(50, 50, 30);
  const runner = style === 'runner';
  // The athlete: marble, lit from the left like the buildings.
  const limb = (x1: number, y1: number, x2: number, y2: number, w: number, shade = MARBLE.base) => (
    <line x1={fx + x1} y1={fy + y1} x2={fx + x2} y2={fy + y2} stroke={shade} strokeWidth={w} strokeLinecap="round" />
  );
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: ox + 26, x1: ox + 74, y0: oy + 26, y1: oy + 74, z0: 0, z1: 8 }} s={STONE} />
      <IsoBox b={{ x0: ox + 32, x1: ox + 68, y0: oy + 32, y1: oy + 68, z0: 8, z1: 30 }} s={MARBLE} />
      <polygon points={pts(plaque)} fill={GOLD.base} stroke={GOLD.dark} strokeWidth={0.6} />
      <line x1={plaque[0][0] + 3} y1={(plaque[0][1] + plaque[3][1]) / 2} x2={plaque[1][0] - 3} y2={(plaque[1][1] + plaque[2][1]) / 2} stroke={GOLD.dark} strokeWidth={0.7} />
      <g>
        {runner ? (
          <>
            {limb(1, -20, 9, -10, 5.9, MARBLE.dark)}
            {limb(9, -10, 13, 0, 5.4, MARBLE.dark)}
            {limb(-1, -20, -9, -12, 6.2)}
            {limb(-9, -12, -12, -3, 5.7)}
            <path d={`M${fx - 6.5} ${fy - 38} L${fx + 7.5} ${fy - 38} L${fx + 5} ${fy - 20} L${fx - 4} ${fy - 20} Z`} fill={MARBLE.base} />
            <path d={`M${fx + 1} ${fy - 38} L${fx + 6} ${fy - 38} L${fx + 4} ${fy - 20} L${fx + 1} ${fy - 20} Z`} fill={MARBLE.dark} opacity={0.6} />
            {limb(5, -35, 13, -28, 4.6, MARBLE.dark)}
            {limb(13, -28, 16, -36, 4.1, MARBLE.dark)}
            {limb(-4, -35, -12, -30, 4.9)}
            {limb(-12, -30, -16, -22, 4.3)}
            <circle cx={fx + 1} cy={fy - 44} r={5.8} fill={MARBLE.light} />
          </>
        ) : (
          <>
            {limb(-3, -20, -7, -1, 6.2)}
            {limb(3, -20, 7, -1, 5.9, MARBLE.dark)}
            <path d={`M${fx - 8.5} ${fy - 40} L${fx + 8.5} ${fy - 40} L${fx + 5} ${fy - 20} L${fx - 5} ${fy - 20} Z`} fill={MARBLE.base} />
            <path d={`M${fx} ${fy - 40} L${fx + 8.5} ${fy - 40} L${fx + 5} ${fy - 20} L${fx} ${fy - 20} Z`} fill={MARBLE.dark} opacity={0.55} />
            {limb(-6, -38, -15, -38, 5.1)}
            {limb(-15, -38, -15, -48, 4.6)}
            <circle cx={fx - 15} cy={fy - 41} r={3} fill={MARBLE.light} />
            {limb(6, -38, 15, -38, 4.9, MARBLE.dark)}
            {limb(15, -38, 15, -48, 4.3, MARBLE.dark)}
            <circle cx={fx + 15} cy={fy - 41} r={2.8} fill={MARBLE.base} />
            <circle cx={fx} cy={fy - 46} r={5.8} fill={MARBLE.light} />
          </>
        )}
        {/* the pigeon that always finds it */}
        <ellipse cx={fx + (runner ? 3 : 2)} cy={fy - (runner ? 51 : 53)} rx={3.6} ry={2.2} fill="#8a93a3" />
        <circle cx={fx + (runner ? 5.4 : 4.4)} cy={fy - (runner ? 52.6 : 54.6)} r={1.5} fill="#6b7383" />
      </g>
    </g>
  );
}

function IsoWell({ ox, oy }: { ox: number; oy: number }) {
  const Q = decorAt(ox, oy);
  const water = Q(50, 50, 16);
  const axleL = Q(30, 50, 46);
  const axleR = Q(70, 50, 46);
  const rope = Q(50, 50, 46);
  const bucket = Q(50, 50, 30);
  const roof = (y: number) => [Q(26, y, 54), Q(74, y, 54), Q(74, 50, 66), Q(26, 50, 66)];
  return (
    <g pointerEvents="none">
      <DecorCylinder ox={ox} oy={oy} x={50} y={50} r={21} z0={0} z1={18} s={STONE} bands={[6, 12]} top={false} />
      <polygon points={circleAt(Q, 50, 50, 21, 18, 24)} fill={STONE.light} />
      <polygon points={circleAt(Q, 50, 50, 16, 18, 24)} fill="#203448" />
      <ellipse cx={water[0] - 3} cy={water[1] - 1} rx={5} ry={1.6} fill="#5aa9d6" opacity={0.6} />
      <IsoBox b={{ x0: ox + 26, x1: ox + 31, y0: oy + 47.5, y1: oy + 52.5, z0: 14, z1: 56 }} s={WOOD} courses={false} />
      <IsoBox b={{ x0: ox + 69, x1: ox + 74, y0: oy + 47.5, y1: oy + 52.5, z0: 14, z1: 56 }} s={WOOD} courses={false} />
      <line x1={axleL[0]} y1={axleL[1]} x2={axleR[0]} y2={axleR[1]} stroke={WOOD.dark} strokeWidth={2.4} />
      <line x1={rope[0]} y1={rope[1]} x2={bucket[0]} y2={bucket[1]} stroke="#cdb48a" strokeWidth={0.9} />
      <path d={`M${bucket[0] - 4} ${bucket[1]} L${bucket[0] + 4} ${bucket[1]} L${bucket[0] + 3} ${bucket[1] + 6} L${bucket[0] - 3} ${bucket[1] + 6} Z`} fill={WOOD.base} stroke={WOOD.dark} strokeWidth={0.6} />
      {/* a small gable roof */}
      <polygon points={pts(roof(30))} fill="#c45a3c" />
      <polygon points={pts(roof(70))} fill="#e07a55" />
      <line x1={Q(26, 50, 66)[0]} y1={Q(26, 50, 66)[1]} x2={Q(74, 50, 66)[0]} y2={Q(74, 50, 66)[1]} stroke="#8a3a26" strokeWidth={1.2} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// The last flat decorations, redrawn in true isometric so they sit on the tile.
// ---------------------------------------------------------------------------
function IsoPicnic({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const cloth = themeFor('picnic', color);
  const leg = (x: number, y: number, z1: number) => (
    <IsoBox key={`${x}-${y}-${z1}`} b={{ x0: ox + x - 1.6, x1: ox + x + 1.6, y0: oy + y - 1.6, y1: oy + y + 1.6, z0: 0, z1 }} s={WOOD} courses={false} />
  );
  const bench = (y: number) => (
    <g key={`bench${y}`}>
      {leg(28, y, 16)}
      {leg(72, y, 16)}
      <IsoBox b={{ x0: ox + 22, x1: ox + 78, y0: oy + y - 4, y1: oy + y + 4, z0: 16, z1: 19 }} s={WOOD} mat="plank" />
    </g>
  );
  const top = [Q(22, 36, 32), Q(78, 36, 32), Q(78, 64, 32), Q(22, 64, 32)];
  const basket = Q(38, 46, 32);
  const apple = Q(60, 52, 32);
  return (
    <g pointerEvents="none">
      {bench(24)}
      {leg(27, 39, 30)}
      {leg(73, 39, 30)}
      <IsoBox b={{ x0: ox + 22, x1: ox + 78, y0: oy + 36, y1: oy + 64, z0: 29, z1: 32 }} s={cloth} courses={false} />
      {/* a checked cloth */}
      <polygon points={pts(top)} fill="#f8f4ea" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) =>
        [0, 1, 2, 3].map((j) =>
          (i + j) % 2 ? null : (
            <polygon
              key={`${i}-${j}`}
              points={pts([Q(22 + i * 8, 36 + j * 7, 32), Q(30 + i * 8, 36 + j * 7, 32), Q(30 + i * 8, 43 + j * 7, 32), Q(22 + i * 8, 43 + j * 7, 32)])}
              fill={cloth.base}
            />
          )
        )
      )}
      {leg(27, 61, 30)}
      {leg(73, 61, 30)}
      {/* a basket and an apple */}
      <path d={`M${basket[0] - 6} ${basket[1] - 1} h12 l-1.5 -7 h-9 z`} fill={WOOD.base} stroke={WOOD.dark} strokeWidth={0.7} />
      <path d={`M${basket[0] - 4} ${basket[1] - 8} q4 -6 8 0`} fill="none" stroke={WOOD.dark} strokeWidth={1.1} />
      <circle cx={apple[0]} cy={apple[1] - 3} r={2.6} fill="#e5484d" />
      <circle cx={apple[0] - 0.8} cy={apple[1] - 4} r={0.8} fill="#ffb3b3" />
      {bench(76)}
    </g>
  );
}

function IsoPlyobox({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const band = themeFor('plyobox', color);
  const rope = [Q(70, 80, 0.5), Q(86, 70, 0.5), Q(90, 86, 0.5), Q(76, 92, 0.5)];
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: ox + 26, x1: ox + 74, y0: oy + 26, y1: oy + 74, z0: 0, z1: 36 }} s={WOOD} mat="plank" />
      {/* a painted band and a grip pad */}
      <polygon points={pts([Q(26, 74, 14), Q(74, 74, 14), Q(74, 74, 20), Q(26, 74, 20)])} fill={band.base} />
      <polygon points={pts([Q(74, 74, 14), Q(74, 26, 14), Q(74, 26, 20), Q(74, 74, 20)])} fill={band.dark} />
      <polygon points={pts([Q(34, 34, 36), Q(66, 34, 36), Q(66, 66, 36), Q(34, 66, 36)])} fill="#3a3f4a" opacity={0.85} />
      {/* the jump rope on the ground */}
      <path d={`M${rope[0][0]} ${rope[0][1]} Q ${rope[1][0]} ${rope[1][1]} ${rope[2][0]} ${rope[2][1]} T ${rope[3][0]} ${rope[3][1]}`} fill="none" stroke="#e5484d" strokeWidth={1.4} />
      <rect x={rope[0][0] - 2} y={rope[0][1] - 4} width={3} height={6} rx={1} fill="#1f2328" />
      <rect x={rope[3][0] - 1} y={rope[3][1] - 4} width={3} height={6} rx={1} fill="#1f2328" />
    </g>
  );
}

function IsoCoop({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const roof = themeFor('coop', color);
  const door = [Q(42, 72, 2), Q(54, 72, 2), Q(54, 72, 14), Q(42, 72, 14)];
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: ox + 24, x1: ox + 76, y0: oy + 30, y1: oy + 72, z0: 0, z1: 28 }} s={WOOD} mat="plank" />
      <GableRoof x0={ox + 24} y0={oy + 30} x1={ox + 76} y1={oy + 72} z={28} rise={20} o={5} s={roof} wall={WOOD} />
      {/* the pop-hole door and its ramp */}
      <path d={`M${door[0][0]} ${door[0][1]} L${door[1][0]} ${door[1][1]} L${door[2][0]} ${door[2][1] + 3} Q ${(door[2][0] + door[3][0]) / 2} ${door[2][1] - 4} ${door[3][0]} ${door[3][1] + 3} Z`} fill="#2a1d14" />
      <polygon points={pts([Q(44, 72, 2), Q(52, 72, 2), Q(52, 88, 0), Q(44, 88, 0)])} fill={WOOD.light} stroke={WOOD.dark} strokeWidth={0.5} />
      {[[30, 84], [36, 90], [60, 86], [66, 80], [58, 92]].map(([x, y], i) => {
        const [sx, sy] = Q(x, y, 0.5);
        return <circle key={i} cx={sx} cy={sy} r={0.9} fill="#e8c46a" />;
      })}
    </g>
  );
}

function IsoBarn({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const wall = themeFor('barn', color);
  const roof: Shades = { light: '#c7ccd4', base: '#9aa1ac', dark: '#6b7280' };
  const door = [Q(36, 82, 0), Q(64, 82, 0), Q(64, 82, 30), Q(36, 82, 30)];
  const hay = { x0: ox + 80, x1: ox + 96, y0: oy + 66, y1: oy + 82, z0: 0, z1: 10 };
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: ox + 14, x1: ox + 86, y0: oy + 22, y1: oy + 82, z0: 0, z1: 42 }} s={wall} mat="plank" />
      <GableRoof x0={ox + 14} y0={oy + 22} x1={ox + 86} y1={oy + 82} z={42} rise={30} o={5} s={roof} wall={wall} />
      {/* white-trimmed, X-braced door on the lit face */}
      <polygon points={pts(door)} fill={wall.dark} stroke="#f4f1ea" strokeWidth={1.6} />
      <line x1={door[0][0]} y1={door[0][1]} x2={door[2][0]} y2={door[2][1]} stroke="#f4f1ea" strokeWidth={1.4} />
      <line x1={door[1][0]} y1={door[1][1]} x2={door[3][0]} y2={door[3][1]} stroke="#f4f1ea" strokeWidth={1.4} />
      <polygon points={pts([Q(14, 82, 42), Q(86, 82, 42), Q(86, 82, 40), Q(14, 82, 40)])} fill="#f4f1ea" />
      {/* a hay bale beside it */}
      <IsoBox b={hay} s={{ light: '#f2d77a', base: '#d8b64e', dark: '#a8862e' }} courses={false} />
    </g>
  );
}

function IsoTent({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const Q = decorAt(ox, oy);
  const canvas = themeFor('tent', color);
  // A ridge tent along x: two sloped sides, a triangle at each end.
  const r0 = Q(22, 50, 46);
  const r1 = Q(78, 50, 46);
  const fl = [Q(16, 80, 0), Q(84, 80, 0)];
  const end = [Q(84, 20, 0), Q(84, 80, 0), r1];
  const doorEnd = [Q(84, 38, 0), Q(84, 62, 0), Q(80, 50, 30)];
  const flag = Q(78, 50, 46);
  return (
    <g pointerEvents="none">
      <polygon points={pts([Q(14, 18, 0), Q(86, 18, 0), Q(86, 82, 0), Q(14, 82, 0)])} fill="#000" opacity={0.14} />
      {/* guy ropes */}
      <line x1={r0[0]} y1={r0[1]} x2={Q(8, 50, 0)[0]} y2={Q(8, 50, 0)[1]} stroke="#cdb48a" strokeWidth={0.8} />
      <line x1={r1[0]} y1={r1[1]} x2={Q(94, 50, 0)[0]} y2={Q(94, 50, 0)[1]} stroke="#cdb48a" strokeWidth={0.8} />
      <polygon points={pts([fl[0], fl[1], r1, r0])} fill={canvas.base} />
      <polygon points={pts(end)} fill={canvas.dark} />
      <polygon points={pts(doorEnd)} fill="#2a1d14" />
      <line x1={r0[0]} y1={r0[1]} x2={r1[0]} y2={r1[1]} stroke={canvas.light} strokeWidth={1.4} />
      <line x1={flag[0]} y1={flag[1]} x2={flag[0]} y2={flag[1] - 14} stroke="#3c3326" strokeWidth={1} />
      <polygon points={`${flag[0]},${flag[1] - 14} ${flag[0] + 9},${flag[1] - 11} ${flag[0]},${flag[1] - 8}`} fill="#c8f032" />
    </g>
  );
}

function IsoGazebo({ ox, oy, color }: { ox: number; oy: number; color?: string }) {
  const roof = themeFor('gazebo', color);
  const posts = [
    [24, 24],
    [76, 24],
    [24, 76],
    [76, 76],
    [50, 20],
    [50, 80]
  ];
  const back = posts.filter(([x, y]) => x + y < 100);
  const front = posts.filter(([x, y]) => x + y >= 100);
  const post = ([x, y]: number[]) => (
    <IsoBox key={`${x}-${y}`} b={{ x0: ox + x - 2, x1: ox + x + 2, y0: oy + y - 2, y1: oy + y + 2, z0: 5, z1: 48 }} s={WOOD} courses={false} />
  );
  return (
    <g pointerEvents="none">
      <DecorCylinder ox={ox} oy={oy} x={50} y={50} r={38} z0={0} z1={5} s={MARBLE} />
      {back.map(post)}
      {front.map(post)}
      <PyramidRoof x0={ox + 22} y0={oy + 22} x1={ox + 78} y1={oy + 78} z={48} rise={24} o={6} s={roof} />
    </g>
  );
}

function IsoFountain({ ox, oy, style }: { ox: number; oy: number; style?: string }) {
  const Q = decorAt(ox, oy);
  const water = '#4fb3e8';
  const spray = (from: [number, number], r: number, drop: number) =>
    [0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2;
      const end = Q(50 + Math.cos(a) * r, 50 + Math.sin(a) * r, drop);
      return (
        <path
          key={i}
          d={`M${from[0]} ${from[1]} Q ${(from[0] + end[0]) / 2} ${from[1] - 10} ${end[0]} ${end[1]}`}
          fill="none"
          stroke="#bfe8ff"
          strokeOpacity={0.8}
          strokeWidth={1}
          className="base-fountain-water"
        />
      );
    });
  const bowl = (r: number, z: number) => (
    <>
      <DecorCylinder ox={ox} oy={oy} x={50} y={50} r={r} z0={z} z1={z + 4} s={STONE} />
      <polygon points={circleAt(Q, 50, 50, r - 2, z + 4, 20)} fill={water} />
    </>
  );
  const tiered = style === 'tiered';
  const jet = style === 'jet';
  const columnTop = tiered ? 44 : 30;
  return (
    <g pointerEvents="none">
      <DecorCylinder ox={ox} oy={oy} x={50} y={50} r={36} z0={0} z1={12} s={STONE} bands={[6]} />
      <polygon points={circleAt(Q, 50, 50, 32, 12, 24)} fill={water} />
      <polygon points={circleAt(Q, 50, 50, 22, 12.2, 20)} fill="#7cc8f0" opacity={0.6} />
      {!jet && <DecorCylinder ox={ox} oy={oy} x={50} y={50} r={4} z0={12} z1={columnTop} s={STONE} />}
      {!jet && bowl(15, 26)}
      {tiered && <DecorCylinder ox={ox} oy={oy} x={50} y={50} r={3} z0={30} z1={44} s={STONE} />}
      {tiered && bowl(9, 40)}
      {jet ? (
        <>
          <line x1={Q(50, 50, 12)[0]} y1={Q(50, 50, 12)[1]} x2={Q(50, 50, 62)[0]} y2={Q(50, 50, 62)[1]} stroke="#bfe8ff" strokeWidth={3} strokeLinecap="round" className="base-fountain-water" />
          {spray(Q(50, 50, 62), 18, 13)}
        </>
      ) : (
        spray(Q(50, 50, tiered ? 46 : 32), tiered ? 10 : 16, tiered ? 31 : 13)
      )}
    </g>
  );
}

export const ISO_ITEMS = new Set(['hq', 'watchtower', 'lodge', 'forge', 'spring', 'yard', 'wall', 'garden', 'arch', 'flowers', 'banner', 'windmill', 'bridge', 'lilypad', 'pullupbar', 'dipbars', 'punchbag', 'lanterns', 'parasol', 'statue', 'well', 'picnic', 'plyobox', 'coop', 'barn', 'tent', 'gazebo', 'fountain']);
/** True for anything drawn as an isometric model (buildings, walls, gardens, trophies). */
export function isIsoItem(itemId: string): boolean {
  return ISO_ITEMS.has(itemId) || itemId.startsWith('trophy:');
}

/**
 * Draw an isometric model for a placed item at (ox, oy) = its footprint's
 * top corner in world units.
 */

/**
 * Each building's signature: the apparatus that says what happens there,
 * standing on the ground in front of it so the place feels used.
 */
function Signature({ itemId, ox, oy, lit, level, style }: { itemId: string; ox: number; oy: number; lit: boolean; level: number; style?: string }) {
  const at = (x: number, y: number, z = 0) => P(ox + x, oy + y, z);
  switch (itemId) {
    case 'watchtower': {
      // A ladder up the front wall and an alarm bell under the deck.
      const r0 = at(40, 74, 0);
      const r1 = at(40, 74, 54);
      const s0 = at(52, 74, 0);
      const s1 = at(52, 74, 54);
      const [bx, by] = at(78, 78, 58);
      return (
        <g pointerEvents="none">
          <g stroke="#7a5230" strokeWidth={1.8} strokeLinecap="round">
            <line x1={r0[0]} y1={r0[1]} x2={r1[0]} y2={r1[1]} />
            <line x1={s0[0]} y1={s0[1]} x2={s1[0]} y2={s1[1]} />
            {[0.15, 0.32, 0.49, 0.66, 0.83].map((t) => {
              const a = [r0[0] + (r1[0] - r0[0]) * t, r0[1] + (r1[1] - r0[1]) * t];
              const b = [s0[0] + (s1[0] - s0[0]) * t, s0[1] + (s1[1] - s0[1]) * t];
              return <line key={t} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={1.4} />;
            })}
          </g>
          <line x1={bx} y1={by - 10} x2={bx} y2={by - 4} stroke="#4b3a2a" strokeWidth={1.2} />
          <path d={`M${bx - 5} ${by + 4} Q ${bx - 4.6} ${by - 5}, ${bx} ${by - 5} Q ${bx + 4.6} ${by - 5}, ${bx + 5} ${by + 4} Z`} fill="#c9962e" stroke="#7a5a18" strokeWidth={0.7} />
          <ellipse cx={bx} cy={by + 4} rx={5} ry={1.3} fill="#7a5a18" />
          <circle cx={bx} cy={by + 5.4} r={1.1} fill="#5a4010" />
          <path d={`M${bx - 2.6} ${by - 2} Q ${bx - 2.4} ${by - 4} ${bx - 1} ${by - 4.2}`} stroke="#fff3c4" strokeWidth={0.8} fill="none" />
        </g>
      );
    }
    case 'forge': {
      // Anvil and hammer, a quench barrel, and a heap of coal.
      const [ax, ay] = at(16, 92, 0);
      const [qx, qy] = at(92, 26, 0);
      const [cx, cy] = at(92, 52, 0);
      return (
        <g pointerEvents="none">
          <rect x={ax - 3} y={ay - 6} width={6} height={6} fill="#4b4f57" />
          <path d={`M${ax - 9} ${ay - 9} H${ax + 8} Q ${ax + 11} ${ay - 9} ${ax + 12} ${ay - 7} H${ax + 6} L${ax + 4} ${ay - 6} H${ax - 6} Z`} fill="#5c616b" stroke="#2f3238" strokeWidth={0.6} />
          <path d={`M${ax - 8} ${ay - 9} H${ax + 8}`} stroke="#9aa1ad" strokeWidth={0.8} />
          <line x1={ax - 2} y1={ay - 10} x2={ax + 5} y2={ay - 16} stroke="#7a5230" strokeWidth={1.2} strokeLinecap="round" />
          <rect x={ax + 3} y={ay - 18.5} width={5} height={3} rx={0.6} fill="#3b3f46" transform={`rotate(-40 ${ax + 5.5} ${ay - 17})`} />
          <rect x={qx - 5} y={qy - 9} width={10} height={9} rx={2} fill="#8a5a2b" stroke="#4b2e14" strokeWidth={0.7} />
          <ellipse cx={qx} cy={qy - 9} rx={5} ry={1.8} fill="#2f4a5a" stroke="#4b2e14" strokeWidth={0.6} />
          <path d={`M${qx - 5} ${qy - 6} h10 M${qx - 5} ${qy - 2.5} h10`} stroke="#3b3f46" strokeWidth={0.8} />
          <path d={`M${cx - 7} ${cy} Q ${cx - 4} ${cy - 7}, ${cx} ${cy - 6} Q ${cx + 5} ${cy - 7}, ${cx + 7} ${cy} Z`} fill="#1f1f22" />
          {[[-3, -3], [1, -5], [3, -2]].map(([dx, dy], i) => (
            <circle key={i} cx={cx + dx} cy={cy + dy} r={1} fill={lit ? '#ff8a3d' : '#3a3a3e'} />
          ))}
        </g>
      );
    }
    case 'yard': {
      // A straw training dummy and a stand of weight plates.
      const [dx, dy] = at(30, 172, 0);
      const [px, py] = at(172, 30, 0);
      return (
        <g pointerEvents="none">
          <line x1={dx} y1={dy} x2={dx} y2={dy - 26} stroke="#7a5230" strokeWidth={2} />
          <line x1={dx - 8} y1={dy - 18} x2={dx + 8} y2={dy - 18} stroke="#7a5230" strokeWidth={1.8} />
          <ellipse cx={dx} cy={dy - 15} rx={5.4} ry={7} fill="#d9b76a" stroke="#a07a32" strokeWidth={0.8} />
          <path d={`M${dx - 5} ${dy - 15} h10 M${dx - 4.6} ${dy - 12} h9.2`} stroke="#a07a32" strokeWidth={0.7} />
          <circle cx={dx} cy={dy - 26} r={3.8} fill="#e2c47c" stroke="#a07a32" strokeWidth={0.8} />
          <line x1={px} y1={py} x2={px} y2={py - 16} stroke="#4b5563" strokeWidth={1.6} />
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={px} cy={py - 2 - i * 3.2} rx={6.4 - i * 1.1} ry={2.2} fill={i === 0 ? '#2f3542' : i === 1 ? '#c0392b' : '#2f6fd1'} stroke="#111827" strokeWidth={0.5} />
          ))}
        </g>
      );
    }
    case 'spring': {
      // Reeds by the water and a frog on a stone.
      const [rx, ry] = at(12, 88, 0);
      const [fx, fy] = at(88, 84, 0);
      return (
        <g pointerEvents="none">
          {[-3, 0, 3, 5].map((d, i) => (
            <g key={i}>
              <path d={`M${rx + d} ${ry} Q ${rx + d - 1} ${ry - 8}, ${rx + d + (i % 2 ? 2 : -2)} ${ry - 14 - i}`} stroke="#3f8a3a" strokeWidth={1.2} fill="none" />
              {i % 2 === 0 && <ellipse cx={rx + d + (i % 2 ? 2 : -2)} cy={ry - 12 - i} rx={0.9} ry={2.4} fill="#7a5230" />}
            </g>
          ))}
          <ellipse cx={fx} cy={fy - 1.5} rx={6} ry={2.6} fill="#9aa1ad" stroke="#6b7280" strokeWidth={0.5} />
          <ellipse cx={fx} cy={fy - 5} rx={3.4} ry={2.4} fill="#4caf50" />
          <circle cx={fx - 1.6} cy={fy - 7.2} r={1.2} fill="#5cc760" />
          <circle cx={fx + 1.6} cy={fy - 7.2} r={1.2} fill="#5cc760" />
          <circle cx={fx - 1.6} cy={fy - 7.4} r={0.5} fill="#111" />
          <circle cx={fx + 1.6} cy={fy - 7.4} r={0.5} fill="#111" />
        </g>
      );
    }
    case 'garden': {
      const [wx, wy] = at(90, 86, 0);
      return (
        <g pointerEvents="none">
          <path d={`M${wx - 5} ${wy} L${wx - 4} ${wy - 8} H${wx + 4} L${wx + 5} ${wy} Z`} fill="#2f8a6f" stroke="#1f5e4b" strokeWidth={0.6} />
          <path d={`M${wx + 4} ${wy - 6} L${wx + 10} ${wy - 11}`} stroke="#2f8a6f" strokeWidth={1.6} strokeLinecap="round" />
          <path d={`M${wx - 3} ${wy - 8} Q ${wx} ${wy - 13} ${wx + 3} ${wy - 8}`} stroke="#1f5e4b" strokeWidth={1} fill="none" />
        </g>
      );
    }
    case 'wall': {
      if (style === 'hedge' || style === 'fence') return null;
      // Ivy climbing the stone face.
      const vine = (pts2: Array<[number, number]>) => pts2.map(([x, z]) => P(ox + x, oy + 70.5, z));
      const runs = [vine([[10, 0], [14, 8], [12, 15], [18, 22], [26, 25]]), vine([[66, 0], [70, 7], [76, 12], [80, 19]])];
      return (
        <g pointerEvents="none">
          {runs.map((run, k) => (
            <g key={k}>
              <polyline points={run.map((p) => p.join(',')).join(' ')} fill="none" stroke="#2f6b2f" strokeWidth={0.9} />
              {run.map(([x, y], i) => (
                <g key={i}>
                  <ellipse cx={x - 2} cy={y} rx={2.6} ry={1.7} fill="#3f8a3a" transform={`rotate(-30 ${x - 2} ${y})`} />
                  <ellipse cx={x + 2} cy={y - 1} rx={2.4} ry={1.6} fill="#58a84a" transform={`rotate(25 ${x + 2} ${y - 1})`} />
                </g>
              ))}
            </g>
          ))}
        </g>
      );
    }
    default:
      void level;
      return null;
  }
}

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
  const art = (() => {
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
      case 'arch':
        return <IsoArch ox={ox} oy={oy} color={item.color} />;
      case 'flowers':
        return <IsoFlowers ox={ox} oy={oy} color={item.color} />;
      case 'banner':
        return <IsoBanner ox={ox} oy={oy} style={item.style} color={item.color} />;
      case 'windmill':
        return <IsoWindmill ox={ox} oy={oy} color={item.color} />;
      case 'bridge':
        return <IsoBridge ox={ox} oy={oy} />;
      case 'lilypad':
        return <IsoLilypad ox={ox} oy={oy} />;
      case 'punchbag':
        return <IsoPunchbag ox={ox} oy={oy} color={item.color} />;
      case 'picnic':
        return <IsoPicnic ox={ox} oy={oy} color={item.color} />;
      case 'plyobox':
        return <IsoPlyobox ox={ox} oy={oy} color={item.color} />;
      case 'coop':
        return <IsoCoop ox={ox} oy={oy} color={item.color} />;
      case 'barn':
        return <IsoBarn ox={ox} oy={oy} color={item.color} />;
      case 'tent':
        return <IsoTent ox={ox} oy={oy} color={item.color} />;
      case 'gazebo':
        return <IsoGazebo ox={ox} oy={oy} color={item.color} />;
      case 'fountain':
        return <IsoFountain ox={ox} oy={oy} style={item.style} />;
      case 'lanterns':
        return <IsoLanterns ox={ox} oy={oy} color={item.color} />;
      case 'parasol':
        return <IsoParasol ox={ox} oy={oy} color={item.color} />;
      case 'statue':
        return <IsoStatue ox={ox} oy={oy} style={item.style} />;
      case 'well':
        return <IsoWell ox={ox} oy={oy} />;
      case 'pullupbar':
      case 'dipbars':
        return <IsoTrainingBars ox={ox} oy={oy} kind={item.itemId} color={item.color} />;
      default:
        return null;
    }
  })();
  if (!art) return null;
  return (
    <g>
      {art}
      <Signature itemId={item.itemId} ox={ox} oy={oy} lit={lit} level={props.level} style={item.style} />
    </g>
  );
}

/**
 * A thin fence, wall or hedge along a tile edge. Key: `n:x,y` runs along the
 * top edge of tile (x, y); `w:x,y` along its left edge.
 */
const EDGE_STONE: Shades = { light: '#ece6dc', base: '#c3baac', dark: '#91897c' };
const EDGE_WOOD: Shades = { light: '#e0b06f', base: '#ad7840', dark: '#7a5228' };
const EDGE_HEDGE: Shades = { light: '#86e3a4', base: '#3faa63', dark: '#25744a' };
export function IsoEdge({
  edgeKey,
  kind,
  prev = false,
  next = false
}: {
  edgeKey: string;
  kind: 'fence' | 'wall' | 'hedge';
  /** The same kind continues before / after this segment (draw seamlessly). */
  prev?: boolean;
  next?: boolean;
}) {
  const m = /^([nw]):(-?\d+),(-?\d+)$/.exec(edgeKey);
  if (!m) return null;
  const T = 100;
  const x = Number(m[2]) * T;
  const y = Number(m[3]) * T;
  const along = m[1] === 'n';
  // Strip centred on the edge; ends stretch to meet neighbours, or pull in a little at a run's end.
  const strip = (thick: number, z0: number, z1: number, endInset: number): Box => {
    const a0 = prev ? 0 : endInset;
    const a1 = next ? 0 : endInset;
    return along
      ? { x0: x + a0, x1: x + T - a1, y0: y - thick / 2, y1: y + thick / 2, z0, z1 }
      : { x0: x - thick / 2, x1: x + thick / 2, y0: y + a0, y1: y + T - a1, z0, z1 };
  };
  // The face at the far end is the only end face we can see; hide it when the run continues.
  const end = along ? { hideRight: next } : { hideLeft: next };
  if (kind === 'wall') {
    return (
      <g pointerEvents="none">
        <IsoBox b={strip(9, 0, 20, 4)} s={EDGE_STONE} {...end} />
        <IsoBox b={strip(12, 20, 24, 3)} s={{ light: '#f6f2ea', base: '#d6cec2', dark: '#a39b8e' }} courses={false} {...end} />
      </g>
    );
  }
  if (kind === 'hedge') {
    const dots = [0.2, 0.42, 0.64, 0.86].map((u) => {
      const [px, py] = along ? P(x + u * T, y, 22) : P(x, y + u * T, 22);
      return <circle key={u} cx={px} cy={py - 1} r={2.6} fill={EDGE_HEDGE.light} opacity={0.75} />;
    });
    return (
      <g pointerEvents="none">
        <IsoBox b={strip(13, 0, 22, 4)} s={EDGE_HEDGE} courses={false} {...end} />
        {dots}
      </g>
    );
  }
  // Fence: just the rails; posts are shared at the joints (IsoEdgePost).
  return (
    <g pointerEvents="none">
      <IsoBox b={strip(2.6, 8, 11.5, 2)} s={EDGE_WOOD} courses={false} {...end} />
      <IsoBox b={strip(2.6, 17, 20.5, 2)} s={EDGE_WOOD} courses={false} {...end} />
    </g>
  );
}

/** A shared post / pier where edge pieces meet, turn or end. */
export function IsoEdgePost({ vx, vy, kind }: { vx: number; vy: number; kind: 'fence' | 'wall' }) {
  const x = vx * 100;
  const y = vy * 100;
  if (kind === 'wall') {
    return (
      <g pointerEvents="none">
        <IsoBox b={{ x0: x - 8, x1: x + 8, y0: y - 8, y1: y + 8, z0: 0, z1: 27 }} s={EDGE_STONE} />
        <IsoBox b={{ x0: x - 10, x1: x + 10, y0: y - 10, y1: y + 10, z0: 27, z1: 31 }} s={{ light: '#f6f2ea', base: '#d6cec2', dark: '#a39b8e' }} courses={false} />
      </g>
    );
  }
  return (
    <g pointerEvents="none">
      <IsoBox b={{ x0: x - 3, x1: x + 3, y0: y - 3, y1: y + 3, z0: 0, z1: 26 }} s={EDGE_WOOD} courses={false} />
      <IsoBox b={{ x0: x - 3.6, x1: x + 3.6, y0: y - 3.6, y1: y + 3.6, z0: 26, z1: 28 }} s={EDGE_WOOD} courses={false} />
    </g>
  );
}

/** Scaffolding over a footprint while something is being built. */
export function IsoScaffold({
  ox,
  oy,
  size,
  setsRemaining,
  progress = 0,
  height
}: {
  ox: number;
  oy: number;
  size: number;
  setsRemaining: number;
  /** 0–1: how much of the build is done (fills the ring). */
  progress?: number;
  /** Scaffold height; smaller things get a lower one. */
  height?: number;
}) {
  const w = size * 100;
  const h = height ?? (size === 2 ? 90 : 60);
  const b: Box = { x0: ox + 10, y0: oy + 10, x1: ox + w - 10, y1: oy + w - 10, z0: 0, z1: h };
  // Light wooden scaffolding: poles at the corners, rails along the front, a brace.
  const pole = (x: number, y: number, key: string, back = false) => {
    const [x1, y1] = P(x, y, 0);
    const [x2, y2] = P(x, y, h);
    return (
      <g key={key} opacity={back ? 0.55 : 1}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={WOOD.dark} strokeWidth={3.4} strokeLinecap="round" />
        <line x1={x1 - 0.6} y1={y1} x2={x2 - 0.6} y2={y2} stroke={WOOD.light} strokeWidth={1.4} strokeLinecap="round" />
      </g>
    );
  };
  const rail = (z: number, key: string) => (
    <polyline
      key={key}
      points={pts([P(b.x0, b.y1, z), P(b.x1, b.y1, z), P(b.x1, b.y0, z)])}
      fill="none"
      stroke={WOOD.base}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  const brace = pts([P(b.x0, b.y1, 0), P(b.x1, b.y1, h * 0.55)]);
  const [bx, by] = P(b.x1, b.y0, h);
  const r = 12;
  const done = Math.max(0, Math.min(1, progress));
  const circ = 2 * Math.PI * r;
  return (
    <g className="base-scaffold" pointerEvents="none">
      {/* The footprint being built on, softly outlined. */}
      <polygon points={pts([P(ox + 4, oy + 4), P(ox + w - 4, oy + 4), P(ox + w - 4, oy + w - 4), P(ox + 4, oy + w - 4)])} className="base-scaffold-ground" />
      {pole(b.x0, b.y0, 'back', true)}
      {pole(b.x0, b.y1, 'left')}
      {pole(b.x1, b.y0, 'right')}
      {rail(h * 0.5, 'mid')}
      <polyline points={brace} fill="none" stroke={WOOD.dark} strokeWidth={1.8} strokeLinecap="round" opacity={0.85} />
      {pole(b.x1, b.y1, 'front')}
      {rail(h, 'top')}
      {/* Progress: sets left, inside a ring that fills as you train. */}
      <g transform={`translate(${bx} ${by - 6})`}>
        <circle r={r + 3} className="base-scaffold-badge" />
        <circle r={r} className="base-scaffold-track" />
        <circle
          r={r}
          className="base-scaffold-ring"
          strokeDasharray={`${circ * done} ${circ}`}
          transform="rotate(-90)"
        />
        <text y={5.5} textAnchor="middle" className="base-scaffold-count">
          {setsRemaining}
        </text>
      </g>
    </g>
  );
}
