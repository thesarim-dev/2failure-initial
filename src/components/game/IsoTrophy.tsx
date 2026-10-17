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
const SCULPT_SCALE = 1.4;

function SculptDefs({ gid, m, accent }: { gid: string; m: M; accent: M }) {
  return (
    <defs>
      <linearGradient id={`${gid}-drum`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={m.base} />
        <stop offset="0.35" stopColor={m.light} />
        <stop offset="0.75" stopColor={m.base} />
        <stop offset="1" stopColor={m.dark} />
      </linearGradient>
      <linearGradient id={`${gid}-stone`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#cdc6bc" />
        <stop offset="0.35" stopColor="#efebe5" />
        <stop offset="0.75" stopColor="#cdc6bc" />
        <stop offset="1" stopColor="#9c948a" />
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
function Drum({ c, r, z0, h, gid, m, grad = 'drum' }: { c: [number, number]; r: number; z0: number; h: number; gid: string; m: M; grad?: 'drum' | 'stone' }) {
  const [bx, by] = P(c[0], c[1], z0);
  const [tx, ty] = P(c[0], c[1], z0 + h);
  const rx = r * 0.707;
  const ry = r * 0.354;
  return (
    <g stroke={m.dark} strokeWidth={EDGE}>
      <path
        d={`M${bx - rx} ${by} L${tx - rx} ${ty} L${tx + rx} ${ty} L${bx + rx} ${by} A${rx} ${ry} 0 0 1 ${bx - rx} ${by} Z`}
        fill={`url(#${gid}-${grad})`}
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


/** Granite for monuments; the tier metal is used for caps, emblems and bands. */
const GRANITE: M = { light: '#efebe5', base: '#cdc6bc', dark: '#9c948a' };

/** A tapered square shaft (obelisk body) with a metal pyramidion cap. */
function Obelisk({ c, w0, w1, z0, h, cap, m, bands = [] }: { c: [number, number]; w0: number; w1: number; z0: number; h: number; cap: number; m: M; bands?: number[] }) {
  const [cx, cy] = c;
  const z1 = z0 + h;
  const at = (w: number, z: number) => ({
    fl: [cx - w, cy + w, z] as V3, // front-left corner
    fr: [cx + w, cy + w, z] as V3, // front corner
    br: [cx + w, cy - w, z] as V3 // right corner
  });
  const b = at(w0, z0);
  const t = at(w1, z1);
  const apex: V3 = [cx, cy, z1 + cap];
  const bandAt = (frac: number) => {
    const z = z0 + h * frac;
    const w = w0 + (w1 - w0) * frac;
    const k = at(w, z);
    const k2 = at(w, z + 2.4);
    return (
      <g key={frac}>
        <polygon points={poly([k.fl, k.fr, k2.fr, k2.fl])} fill={m.base} stroke={m.dark} strokeWidth={EDGE} />
        <polygon points={poly([k.fr, k.br, k2.br, k2.fr])} fill={m.dark} stroke={m.dark} strokeWidth={EDGE} />
      </g>
    );
  };
  return (
    <g strokeLinejoin="round">
      <polygon points={poly([b.fl, b.fr, t.fr, t.fl])} fill={GRANITE.base} stroke={GRANITE.dark} strokeWidth={EDGE} />
      <polygon points={poly([b.fr, b.br, t.br, t.fr])} fill={GRANITE.dark} stroke={GRANITE.dark} strokeWidth={EDGE} />
      {/* a sunlit edge down the front corner */}
      <line x1={pr(b.fr)[0]} y1={pr(b.fr)[1]} x2={pr(t.fr)[0]} y2={pr(t.fr)[1]} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={0.8} />
      {bands.map(bandAt)}
      <polygon points={poly([t.fl, t.fr, apex])} fill={m.light} stroke={m.dark} strokeWidth={EDGE} />
      <polygon points={poly([t.fr, t.br, apex])} fill={m.base} stroke={m.dark} strokeWidth={EDGE} />
    </g>
  );
}

/** A flame drawn upright at a point, burning bright when lit, embers when not. */
function FireAt({ at, size, lit, gid }: { at: V3; size: number; lit: boolean; gid: string }) {
  const [x, y] = pr(at);
  const s = size;
  return (
    <g>
      {lit && <circle cx={x} cy={y - s * 0.9} r={s * 1.6} fill="#ff9a2e" opacity={0.2} />}
      <g className={lit ? 'base-flame' : undefined} opacity={lit ? 1 : 0.55}>
        <path
          d={`M${x} ${y - s * 2.2} C ${x + s * 0.9} ${y - s * 1.4}, ${x + s * 0.95} ${y - s * 0.5}, ${x} ${y} C ${x - s * 0.95} ${y - s * 0.5}, ${x - s * 0.9} ${y - s * 1.4}, ${x} ${y - s * 2.2} Z`}
          fill={lit ? `url(#${gid}-fire)` : '#8a4a28'}
          stroke={lit ? '#c2410c' : '#5a2d16'}
          strokeWidth={0.5}
        />
        <path
          d={`M${x} ${y - s * 1.2} C ${x + s * 0.45} ${y - s * 0.75}, ${x + s * 0.4} ${y - s * 0.25}, ${x} ${y - s * 0.05} C ${x - s * 0.4} ${y - s * 0.25}, ${x - s * 0.45} ${y - s * 0.75}, ${x} ${y - s * 1.2} Z`}
          fill={lit ? '#fff4c2' : '#c06a34'}
        />
      </g>
    </g>
  );
}

/** A fire bowl on top of a pillar/tower at height z. */
function FireBowl({ c, z, r, m, gid, lit, flame }: { c: [number, number]; z: number; r: number; m: M; gid: string; lit: boolean; flame: number }) {
  const [x, y] = P(c[0], c[1], z);
  const rx = r * 0.707;
  const ry = r * 0.354;
  return (
    <g>
      <path d={`M${x - rx} ${y} Q ${x} ${y + ry * 4.2}, ${x + rx} ${y} Z`} fill={`url(#${gid}-drum)`} stroke={m.dark} strokeWidth={EDGE} />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#3a2214" stroke={m.dark} strokeWidth={EDGE} />
      <FireAt at={[c[0], c[1], z + 1]} size={flame} lit={lit} gid={gid} />
    </g>
  );
}

/** Olympic-style pictograms (Otl Aicher), in face coordinates: u ∈ [-1, 1] across, v ∈ [0, 1] up. */
const PICTOGRAMS: Record<string, { lines: Array<Array<[number, number]>>; head: [number, number] }> = {
  pushup: {
    lines: [
      [[-0.62, 0.22], [0.42, 0.42]],
      [[0.36, 0.41], [0.42, 0.14]],
      [[-0.85, 0.1], [0.85, 0.1]]
    ],
    head: [0.6, 0.5]
  },
  pullup: {
    lines: [
      [[-0.75, 0.9], [0.75, 0.9]],
      [[-0.28, 0.9], [-0.16, 0.66]],
      [[0.28, 0.9], [0.16, 0.66]],
      [[0, 0.64], [0, 0.36]],
      [[0, 0.36], [-0.14, 0.12]],
      [[0, 0.36], [0.14, 0.12]]
    ],
    head: [0, 0.8]
  },
  pistol: {
    lines: [
      [[-0.1, 0.62], [-0.18, 0.4]],
      [[-0.1, 0.58], [0.5, 0.58]],
      [[-0.18, 0.4], [0.62, 0.42]],
      [[-0.18, 0.4], [0.1, 0.26]],
      [[0.1, 0.26], [-0.08, 0.1]]
    ],
    head: [-0.02, 0.76]
  }
};

/** An engraved stone tablet with an inlaid metal pictogram on its front face. */
function Stele({ c, w, z0, h, m, glyph, frame = false }: { c: [number, number]; w: number; z0: number; h: number; m: M; glyph: keyof typeof PICTOGRAMS; frame?: boolean }) {
  const [cx, cy] = c;
  const d = 5;
  const faceY = cy + d / 2;
  const toFace = (u: number, v: number): [number, number] =>
    pr([cx + u * (w / 2 - 3), faceY + 0.01, z0 + 4 + v * (h - 10)]);
  const g = PICTOGRAMS[glyph];
  const path = (pts2: Array<[number, number]>) => pts2.map(([u, v], i) => `${i ? 'L' : 'M'}${toFace(u, v)[0]} ${toFace(u, v)[1]}`).join(' ');
  const [hx, hy] = toFace(g.head[0], g.head[1]);
  return (
    <g>
      {frame && (
        <>
          <Block3 c={[cx - w / 2 - 3, cy]} w={3.4} d={3.4} z0={z0} h={h + 6} m={m} />
        </>
      )}
      <Block3 c={c} w={w} d={d} z0={z0} h={h} m={GRANITE} />
      {/* bevelled cap */}
      <Block3 c={c} w={w + 2} d={d + 2} z0={z0 + h} h={2.4} m={GRANITE} />
      {/* inset panel and the inlaid metal pictogram */}
      <polygon
        points={pts([toFace(-1.05, -0.06), toFace(1.05, -0.06), toFace(1.05, 1.04), toFace(-1.05, 1.04)])}
        fill="#b5aea4"
        stroke={GRANITE.dark}
        strokeWidth={0.5}
      />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {g.lines.map((l, i) => (
          <path key={`o${i}`} d={path(l)} stroke={m.dark} strokeWidth={3.4} />
        ))}
        {g.lines.map((l, i) => (
          <path key={`i${i}`} d={path(l)} stroke={m.light} strokeWidth={2} />
        ))}
      </g>
      <circle cx={hx} cy={hy} r={2.6} fill={m.light} stroke={m.dark} strokeWidth={0.7} />
      {frame && <Block3 c={[cx + w / 2 + 3, cy]} w={3.4} d={3.4} z0={z0} h={h + 6} m={m} />}
      {frame && <Block3 c={c} w={w + 10} d={3.4} z0={z0 + h + 6} h={3} m={m} />}
    </g>
  );
}

function Sculpture({ id, c, z, m, accent, gid, lit }: { id: string; c: [number, number]; z: number; m: M; accent: M; gid: string; lit: boolean }) {
  const [cx, cy] = c;
  const at = (dx: number, dy: number): [number, number] => [cx + dx, cy + dy];
  switch (id) {
    // ---- Volume: the cornerstone, then obelisks that grow ----
    case 'first-set':
      return (
        <g>
          <Block3 c={c} w={20} d={20} z0={z} h={14} m={GRANITE} />
          <Block3 c={c} w={8} d={8} z0={z + 14} h={2} m={m} />
          <Gem c={c} z={z + 22} r={5} accent={accent} />
        </g>
      );
    case 'sets-50':
      return (
        <g>
          <Block3 c={c} w={18} d={18} z0={z} h={5} m={GRANITE} />
          <Obelisk c={c} w0={6} w1={4.2} z0={z + 5} h={58} cap={9} m={m} />
        </g>
      );
    case 'sets-250':
      return (
        <g>
          {[[-12, -12], [12, -12], [-12, 12]].map(([dx, dy]) => (
            <Block3 key={`${dx}${dy}`} c={at(dx, dy)} w={4} d={4} z0={z} h={10} m={m} />
          ))}
          <Block3 c={c} w={20} d={20} z0={z} h={4} m={GRANITE} />
          <Block3 c={c} w={15} d={15} z0={z + 4} h={4} m={GRANITE} />
          <Obelisk c={c} w0={6.4} w1={4.4} z0={z + 8} h={80} cap={11} m={m} bands={[0.18, 0.62]} />
          <Gem c={c} z={z + 103} r={3.6} accent={accent} />
          <Block3 c={at(12, 12)} w={4} d={4} z0={z} h={10} m={m} />
        </g>
      );
    // ---- Consistency: eternal flames that grow ----
    case 'streak-3':
      return (
        <g>
          <Drum c={c} r={10} z0={z} h={10} gid={gid} m={GRANITE} grad="stone" />
          <FireBowl c={c} z={z + 13} r={10} m={m} gid={gid} lit={lit} flame={6} />
        </g>
      );
    case 'streak-7':
      return (
        <g>
          <Drum c={c} r={8} z0={z} h={4} gid={gid} m={GRANITE} grad="stone" />
          <Drum c={c} r={4.2} z0={z + 4} h={30} gid={gid} m={GRANITE} grad="stone" />
          <Drum c={c} r={5.4} z0={z + 22} h={2.4} gid={gid} m={m} />
          <FireBowl c={c} z={z + 38} r={9} m={m} gid={gid} lit={lit} flame={7} />
        </g>
      );
    case 'streak-30':
      return (
        <g>
          <Block3 c={c} w={16} d={16} z0={z} h={6} m={GRANITE} />
          <Block3 c={c} w={11} d={11} z0={z + 6} h={34} m={GRANITE} />
          <Block3 c={c} w={13} d={13} z0={z + 26} h={2.6} m={m} />
          <Block3 c={c} w={14} d={14} z0={z + 40} h={3} m={m} />
          <FireBowl c={c} z={z + 46} r={11} m={m} gid={gid} lit={lit} flame={9} />
        </g>
      );
    case 'streak-100':
      return (
        <g>
          {[[-13, -13], [13, -13], [-13, 13]].map(([dx, dy]) => (
            <g key={`${dx}${dy}`}>
              <Block3 c={at(dx, dy)} w={5} d={5} z0={z} h={10} m={GRANITE} />
              <FireAt at={[cx + dx, cy + dy, z + 10]} size={3.2} lit={lit} gid={gid} />
            </g>
          ))}
          <Block3 c={c} w={14} d={14} z0={z} h={50} m={GRANITE} />
          <Block3 c={c} w={16} d={16} z0={z + 22} h={3} m={m} />
          <Block3 c={c} w={17} d={17} z0={z + 50} h={3.4} m={m} />
          <FireBowl c={c} z={z + 57} r={13} m={m} gid={gid} lit={lit} flame={12} />
          <Ring c={c} r={9} z={z + 92} m={m} width={2.2} />
          <Block3 c={at(13, 13)} w={5} d={5} z0={z} h={10} m={GRANITE} />
          <FireAt at={[cx + 13, cy + 13, z + 10]} size={3.2} lit={lit} gid={gid} />
        </g>
      );
    // ---- Skills: engraved steles with Olympic-style pictograms ----
    case 'pushups-30':
      return <Stele c={c} w={30} z0={z} h={40} m={m} glyph="pushup" />;
    case 'pushups-50':
      return <Stele c={c} w={30} z0={z} h={44} m={m} glyph="pushup" frame />;
    case 'first-pull-up':
      return <Stele c={c} w={26} z0={z} h={48} m={m} glyph="pullup" />;
    case 'first-pistol':
      return <Stele c={c} w={28} z0={z} h={44} m={m} glyph="pistol" />;
    // ---- Specials ----
    case 'first-loaded':
      return (
        <g>
          <Block3 c={c} w={24} d={10} z0={z} h={4} m={GRANITE} />
          <UprightDisc c={c} zc={z + 21} r={17} thick={5} m={m} hole={3.6} />
        </g>
      );
    case 'first-elite':
      return (
        <g>
          <Drum c={c} r={9} z0={z} h={6} gid={gid} m={GRANITE} grad="stone" />
          <circle cx={P(cx, cy, z + 6)[0]} cy={P(cx, cy, z + 6)[1]} r={10} fill={`url(#${gid}-glow)`} />
          <g className="statue-hover">
            <Gem c={c} z={z + 30} r={12} accent={accent} />
          </g>
        </g>
      );
    case 'balanced-week': {
      // Hanging scales: a post, a level beam, chains and two equal pans.
      const pan = (dx: number) => {
        const top = pr([cx + dx, cy, z + 48]);
        const [px, py] = P(cx + dx, cy, z + 28);
        return (
          <g key={dx}>
            <line x1={top[0]} y1={top[1]} x2={px - 5} y2={py} stroke={m.dark} strokeWidth={0.7} />
            <line x1={top[0]} y1={top[1]} x2={px + 5} y2={py} stroke={m.dark} strokeWidth={0.7} />
            <path d={`M${px - 7} ${py} Q ${px} ${py + 6}, ${px + 7} ${py} Z`} fill={`url(#${gid}-drum)`} stroke={m.dark} strokeWidth={EDGE} />
            <ellipse cx={px} cy={py} rx={7} ry={2} fill={m.light} stroke={m.dark} strokeWidth={EDGE} />
          </g>
        );
      };
      return (
        <g>
          <Block3 c={c} w={16} d={16} z0={z} h={5} m={GRANITE} />
          {pan(-18)}
          <Drum c={c} r={2.6} z0={z + 5} h={44} gid={gid} m={GRANITE} grad="stone" />
          <Beam a={[cx - 20, cy, z + 48]} b={[cx + 20, cy, z + 48]} t={3} m={m} />
          <Orb c={c} z={z + 54} r={5} gid={gid} />
          {pan(18)}
        </g>
      );
    }
    case 'first-session':
      return (
        <g>
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
          <Block3 c={c} w={34} d={10} z0={z} h={6} m={GRANITE} />
        </g>
      );
    // ---- Time: calendar monuments ----
    case 'first-week': {
      // A sundial: a stone dial with seven day marks and a metal gnomon.
      const [dx0, dy0] = P(cx, cy, z + 8);
      const marks = Array.from({ length: 7 }, (_, i) => {
        const ang = Math.PI * 0.15 + (i * Math.PI * 0.7) / 6;
        const p1 = P(cx + Math.cos(ang) * 11, cy + Math.sin(ang) * 11, z + 8);
        const p2 = P(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14, z + 8);
        return <line key={i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={m.dark} strokeWidth={1.2} strokeLinecap="round" />;
      });
      return (
        <g>
          <Drum c={c} r={10} z0={z} h={4} gid={gid} m={GRANITE} grad="stone" />
          <Drum c={c} r={16} z0={z + 4} h={4} gid={gid} m={GRANITE} grad="stone" />
          <ellipse cx={dx0} cy={dy0} rx={14.5 * 0.707} ry={14.5 * 0.354} fill="none" stroke={m.base} strokeWidth={1} />
          {marks}
          <polygon points={poly([[cx - 1, cy - 9, z + 8], [cx - 1, cy + 9, z + 8], [cx - 1, cy - 9, z + 24]])} fill={m.base} stroke={m.dark} strokeWidth={EDGE} />
          <polygon points={poly([[cx + 1, cy - 9, z + 8], [cx + 1, cy + 9, z + 8], [cx + 1, cy - 9, z + 24]])} fill={m.light} stroke={m.dark} strokeWidth={EDGE} />
        </g>
      );
    }
    case 'weeks-4': {
      // A four-pillar shrine with a domed roof.
      const posts: Array<[number, number]> = [[-11, -11], [11, -11], [-11, 11], [11, 11]];
      const [rx2, ry2] = P(cx, cy, z + 40);
      return (
        <g>
          <Block3 c={c} w={30} d={30} z0={z} h={4} m={GRANITE} />
          {posts.slice(0, 3).map(([dx, dy]) => (
            <Drum key={`${dx}${dy}`} c={at(dx, dy)} r={2.6} z0={z + 4} h={30} gid={gid} m={GRANITE} grad="stone" />
          ))}
          <Gem c={c} z={z + 16} r={5} accent={accent} />
          <Drum c={at(11, 11)} r={2.6} z0={z + 4} h={30} gid={gid} m={GRANITE} grad="stone" />
          <Block3 c={c} w={30} d={30} z0={z + 34} h={4} m={GRANITE} />
          <path
            d={`M${rx2 - 13 * 0.707} ${ry2} A ${13 * 0.707} ${13 * 0.6} 0 0 1 ${rx2 + 13 * 0.707} ${ry2} A ${13 * 0.707} ${13 * 0.354} 0 0 1 ${rx2 - 13 * 0.707} ${ry2} Z`}
            fill={`url(#${gid}-drum)`}
            stroke={m.dark}
            strokeWidth={EDGE}
          />
          <circle cx={rx2} cy={ry2 - 13 * 0.6 - 2} r={2.2} fill={m.light} stroke={m.dark} strokeWidth={0.6} />
        </g>
      );
    }
    case 'weeks-12': {
      // A stone circle: twelve megaliths around a jewel on an altar.
      const ring = Array.from({ length: 12 }, (_, i) => {
        const ang = (Math.PI * 2 * i) / 12;
        return { x: cx + Math.cos(ang) * 19, y: cy + Math.sin(ang) * 19, i };
      });
      const byDepth = (p: { x: number; y: number }, q: { x: number; y: number }) => p.x + p.y - (q.x + q.y);
      const back = ring.filter((p) => p.x + p.y < cx + cy).sort(byDepth);
      const front = ring.filter((p) => p.x + p.y >= cx + cy).sort(byDepth);
      // Slim megaliths; every other pair is capped with a lintel, Stonehenge-style.
      const stone = (p: { x: number; y: number; i: number }) => {
        const next = ring[(p.i + 1) % 12];
        return (
          <g key={p.i}>
            <Block3 c={[p.x, p.y]} w={3} d={3} z0={z} h={22} m={GRANITE} />
            {p.i % 2 === 0 && <Beam a={[p.x, p.y, z + 22]} b={[next.x, p.y + (next.y - p.y), z + 22]} t={2.6} m={GRANITE} />}
          </g>
        );
      };
      return (
        <g>
          <Ring c={c} r={22} z={z} m={m} />
          {back.map(stone)}
          <Block3 c={c} w={8} d={8} z0={z} h={6} m={m} />
          <Gem c={c} z={z + 14} r={5} accent={accent} />
          {front.map(stone)}
        </g>
      );
    }
    default:
      return <Block3 c={c} w={18} d={18} z0={z} h={12} m={GRANITE} />;
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
