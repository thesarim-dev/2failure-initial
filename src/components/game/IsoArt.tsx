import type { ReactNode } from 'react';
import type { PlacedItem, TodayPlan } from '../../game/engine';
import {
  FIRE,
  GLASS,
  GRASS,
  METAL,
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
// Buildings (ox, oy = the footprint's top corner in world units)
// ---------------------------------------------------------------------------

function Headquarters({ ox, oy, level, lit, s, m, decoration }: IsoProps) {
  const x0 = ox + 26;
  const y0 = oy + 26;
  const x1 = ox + 174;
  const y1 = oy + 174;
  if (level >= 3) {
    const body: Box = { x0, y0, x1, y1, z0: 0, z1: 120 };
    const glassS: Shades = { light: GLASS.light, base: GLASS.base, dark: GLASS.dark };
    return (
      <g>
        <IsoShadow x0={x0} y0={y0} x1={x1} y1={y1} />
        <IsoBox b={body} s={m.metal} />
        <polygon points={leftQuad(body, 0.08, 0.92, 0.15, 0.85)} fill={glassS.base} opacity={0.85} className={lit ? 'base-light is-lit' : undefined} />
        <polygon points={rightQuad(body, 0.1, 0.9, 0.15, 0.85)} fill={glassS.dark} opacity={0.85} />
        <IsoDoor points={leftQuad(body, 0.42, 0.58, 0, 0.32)} />
        <IsoBox b={{ x0: x0 - 6, y0: y0 - 6, x1: x1 + 6, y1: y1 + 6, z0: 120, z1: 128 }} s={s} courses={false} />
        <IsoBox b={{ x0: ox + 80, y0: oy + 80, x1: ox + 120, y1: oy + 120, z0: 128, z1: 168 }} s={m.metal} />
        <Beacon at={P(ox + 100, oy + 100, 200)} s={s} lit={lit} r={6} />
        <line x1={P(ox + 100, oy + 100, 168)[0]} y1={P(ox + 100, oy + 100, 168)[1]} x2={P(ox + 100, oy + 100, 195)[0]} y2={P(ox + 100, oy + 100, 195)[1]} stroke={METAL.dark} strokeWidth={2.5} />
        <IsoDecorations kind={decoration} b={body} s={s} lit={lit} />
      </g>
    );
  }
  const big = level >= 2;
  const body: Box = { x0, y0, x1, y1, z0: 0, z1: big ? 92 : 78 };
  const towerH = big ? 130 : 104;
  const towers: Box[] = [
    { x0: ox + 10, y0: oy + 142, x1: ox + 52, y1: oy + 184, z0: 0, z1: towerH },
    { x0: ox + 142, y0: oy + 10, x1: ox + 184, y1: oy + 52, z0: 0, z1: towerH }
  ];
  return (
    <g>
      <IsoShadow x0={ox + 10} y0={oy + 10} x1={ox + 184} y1={oy + 184} />
      <IsoBox b={body} s={m.stone} />
      <GableRoof x0={x0} y0={y0} x1={x1} y1={y1} z={body.z1} rise={54} o={8} s={s} wall={m.stone} />
      <IsoDoor points={leftQuad(body, 0.4, 0.6, 0, 0.42)} />
      <IsoWindow points={leftQuad(body, 0.12, 0.26, 0.5, 0.75)} lit={lit} />
      <IsoWindow points={leftQuad(body, 0.74, 0.88, 0.5, 0.75)} lit={lit} />
      <IsoWindow points={rightQuad(body, 0.4, 0.6, 0.5, 0.75)} lit={lit} />
      <IsoDecorations kind={decoration} b={body} s={s} lit={lit} />
      {towers.map((t, i) => (
        <g key={i}>
          <IsoBox b={t} s={m.stone} />
          <IsoWindow points={leftQuad(t, 0.3, 0.7, 0.55, 0.78)} lit={lit} />
          {big ? (
            <PyramidRoof x0={t.x0} y0={t.y0} x1={t.x1} y1={t.y1} z={towerH} rise={42} o={5} s={s} />
          ) : (
            <IsoBox b={{ x0: t.x0 - 4, y0: t.y0 - 4, x1: t.x1 + 4, y1: t.y1 + 4, z0: towerH, z1: towerH + 8 }} s={m.stone} courses={false} />
          )}
        </g>
      ))}
      {big && <Flag at={P(ox + 100, oy + 100, body.z1 + 54)} s={s} h={30} />}
    </g>
  );
}

function Watchtower({ ox, oy, level, lit, s, m, decoration }: IsoProps) {
  if (level >= 3) {
    const pillar: Box = { x0: ox + 40, y0: oy + 40, x1: ox + 60, y1: oy + 60, z0: 0, z1: 100 };
    const cabin: Box = { x0: ox + 20, y0: oy + 20, x1: ox + 80, y1: oy + 80, z0: 100, z1: 134 };
    return (
      <g>
        <IsoShadow x0={ox + 22} y0={oy + 22} x1={ox + 78} y1={oy + 78} />
        <IsoBox b={pillar} s={m.metal} />
        <IsoBox b={cabin} s={m.metal} courses={false} />
        <polygon points={leftQuad(cabin, 0.08, 0.92, 0.18, 0.86)} fill={GLASS.base} className={lit ? 'base-light is-lit' : undefined} />
        <polygon points={rightQuad(cabin, 0.08, 0.92, 0.18, 0.86)} fill={GLASS.dark} />
        <IsoBox b={{ x0: ox + 14, y0: oy + 14, x1: ox + 86, y1: oy + 86, z0: 134, z1: 140 }} s={s} courses={false} />
        <Beacon at={P(ox + 50, oy + 50, 170)} s={s} lit={lit} />
        <IsoDecorations kind={decoration} b={cabin} s={s} lit={lit} />
      </g>
    );
  }
  const tall = level >= 2;
  const body: Box = { x0: ox + 28, y0: oy + 28, x1: ox + 72, y1: oy + 72, z0: 0, z1: tall ? 112 : 92 };
  const deck: Box = { x0: ox + 18, y0: oy + 18, x1: ox + 82, y1: oy + 82, z0: body.z1, z1: body.z1 + 14 };
  return (
    <g>
      <IsoShadow x0={ox + 26} y0={oy + 26} x1={ox + 74} y1={oy + 74} />
      <IsoBox b={body} s={m.stone} />
      <IsoWindow points={leftQuad(body, 0.3, 0.7, 0.5, 0.7)} lit={lit} />
      {tall && <IsoWindow points={rightQuad(body, 0.3, 0.7, 0.5, 0.7)} lit={lit} />}
      <IsoDoor points={leftQuad(body, 0.32, 0.68, 0, 0.26)} />
      <IsoDecorations kind={decoration} b={body} s={s} lit={lit} />
      <IsoBox b={deck} s={m.stone} courses={false} />
      <PyramidRoof x0={deck.x0} y0={deck.y0} x1={deck.x1} y1={deck.y1} z={deck.z1} rise={tall ? 46 : 38} o={4} s={s} />
      {tall && <Flag at={P(ox + 50, oy + 50, deck.z1 + 46)} s={s} h={24} />}
    </g>
  );
}

function Lodge({ ox, oy, level, lit, s, m, decoration }: IsoProps) {
  const b: Box = { x0: ox + 14, y0: oy + 22, x1: ox + 86, y1: oy + 84, z0: 0, z1: level >= 2 ? 50 : 44 };
  if (level >= 3) {
    return (
      <g>
        <IsoShadow x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} />
        <IsoBox b={{ ...b, z1: 58 }} s={m.wood} />
        <polygon points={leftQuad({ ...b, z1: 58 }, 0.08, 0.62, 0.12, 0.88)} fill={GLASS.base} opacity={0.9} className={lit ? 'base-light is-lit' : undefined} />
        <IsoDoor points={leftQuad({ ...b, z1: 58 }, 0.7, 0.88, 0, 0.62)} />
        <IsoBox b={{ x0: b.x0 - 6, y0: b.y0 - 6, x1: b.x1 + 6, y1: b.y1 + 6, z0: 58, z1: 64 }} s={s} courses={false} />
        {[0.2, 0.55].map((u) => (
          <polygon key={u} points={pts([P(b.x0 + 72 * u, b.y0 + 8, 66), P(b.x0 + 72 * u + 22, b.y0 + 8, 66), P(b.x0 + 72 * u + 22, b.y0 + 40, 66), P(b.x0 + 72 * u, b.y0 + 40, 66)])} fill="#1d3557" stroke={METAL.light} strokeWidth={0.8} />
        ))}
        <IsoDecorations kind={decoration} b={{ ...b, z1: 58 }} s={s} lit={lit} />
      </g>
    );
  }
  return (
    <g>
      <IsoShadow x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} />
      {level >= 2 && <IsoBox b={{ x0: b.x0 - 4, y0: b.y1, x1: b.x1 + 4, y1: b.y1 + 12, z0: 0, z1: 4 }} s={m.wood} courses={false} />}
      <IsoBox b={b} s={m.wood} />
      <IsoDoor points={leftQuad(b, 0.42, 0.6, 0, 0.62)} />
      <IsoWindow points={leftQuad(b, 0.12, 0.3, 0.38, 0.68)} lit={lit} />
      {level >= 2 && <IsoWindow points={leftQuad(b, 0.72, 0.9, 0.38, 0.68)} lit={lit} />}
      <IsoWindow points={rightQuad(b, 0.35, 0.65, 0.38, 0.68)} lit={lit} />
      <IsoDecorations kind={decoration} b={b} s={s} lit={lit} />
      <GableRoof x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} z={b.z1} rise={36} o={6} s={s} wall={m.wood} />
      {level >= 2 && <IsoBox b={{ x0: ox + 62, y0: oy + 34, x1: ox + 74, y1: oy + 46, z0: b.z1 + 10, z1: b.z1 + 42 }} s={m.stone} courses={false} />}
    </g>
  );
}

function Forge({ ox, oy, level, lit, s, m, decoration }: IsoProps) {
  const b: Box = { x0: ox + 12, y0: oy + 18, x1: ox + 88, y1: oy + 86, z0: 0, z1: 46 };
  const furnace = (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      <polygon points={leftQuad(b, 0.36, 0.64, 0, 0.6)} fill="#2a1a12" />
      <polygon points={leftQuad(b, 0.4, 0.6, 0, 0.48)} fill={lit ? FIRE : '#5a3020'} className={lit ? 'base-flame' : undefined} />
    </g>
  );
  if (level >= 3) {
    return (
      <g>
        <IsoShadow x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} />
        <IsoBox b={b} s={m.metal} />
        {furnace}
        {[0, 1, 2].map((i) => {
          const sx0 = b.x0 + i * 25;
          return <GableRoof key={i} x0={sx0} y0={b.y0} x1={sx0 + 25} y1={b.y1} z={46} rise={16} o={1} s={s} wall={m.metal} />;
        })}
        {[0.2, 0.8].map((u) => (
          <polygon key={u} points={rightQuad(b, u - 0.1, u + 0.1, 0.4, 0.75)} fill={lit ? s.light : s.dark} className={lit ? 'base-light is-lit' : undefined} />
        ))}
        <IsoDecorations kind={decoration} b={b} s={s} lit={lit} />
      </g>
    );
  }
  const big = level >= 2;
  return (
    <g>
      <IsoShadow x0={b.x0} y0={b.y0} x1={b.x1} y1={b.y1} />
      <IsoBox b={b} s={m.stone} />
      {furnace}
      <IsoDecorations kind={decoration} b={b} s={s} lit={lit} />
      <IsoBox b={{ x0: b.x0 - 4, y0: b.y0 - 4, x1: b.x1 + 4, y1: b.y1 + 4, z0: 46, z1: 54 }} s={s} courses={false} />
      <IsoBox b={{ x0: ox + 60, y0: oy + 26, x1: ox + 78, y1: oy + 44, z0: 54, z1: big ? 112 : 92 }} s={m.stone} />
      {big && lit && (
        <g opacity={0.55} className="base-smoke">
          <circle cx={P(ox + 69, oy + 35, 124)[0]} cy={P(ox + 69, oy + 35, 124)[1]} r={5} fill="#c9ced6" />
          <circle cx={P(ox + 69, oy + 35, 140)[0] + 6} cy={P(ox + 69, oy + 35, 140)[1]} r={3.5} fill="#c9ced6" />
        </g>
      )}
      {big && <IsoBox b={{ x0: ox + 20, y0: oy + 88, x1: ox + 36, y1: oy + 96, z0: 0, z1: 10 }} s={METAL} courses={false} />}
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
  const [wx, wy] = P(cx, cy, 14);
  return (
    <g>
      <IsoShadow x0={ox + 14} y0={oy + 14} x1={ox + 86} y1={oy + 86} />
      <IsoCylinder cx={cx} cy={cy} r={44} z0={0} z1={14} s={m.stone} />
      <ellipse cx={wx} cy={wy} rx={44 * 0.707 - 5} ry={44 * 0.354 - 3} fill={s.dark} />
      <ellipse cx={wx} cy={wy + 1} rx={44 * 0.707 - 8} ry={44 * 0.354 - 5} fill={s.base} className={lit ? 'base-light is-lit' : undefined} />
      <ellipse cx={wx - 6} cy={wy - 1} rx={8} ry={2.5} fill={s.light} opacity={0.75} />
      <Crystal at={P(cx, cy, 16)} h={level >= 2 ? 46 : 34} s={s} />
      {level >= 2 && <Crystal at={P(cx - 18, cy + 8, 16)} h={26} s={s} />}
      {level >= 2 && <Crystal at={P(cx + 10, cy - 16, 16)} h={22} s={s} />}
      {level >= 3 && (
        <g>
          {[
            [ox + 14, oy + 14],
            [ox + 86, oy + 14],
            [ox + 86, oy + 86],
            [ox + 14, oy + 86]
          ].map(([x, y]) => (
            <IsoBox key={`${x}${y}`} b={{ x0: x - 4, y0: y - 4, x1: x + 4, y1: y + 4, z0: 0, z1: 96 }} s={m.stone} courses={false} />
          ))}
          <IsoBox b={{ x0: ox + 6, y0: oy + 6, x1: ox + 94, y1: oy + 94, z0: 96, z1: 103 }} s={s} courses={false} />
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

/** Which items are drawn as true isometric models. */
export const ISO_ITEMS = new Set(['hq', 'watchtower', 'lodge', 'forge', 'spring', 'yard', 'wall']);

/**
 * Draw an isometric model for a placed item at (ox, oy) = its footprint's
 * top corner in world units.
 */
export function IsoItemArt({
  item,
  ox,
  oy,
  lit,
  plan
}: {
  item: PlacedItem;
  ox: number;
  oy: number;
  lit: boolean;
  plan?: TodayPlan | null;
}): ReactNode {
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
