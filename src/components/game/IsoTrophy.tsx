import { getTrophyDef } from '../../game/catalog';
import { themeFor, type Shades } from './BaseArt';
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
// Sculptures: abstract isometric monuments built from the same 3D primitives
// as the buildings (blocks, drums, spheres, beams, crystals), lit the same way:
// light tops, mid-tone front-left faces, darker front-right faces. Their form
// encodes the achievement (taller stacks, more crystals, a ring of 12 pillars).
// ---------------------------------------------------------------------------

type M = Shades;
type V3 = [number, number, number];
const pr = (v: V3) => P(v[0], v[1], v[2]);
const poly = (vs: V3[]) => pts(vs.map(pr));
const EDGE = 0.45;
/** Sculptures are drawn larger than life so they read as monuments on their pedestals. */
const SCULPT_SCALE = 1.55;

function SculptDefs({ gid, m, accent }: { gid: string; m: M; accent: M }) {
  return (
    <defs>
      <linearGradient id={`${gid}-drum`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={m.base} />
        <stop offset="0.35" stopColor={m.light} />
        <stop offset="0.75" stopColor={m.base} />
        <stop offset="1" stopColor={m.dark} />
      </linearGradient>
      <radialGradient id={`${gid}-orb`} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.18" stopColor={accent.light} />
        <stop offset="0.62" stopColor={accent.base} />
        <stop offset="1" stopColor={accent.dark} />
      </radialGradient>
      <linearGradient id={`${gid}-fire`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ff5a1a" />
        <stop offset="0.55" stopColor="#ffb347" />
        <stop offset="1" stopColor="#fff1a8" />
      </linearGradient>
      <radialGradient id={`${gid}-glow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={accent.light} stopOpacity="0.55" />
        <stop offset="1" stopColor={accent.light} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Axis-aligned block: top, front-left (+y) and front-right (+x) faces. */
function Block3({ c, w, d, z0, h, m }: { c: [number, number]; w: number; d: number; z0: number; h: number; m: M }) {
  const [x0, x1, y0, y1, z1] = [c[0] - w / 2, c[0] + w / 2, c[1] - d / 2, c[1] + d / 2, z0 + h];
  return (
    <g stroke={m.dark} strokeWidth={EDGE} strokeLinejoin="round">
      <polygon points={poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]])} fill={m.base} />
      <polygon points={poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]])} fill={m.dark} />
      <polygon points={poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])} fill={m.light} />
    </g>
  );
}

/** Upright drum (cylinder). */
function Drum({ c, r, z0, h, gid, m }: { c: [number, number]; r: number; z0: number; h: number; gid: string; m: M }) {
  const [bx, by] = P(c[0], c[1], z0);
  const [tx, ty] = P(c[0], c[1], z0 + h);
  const rx = r * 0.707;
  const ry = r * 0.354;
  return (
    <g stroke={m.dark} strokeWidth={EDGE}>
      <path
        d={`M${bx - rx} ${by} L${tx - rx} ${ty} L${tx + rx} ${ty} L${bx + rx} ${by} A${rx} ${ry} 0 0 1 ${bx - rx} ${by} Z`}
        fill={`url(#${gid}-drum)`}
      />
      <ellipse cx={tx} cy={ty} rx={rx} ry={ry} fill={m.light} />
    </g>
  );
}

function Orb({ c, z, r, gid, glow = false }: { c: [number, number]; z: number; r: number; gid: string; glow?: boolean }) {
  const [x, y] = P(c[0], c[1], z);
  const sr = r * 0.62;
  return (
    <g>
      {glow && <circle cx={x} cy={y} r={sr * 2.4} fill={`url(#${gid}-glow)`} />}
      <circle cx={x} cy={y} r={sr} fill={`url(#${gid}-orb)`} stroke="rgba(0,0,0,0.35)" strokeWidth={0.5} />
    </g>
  );
}

/** A beam in the x–z plane from a to b (same y), thickness t: top, front and end faces. */
function Beam({ a, b, t, m }: { a: V3; b: V3; t: number; m: M }) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dz) || 1;
  const n: [number, number] = [-dz / len, dx / len];
  const off = (v: V3, dy: number, up: number): V3 => [v[0] + n[0] * up, v[1] + dy, v[2] + n[1] * up];
  const A1 = off(a, t / 2, 0), B0 = off(b, -t / 2, 0), B1 = off(b, t / 2, 0);
  const A0u = off(a, -t / 2, t), A1u = off(a, t / 2, t), B0u = off(b, -t / 2, t), B1u = off(b, t / 2, t);
  return (
    <g stroke={m.dark} strokeWidth={EDGE} strokeLinejoin="round">
      <polygon points={poly([A1, B1, B1u, A1u])} fill={m.base} />
      <polygon points={poly([B0, B1, B1u, B0u])} fill={m.dark} />
      <polygon points={poly([A0u, B0u, B1u, A1u])} fill={m.light} />
    </g>
  );
}

/** A crystal shard: a stretched square bipyramid. Burns in fire colours when lit. */
function Shard({ c, w, z0, h, m, gid, lit }: { c: [number, number]; w: number; z0: number; h: number; m: M; gid: string; lit: boolean }) {
  const [cx, cy] = c;
  const mid = z0 + h * 0.3;
  const top: V3 = [cx, cy, z0 + h];
  const bot: V3 = [cx, cy, z0];
  const S: V3 = [cx - w, cy + w, mid];
  const E: V3 = [cx + w, cy + w, mid];
  const F: V3 = [cx + w, cy - w, mid];
  const fills = lit
    ? { a: `url(#${gid}-fire)`, b: '#ff8a3d', c: '#e85520', d: '#c2410c' }
    : { a: m.light, b: m.base, c: m.dark, d: m.dark };
  return (
    <g stroke={lit ? '#9a3412' : m.dark} strokeWidth={EDGE} strokeLinejoin="round" className={lit ? 'base-flame' : undefined}>
      <polygon points={poly([bot, S, E])} fill={fills.c} />
      <polygon points={poly([bot, E, F])} fill={fills.d} />
      <polygon points={poly([top, S, E])} fill={fills.a} />
      <polygon points={poly([top, E, F])} fill={fills.b} />
    </g>
  );
}

/** A cut gem (octahedron) in the accent colour, with a glint. */
function Gem({ c, z, r, accent }: { c: [number, number]; z: number; r: number; accent: M }) {
  const [cx, cy] = c;
  const top: V3 = [cx, cy, z + r * 1.3];
  const bot: V3 = [cx, cy, z - r * 1.3];
  const S: V3 = [cx - r, cy + r, z];
  const E: V3 = [cx + r, cy + r, z];
  const F: V3 = [cx + r, cy - r, z];
  const [gx, gy] = P(cx - r * 0.3, cy + r * 0.3, z + r * 0.6);
  return (
    <g stroke={accent.dark} strokeWidth={EDGE} strokeLinejoin="round">
      <polygon points={poly([bot, S, E])} fill={accent.base} />
      <polygon points={poly([bot, E, F])} fill={accent.dark} />
      <polygon points={poly([top, S, E])} fill={accent.light} />
      <polygon points={poly([top, E, F])} fill={accent.base} />
      <path d={`M${gx - 2.4} ${gy} L${gx} ${gy - 2.4} L${gx + 2.4} ${gy} L${gx} ${gy + 2.4} Z`} fill="#ffffff" stroke="none" opacity={0.9} className="base-sparkle" />
    </g>
  );
}

/** A ring lying flat (xy plane) or a halo. */
function Ring({ c, r, z, m, width = 1.6 }: { c: [number, number]; r: number; z: number; m: M; width?: number }) {
  const [x, y] = P(c[0], c[1], z);
  return (
    <g fill="none">
      <ellipse cx={x} cy={y} rx={r * 0.707} ry={r * 0.354} stroke={m.dark} strokeWidth={width + 1.2} />
      <ellipse cx={x} cy={y} rx={r * 0.707} ry={r * 0.354} stroke={m.light} strokeWidth={width} />
    </g>
  );
}

/** A disc standing upright in the x–z plane (facing the front-left), e.g. a weight plate or the sun. */
function UprightDisc({ c, zc, r, thick, m, hole = 0, half = false }: { c: [number, number]; zc: number; r: number; thick: number; m: M; hole?: number; half?: boolean }) {
  const ring = (y: number, rad: number) =>
    Array.from({ length: 33 }, (_, i) => {
      const a = half ? Math.PI * (i / 32) : (Math.PI * 2 * i) / 32;
      return [c[0] + Math.cos(a) * rad, y, zc + Math.sin(a) * rad] as V3;
    });
  const back = ring(c[1] - thick / 2, r);
  const front = ring(c[1] + thick / 2, r);
  return (
    <g stroke={m.dark} strokeWidth={EDGE} strokeLinejoin="round">
      <polygon points={poly(back)} fill={m.dark} />
      {/* rim: join front and back outlines */}
      {front.slice(0, -1).map((v, i) => (
        <polygon key={i} points={poly([back[i], back[i + 1], front[i + 1], v])} fill={m.base} stroke="none" />
      ))}
      <polygon points={poly(front)} fill={m.light} />
      {hole > 0 && <polygon points={poly(ring(c[1] + thick / 2, hole))} fill={m.dark} />}
      {!half && <polygon points={poly(ring(c[1] + thick / 2 + 0.01, r * 0.72))} fill="none" stroke={m.base} strokeWidth={0.9} />}
    </g>
  );
}

function Pyramid4({ c, w, z0, h, m }: { c: [number, number]; w: number; z0: number; h: number; m: M }) {
  const [cx, cy] = c;
  const top: V3 = [cx, cy, z0 + h];
  return (
    <g stroke={m.dark} strokeWidth={EDGE} strokeLinejoin="round">
      <polygon points={poly([[cx - w, cy + w, z0], [cx + w, cy + w, z0], top])} fill={m.base} />
      <polygon points={poly([[cx + w, cy + w, z0], [cx + w, cy - w, z0], top])} fill={m.dark} />
    </g>
  );
}

function Sculpture({ id, c, z, m, accent, gid, lit }: { id: string; c: [number, number]; z: number; m: M; accent: M; gid: string; lit: boolean }) {
  const [cx, cy] = c;
  const at = (dx: number, dy: number): [number, number] => [cx + dx, cy + dy];
  const plates = (radii: number[]) => {
    let zz = z;
    return radii.map((r, i) => {
      const el = <Drum key={i} c={c} r={r} z0={zz} h={5} gid={gid} m={m} />;
      zz += 6;
      return el;
    });
  };
  switch (id) {
    // Sets: a growing stack of weight plates, crowned with a jewel.
    case 'first-set':
      return (
        <g>
          {plates([16])}
          <Orb c={c} z={z + 12} r={7} gid={gid} />
        </g>
      );
    case 'sets-50':
      return (
        <g>
          {plates([17, 14, 11])}
          <Orb c={c} z={z + 24} r={7} gid={gid} />
        </g>
      );
    case 'sets-250':
      return (
        <g>
          <Ring c={c} r={16} z={z} m={m} />
          {plates([18, 16, 14, 12, 10])}
          <Gem c={c} z={z + 44} r={8} accent={accent} />
        </g>
      );
    // Streaks: crystal flames that multiply and grow; fire-lit on training days.
    case 'streak-3':
      return <Shard c={c} w={7} z0={z} h={40} m={m} gid={gid} lit={lit} />;
    case 'streak-7':
      return (
        <g>
          <Shard c={at(8, -7)} w={5} z0={z} h={26} m={m} gid={gid} lit={lit} />
          <Shard c={c} w={8} z0={z} h={50} m={m} gid={gid} lit={lit} />
        </g>
      );
    case 'streak-30':
      return (
        <g>
          <Ring c={c} r={16} z={z} m={m} />
          <Shard c={at(9, -8)} w={5} z0={z} h={30} m={m} gid={gid} lit={lit} />
          <Shard c={c} w={9} z0={z} h={58} m={m} gid={gid} lit={lit} />
          <Shard c={at(-10, 8)} w={6} z0={z} h={34} m={m} gid={gid} lit={lit} />
        </g>
      );
    case 'streak-100':
      return (
        <g>
          <Ring c={c} r={16} z={z} m={m} />
          <Shard c={at(10, -9)} w={5} z0={z} h={32} m={m} gid={gid} lit={lit} />
          <Shard c={at(-11, -4)} w={5} z0={z} h={28} m={m} gid={gid} lit={lit} />
          <Shard c={c} w={10} z0={z} h={66} m={m} gid={gid} lit={lit} />
          <Shard c={at(11, 6)} w={5} z0={z} h={30} m={m} gid={gid} lit={lit} />
          <Shard c={at(-9, 10)} w={6} z0={z} h={38} m={m} gid={gid} lit={lit} />
          <Ring c={c} r={13} z={z + 80} m={m} width={2.2} />
        </g>
      );
    // Pushups: the plank, a rising beam on a pillar.
    case 'pushups-30':
      return (
        <g>
          <Block3 c={at(12, 0)} w={6} d={6} z0={z} h={20} m={m} />
          <Beam a={[cx - 22, cy, z]} b={[cx + 16, cy, z + 22]} t={6} m={m} />
        </g>
      );
    case 'pushups-50':
      return (
        <g>
          <Ring c={c} r={16} z={z} m={m} />
          <Block3 c={at(12, 0)} w={6} d={6} z0={z} h={20} m={m} />
          <Beam a={[cx - 22, cy, z]} b={[cx + 16, cy, z + 22]} t={6} m={m} />
          <Orb c={at(22, 0)} z={z + 32} r={7} gid={gid} />
        </g>
      );
    // Pull-up: the gate, a sphere risen above the bar.
    case 'first-pull-up':
      return (
        <g>
          <Block3 c={at(-14, 0)} w={5} d={5} z0={z} h={46} m={m} />
          <Block3 c={at(14, 0)} w={5} d={5} z0={z} h={46} m={m} />
          <Block3 c={c} w={34} d={5} z0={z + 46} h={5} m={m} />
          <Orb c={c} z={z + 61} r={8} gid={gid} glow />
        </g>
      );
    // Pistol squat: the cantilever, a column holding a long arm out in balance.
    case 'first-pistol':
      return (
        <g>
          <Block3 c={at(-8, 0)} w={8} d={8} z0={z} h={30} m={m} />
          <Beam a={[cx - 8, cy, z + 30]} b={[cx + 26, cy, z + 30]} t={5} m={m} />
          <Block3 c={at(24, 0)} w={6} d={6} z0={z + 35} h={6} m={m} />
          <Orb c={at(-8, 0)} z={z + 42} r={7} gid={gid} />
        </g>
      );
    // First loaded set: a weight plate standing on its edge in a cradle.
    case 'first-loaded':
      return (
        <g>
          <Block3 c={c} w={22} d={10} z0={z} h={3} m={m} />
          <UprightDisc c={c} zc={z + 19} r={16} thick={5} m={m} hole={3.4} />
        </g>
      );
    // First elite move: a hovering cut gem.
    case 'first-elite':
      return (
        <g>
          <Drum c={c} r={8} z0={z} h={4} gid={gid} m={m} />
          <circle cx={P(cx, cy, z + 4)[0]} cy={P(cx, cy, z + 4)[1]} r={9} fill={`url(#${gid}-glow)`} />
          <g className="statue-hover">
            <Gem c={c} z={z + 26} r={11} accent={accent} />
          </g>
        </g>
      );
    // Balanced week: a beam balanced on a fulcrum with two equal spheres.
    case 'balanced-week':
      return (
        <g>
          <Orb c={at(-22, 0)} z={z + 28} r={6.5} gid={gid} />
          <Pyramid4 c={c} w={8} z0={z} h={20} m={m} />
          <Beam a={[cx - 24, cy, z + 20]} b={[cx + 24, cy, z + 20]} t={4} m={m} />
          <Orb c={at(22, 0)} z={z + 28} r={6.5} gid={gid} />
        </g>
      );
    // First session: sunrise, a half sun rising from a block.
    case 'first-session':
      return (
        <g>
          {/* Rays fan out behind the rising sun. */}
          {Array.from({ length: 7 }, (_, i) => {
            const ang = (Math.PI * (i + 0.5)) / 7;
            const from = pr([cx + Math.cos(ang) * 17, cy - 1, z + 6 + Math.sin(ang) * 17]);
            const to = pr([cx + Math.cos(ang) * 25, cy - 1, z + 6 + Math.sin(ang) * 25]);
            return (
              <g key={i} strokeLinecap="round">
                <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={m.dark} strokeWidth={2.6} />
                <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={m.light} strokeWidth={1.4} />
              </g>
            );
          })}
          <UprightDisc c={c} zc={z + 6} r={15} thick={4} m={accent} half />
          <Block3 c={c} w={34} d={10} z0={z} h={6} m={m} />
        </g>
      );
    // First week: seven rising steps.
    case 'first-week':
      return (
        <g>
          {/* Climbs away from the viewer, so every step is visible. */}
          {Array.from({ length: 7 }, (_, i) => (
            <Block3 key={i} c={at(-18 + i * 6, 0)} w={6} d={14} z0={z} h={4 + (6 - i) * 6} m={m} />
          ))}
          <Orb c={at(-18, 0)} z={z + 47} r={5} gid={gid} />
        </g>
      );
    // Four weeks: four stacked drums, like an endless column.
    case 'weeks-4':
      return (
        <g>
          {[14, 11, 8, 5].map((r, i) => (
            <g key={i}>
              {i > 0 && <Drum c={c} r={3.5} z0={z + i * 12 - 4} h={4} gid={gid} m={m} />}
              <Drum c={c} r={r} z0={z + i * 12} h={8} gid={gid} m={m} />
            </g>
          ))}
          <Gem c={c} z={z + 56} r={5} accent={accent} />
        </g>
      );
    // Twelve weeks: a ring of twelve pillars around a spire.
    case 'weeks-12': {
      const ring = Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 12;
        return { x: cx + Math.cos(a) * 22, y: cy + Math.sin(a) * 22 };
      });
      const back = ring.filter((p) => p.x + p.y < cx + cy);
      const front = ring.filter((p) => p.x + p.y >= cx + cy);
      const pillar = (p: { x: number; y: number }, i: number) => <Block3 key={i} c={[p.x, p.y]} w={4} d={4} z0={z} h={16} m={m} />;
      return (
        <g>
          {back.sort((a, b) => a.x + a.y - (b.x + b.y)).map(pillar)}
          <Drum c={c} r={6} z0={z} h={44} gid={gid} m={m} />
          <Gem c={c} z={z + 56} r={7} accent={accent} />
          {front.sort((a, b) => a.x + a.y - (b.x + b.y)).map(pillar)}
        </g>
      );
    }
    default:
      return (
        <g>
          {plates([16])}
          <Orb c={c} z={z + 12} r={7} gid={gid} />
        </g>
      );
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
  // Gradient ids include the accent so differently coloured trophies don't share jewels.
  const gid = `trophy-${tierKey}-${(color ?? 'base').replace(/[^a-z0-9]/gi, '')}`;
  const accent = color ? themeFor('trophy', color) : { light: '#ff8fa3', base: '#e5484d', dark: '#9c2a33' };
  const h = 30;
  const [sx, sy] = P(ox + 50, oy + 50, h + 5);
  const [vx, vy] = P(ox + 74, oy + 40, h * 0.55);
  return (
    <g>
      <ellipse cx={P(ox + 50, oy + 50)[0] + 4} cy={P(ox + 50, oy + 50)[1] + 3} rx={30} ry={11} fill="url(#hf-shadow)" />
      <Pedestal ox={ox} oy={oy} h={h} tier={tier} number={NUMBER[trophyId] ?? ''} accent={accent} />
      <SculptDefs gid={gid} m={tier} accent={accent} />
      <ellipse cx={sx} cy={sy + 1} rx={20} ry={7.5} fill="#000" opacity={0.18} />
      {/* The projection is linear, so scaling around the base keeps the iso geometry exact. */}
      <g transform={`translate(${sx} ${sy}) scale(${SCULPT_SCALE}) translate(${-sx} ${-sy})`}>
        <Sculpture id={trophyId} c={[ox + 50, oy + 50]} z={h + 5} m={tier} accent={accent} gid={gid} lit={lit} />
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
