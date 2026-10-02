import type { ReactNode } from 'react';
import { TROPHY_ITEM_PREFIX, getTrophyDef, type PaletteId, type TrophyTier } from '../../game/catalog';
import type { PlacedItem, TodayPlan } from '../../game/engine';

/**
 * Base art in a flat game-asset style: solid layered shapes lit from the top
 * left, so every block has a light top, a base front and a dark side.
 *
 * Every building takes a `theme` (light/base/dark shades of the player's
 * chosen colour, used for roofs, trims and banners) and a `decoration`
 * (extra groups such as banners, plating or glowing accents).
 */

export type Shades = { light: string; base: string; dark: string };

export const THEME_SHADES: Record<PaletteId, Shades> = {
  cyan: { light: '#8eeaff', base: '#2fb8e0', dark: '#1a7799' },
  lime: { light: '#e6ff8a', base: '#b5d92a', dark: '#728c10' },
  magenta: { light: '#ffa6e8', base: '#e04fc0', dark: '#962a7f' },
  amber: { light: '#ffd394', base: '#f2a541', dark: '#b06816' },
  violet: { light: '#cfc0ff', base: '#8f6ff0', dark: '#553db0' },
  red: { light: '#ffa3a3', base: '#e5484d', dark: '#9c272d' },
  white: { light: '#ffffff', base: '#dfe5ec', dark: '#9ea9b7' }
};

/** Colour each building uses until the player picks one. */
const DEFAULT_THEME: Record<string, PaletteId> = {
  hq: 'cyan',
  watchtower: 'violet',
  lodge: 'amber',
  forge: 'magenta',
  spring: 'cyan',
  yard: 'lime'
};

export function themeFor(itemId: string, color?: string): Shades {
  const id = (color as PaletteId) || DEFAULT_THEME[itemId] || 'cyan';
  return THEME_SHADES[id] ?? THEME_SHADES.cyan;
}

export type Decoration = 'plain' | 'banners' | 'plated' | 'glow';

// Shared materials
const STONE: Shades = { light: '#e3e8ee', base: '#b3bdca', dark: '#7d8899' };
const WOOD: Shades = { light: '#e8b47a', base: '#bf8148', dark: '#87552a' };
const METAL: Shades = { light: '#cfd8e3', base: '#8e9bad', dark: '#5b6678' };
const GLASS: Shades = { light: '#c9f1ff', base: '#6cc7ee', dark: '#2f7fa8' };
const GRASS: Shades = { light: '#6fd38a', base: '#3fa862', dark: '#277244' };
const LEAF: Shades = { light: '#7ee2a0', base: '#3bb36a', dark: '#22784a' };
const WINDOW_LIT = '#ffd76a';
const WINDOW_DARK = '#2b3346';
const FIRE = '#ff8a3d';

/** Wall materials a building is made of. */
export type Materials = { stone: Shades; wood: Shades; metal: Shades };

const NATURAL: Materials = { stone: STONE, wood: WOOD, metal: METAL };

function mixHex(a: string, b: string, amount: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255;
    const y = (pb >> shift) & 255;
    return Math.round(x + (y - x) * amount);
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** Blend a material toward the theme, shade by shade, so depth is kept. */
function tint(material: Shades, theme: Shades, amount: number): Shades {
  return {
    light: mixHex(material.light, theme.light, amount),
    base: mixHex(material.base, theme.base, amount),
    dark: mixHex(material.dark, theme.dark, amount)
  };
}

/**
 * When the player picks a colour, the walls take it on too (pink wood,
 * violet stone, cyan steel), a little softer than the roof so the roof
 * still reads as the accent.
 */
export function materialsFor(color: string | undefined, theme: Shades): Materials {
  if (!color) return NATURAL;
  return {
    stone: tint(STONE, theme, 0.5),
    wood: tint(WOOD, theme, 0.55),
    metal: tint(METAL, theme, 0.45)
  };
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/** Depth of the oblique projection: the side face goes right and up. */
const DEPTH_Y = 0.55;

/** A solid block with a front, a right side and a top. */
/**
 * Shared gradients and filters for the high-fidelity look. Render once inside
 * any SVG that draws base art (the map, previews).
 */
export function ArtDefs() {
  return (
    <defs>
      {/* Walls: lit from above, darker toward the ground (ambient occlusion). */}
      <linearGradient id="hf-face" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
      </linearGradient>
      <linearGradient id="hf-side" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#000000" stopOpacity="0.02" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.32" />
      </linearGradient>
      <linearGradient id="hf-top" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
      </linearGradient>
      <linearGradient id="hf-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
      </linearGradient>
      {/* Soft contact shadows. */}
      <radialGradient id="hf-shadow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000000" stopOpacity="0.5" />
        <stop offset="0.65" stopColor="#000000" stopOpacity="0.28" />
        <stop offset="1" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
      {/* Round bodies (animals, bushes): light top, shaded underside. */}
      <linearGradient id="hf-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.25" />
      </linearGradient>
    </defs>
  );
}

/**
 * A solid block with a front, a right side and a top, shaded like a real
 * object: gradient walls, a lit top edge, and faint courses (stone rows /
 * wood planks) on the front.
 */
function Block({ x, y, w, h, d, s }: { x: number; y: number; w: number; h: number; d: number; s: Shades }) {
  const dy = d * DEPTH_Y;
  const side = `${x + w},${y} ${x + w + d},${y - dy} ${x + w + d},${y + h - dy} ${x + w},${y + h}`;
  const top = `${x},${y} ${x + d},${y - dy} ${x + w + d},${y - dy} ${x + w},${y}`;
  const courses: number[] = [];
  for (let cy = y + 7; cy < y + h - 2; cy += 7) courses.push(cy);
  return (
    <g>
      <polygon points={side} fill={s.dark} />
      <polygon points={side} fill="url(#hf-side)" />
      <polygon points={top} fill={s.light} />
      <polygon points={top} fill="url(#hf-top)" />
      <rect x={x} y={y} width={w} height={h} fill={s.base} />
      {h > 12 &&
        courses.map((cy) => (
          <line key={cy} x1={x} y1={cy} x2={x + w} y2={cy} stroke="#000" strokeOpacity={0.07} strokeWidth={0.9} />
        ))}
      <rect x={x} y={y} width={w} height={h} fill="url(#hf-face)" />
      {/* Crisp lit edges sell the volume. */}
      <line x1={x} y1={y} x2={x + w} y2={y} stroke="#fff" strokeOpacity={0.45} strokeWidth={1.1} />
      <line x1={x + w} y1={y} x2={x + w + d} y2={y - dy} stroke="#fff" strokeOpacity={0.25} strokeWidth={0.9} />
      <line x1={x + w} y1={y} x2={x + w} y2={y + h} stroke="#000" strokeOpacity={0.18} strokeWidth={0.9} />
    </g>
  );
}

/** Shingle rows between two edges of a roof face, from top to bottom. */
function Shingles({ a, b, c, e, rows }: { a: [number, number]; b: [number, number]; c: [number, number]; e: [number, number]; rows: number }) {
  // a→c is one edge (top→bottom), b→e the other.
  const lerp = (p: [number, number], q: [number, number], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  return (
    <g stroke="#000" strokeOpacity={0.14} strokeWidth={0.9}>
      {Array.from({ length: rows }, (_, i) => {
        const t = (i + 1) / (rows + 1);
        const [x1, y1] = lerp(a, c, t);
        const [x2, y2] = lerp(b, e, t);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </g>
  );
}

/** A pitched roof sitting on a block of the same footprint. */
function GableRoof({ x, y, w, d, rise, s }: { x: number; y: number; w: number; d: number; rise: number; s: Shades }) {
  const dy = d * DEPTH_Y;
  const peakX = x + w / 2;
  const peakY = y - rise;
  const slope = `${peakX},${peakY} ${peakX + d},${peakY - dy} ${x + w + d + 3},${y - dy + 2} ${x + w + 3},${y + 2}`;
  return (
    <g>
      {/* Roof slope going back, with shingle rows */}
      <polygon points={slope} fill={s.base} />
      <Shingles a={[peakX, peakY]} b={[peakX + d, peakY - dy]} c={[x + w + 3, y + 2]} e={[x + w + d + 3, y - dy + 2]} rows={Math.max(3, Math.round(rise / 6))} />
      <polygon points={slope} fill="url(#hf-roof)" />
      <line x1={peakX} y1={peakY} x2={peakX + d} y2={peakY - dy} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.4} />
      {/* Front gable */}
      <polygon points={`${x - 3},${y + 2} ${peakX},${peakY} ${x + w + 3},${y + 2}`} fill={s.light} />
      <Shingles a={[peakX, peakY]} b={[peakX, peakY]} c={[x - 3, y + 2]} e={[x + w + 3, y + 2]} rows={Math.max(3, Math.round(rise / 6))} />
      <polygon points={`${x - 3},${y + 2} ${peakX},${peakY} ${x + w + 3},${y + 2}`} fill="url(#hf-roof)" />
      {/* Eave trim */}
      <polygon points={`${x - 3},${y + 2} ${peakX},${peakY} ${peakX},${peakY + 5} ${x + 2},${y + 2}`} fill={s.dark} opacity={0.35} />
      <rect x={x - 3} y={y} width={w + 6} height={3} fill={s.dark} />
      <rect x={x - 3} y={y + 3} width={w + 6} height={2} fill="#000" opacity={0.18} />
    </g>
  );
}

/** A four-sided pointed roof. */
function PyramidRoof({ x, y, w, d, rise, s }: { x: number; y: number; w: number; d: number; rise: number; s: Shades }) {
  const dy = d * DEPTH_Y;
  const apexX = x + (w + d) / 2;
  const apexY = y - dy / 2 - rise;
  return (
    <g>
      <polygon points={`${x + w},${y} ${x + w + d},${y - dy} ${apexX},${apexY}`} fill={s.dark} />
      <polygon points={`${x},${y} ${x + w},${y} ${apexX},${apexY}`} fill={s.base} />
      <Shingles a={[apexX, apexY]} b={[apexX, apexY]} c={[x, y]} e={[x + w, y]} rows={Math.max(3, Math.round(rise / 5))} />
      <polygon points={`${x},${y} ${x + w * 0.42},${y} ${apexX},${apexY}`} fill={s.light} opacity={0.55} />
      <polygon points={`${x},${y} ${x + w},${y} ${apexX},${apexY}`} fill="url(#hf-roof)" />
      <line x1={x + w} y1={y} x2={apexX} y2={apexY} stroke="#fff" strokeOpacity={0.35} strokeWidth={1} />
    </g>
  );
}

/** A soft, blurred-looking contact shadow. */
function Shadow({ cx = 50, cy = 88, rx = 34 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx * 1.12} ry={rx * 0.32} fill="url(#hf-shadow)" />;
}

/** A framed window with a sill; glows on training days, dark on quiet ones. */
function Window({ x, y, w, h, lit, arch = false }: { x: number; y: number; w: number; h: number; lit: boolean; arch?: boolean }) {
  const r = arch ? w / 2 : 1.5;
  return (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={r + 1.5} fill="#3a2a1c" opacity={0.75} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={lit ? WINDOW_LIT : WINDOW_DARK} />
      {lit && <rect x={x} y={y} width={w} height={h} rx={r} fill="url(#hf-face)" />}
      <line x1={x + w / 2} y1={y + (arch ? w / 2 : 1)} x2={x + w / 2} y2={y + h} stroke="#3a2a1c" strokeOpacity={0.6} strokeWidth={1} />
      {lit && <rect x={x + 1} y={y + 1} width={w * 0.3} height={h - 2} rx={r} fill="#fff" opacity={0.4} />}
      <rect x={x - 2.5} y={y + h} width={w + 5} height={2.2} rx={1} fill="#e8dcc8" opacity={0.9} />
    </g>
  );
}

function GlassPane({ x, y, w, h, lit }: { x: number; y: number; w: number; h: number; lit: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={GLASS.dark} />
      <rect x={x} y={y} width={w} height={h} fill={lit ? '#ffe9a6' : GLASS.base} opacity={lit ? 0.55 : 0.8} className={lit ? 'base-light is-lit' : undefined} />
      <polygon points={`${x + w * 0.15},${y + h} ${x + w * 0.45},${y} ${x + w * 0.65},${y} ${x + w * 0.35},${y + h}`} fill="#fff" opacity={0.35} />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={METAL.light} strokeWidth={1.2} />
    </g>
  );
}

function Beacon({ cx, cy, s, lit, r = 4 }: { cx: number; cy: number; s: Shades; lit: boolean; r?: number }) {
  return (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      {lit && <circle cx={cx} cy={cy} r={r * 2.4} fill={s.light} opacity={0.25} />}
      <circle cx={cx} cy={cy} r={r} fill={lit ? s.light : s.dark} />
    </g>
  );
}

function Flag({ x, y, s, h = 16 }: { x: number; y: number; s: Shades; h?: number }) {
  return (
    <g>
      <rect x={x - 1} y={y} width={2.2} height={h} fill={METAL.dark} />
      <polygon points={`${x + 1},${y} ${x + 15},${y + 3} ${x + 1},${y + 7}`} fill={s.base} />
      <polygon points={`${x + 1},${y + 3.5} ${x + 15},${y + 3} ${x + 1},${y + 7}`} fill={s.dark} />
    </g>
  );
}

/**
 * Optional add-ons, drawn over a building's front wall (`x, y, w, h`).
 * Banners hang from the top, plating covers the base, glow runs along edges.
 */
function Decorations({
  kind,
  x,
  y,
  w,
  h,
  s,
  lit
}: {
  kind?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  s: Shades;
  lit: boolean;
}) {
  if (!kind || kind === 'plain') return null;
  if (kind === 'banners') {
    const bw = Math.min(10, w * 0.18);
    return (
      <g>
        {[x + w * 0.12, x + w * 0.88 - bw].map((bx) => (
          <g key={bx}>
            <rect x={bx - 1} y={y + 1} width={bw + 2} height={2.5} fill={WOOD.dark} />
            <polygon points={`${bx},${y + 3} ${bx + bw},${y + 3} ${bx + bw},${y + h * 0.5} ${bx + bw / 2},${y + h * 0.42} ${bx},${y + h * 0.5}`} fill={s.base} />
            <polygon points={`${bx + bw / 2},${y + 3} ${bx + bw},${y + 3} ${bx + bw},${y + h * 0.5} ${bx + bw / 2},${y + h * 0.42}`} fill={s.dark} />
            <circle cx={bx + bw / 2} cy={y + h * 0.22} r={bw * 0.22} fill={s.light} />
          </g>
        ))}
      </g>
    );
  }
  if (kind === 'plated') {
    const ph = Math.max(6, h * 0.26);
    const py = y + h - ph;
    const rivets = Math.max(3, Math.round(w / 12));
    return (
      <g>
        <rect x={x} y={py} width={w} height={ph} fill={METAL.base} />
        <rect x={x} y={py} width={w} height={1.8} fill={METAL.light} />
        <rect x={x} y={py + ph - 1.6} width={w} height={1.6} fill={METAL.dark} />
        {Array.from({ length: rivets }, (_, i) => (
          <circle key={i} cx={x + ((i + 0.5) * w) / rivets} cy={py + ph / 2} r={1.3} fill={METAL.dark} />
        ))}
      </g>
    );
  }
  // glow
  return (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      <rect x={x} y={y + h - 3} width={w} height={2.5} rx={1.2} fill={lit ? s.light : s.dark} />
      <rect x={x} y={y + 1} width={w} height={2} rx={1} fill={lit ? s.light : s.dark} opacity={0.85} />
      {lit && <rect x={x - 2} y={y + h - 6} width={w + 4} height={8} rx={4} fill={s.light} opacity={0.18} />}
    </g>
  );
}

type BuildingProps = { level: number; lit: boolean; s: Shades; m: Materials; decoration?: string };

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

function Watchtower({ level, lit, s, m, decoration }: BuildingProps) {
  if (level >= 3) {
    return (
      <g>
        <g data-part="shadows"><Shadow rx={24} /></g>
        <g data-part="base-structure">
          <Block x={42} y={44} w={16} h={44} d={6} s={m.metal} />
          <rect x={48} y={46} width={3} height={40} fill={m.metal.light} opacity={0.5} />
          <Block x={26} y={24} w={42} h={20} d={10} s={m.metal} />
          <GlassPane x={29} y={27} w={36} h={14} lit={lit} />
        </g>
        <g data-part="roof">
          <Block x={23} y={20} w={48} h={4} d={11} s={s} />
          <rect x={52} y={6} width={2} height={10} fill={m.metal.dark} />
          <Beacon cx={53} cy={5} s={s} lit={lit} />
        </g>
        <g data-part="decorations"><Decorations kind={decoration} x={26} y={24} w={42} h={20} s={s} lit={lit} /></g>
      </g>
    );
  }
  const tall = level >= 2;
  return (
    <g>
      <g data-part="shadows"><Shadow rx={24} /></g>
      <g data-part="base-structure">
        <Block x={36} y={42} w={24} h={46} d={8} s={m.stone} />
        {tall && (
          <g>
            <rect x={36} y={58} width={24} height={2.5} fill={m.stone.dark} />
            <rect x={36} y={73} width={24} height={2.5} fill={m.stone.dark} />
          </g>
        )}
        <Window x={43} y={tall ? 46 : 58} w={10} h={13} lit={lit} arch />
        {tall && <Window x={43} y={63} w={10} h={8} lit={lit} arch />}
        <Block x={30} y={32} w={36} h={10} d={9} s={m.stone} />
        {[30, 41, 52].map((x) => (
          <Block key={x} x={x} y={26} w={7} h={6} d={3} s={m.stone} />
        ))}
      </g>
      <g data-part="roof">
        <PyramidRoof x={32} y={26} w={32} d={8} rise={tall ? 22 : 18} s={s} />
        {tall && <Flag x={52} y={-2} s={s} />}
      </g>
      <g data-part="decorations"><Decorations kind={decoration} x={36} y={42} w={24} h={46} s={s} lit={lit} /></g>
    </g>
  );
}

function Lodge({ level, lit, s, m, decoration }: BuildingProps) {
  if (level >= 3) {
    return (
      <g>
        <g data-part="shadows"><Shadow rx={38} /></g>
        <g data-part="base-structure">
          <Block x={12} y={44} w={62} h={44} d={14} s={m.wood} />
          <GlassPane x={18} y={50} w={34} h={34} lit={lit} />
          <rect x={58} y={60} width={11} height={28} fill={m.wood.dark} />
          <circle cx={66} cy={74} r={1.2} fill={m.metal.light} />
        </g>
        <g data-part="roof">
          <Block x={9} y={38} w={68} h={6} d={16} s={s} />
          {[14, 34].map((x) => (
            <polygon key={x} points={`${x},${33} ${x + 6},${29.7} ${x + 22},${29.7} ${x + 16},${33}`} fill="#1d3557" stroke={m.metal.light} strokeWidth={0.8} />
          ))}
        </g>
        <g data-part="decorations"><Decorations kind={decoration} x={12} y={44} w={62} h={44} s={s} lit={lit} /></g>
      </g>
    );
  }
  const big = level >= 2;
  return (
    <g>
      <g data-part="shadows"><Shadow rx={36} /></g>
      <g data-part="base-structure">
        {big && <Block x={60} y={20} w={8} h={20} d={5} s={m.stone} />}
        {big && lit && (
          <g opacity={0.5} className="base-smoke">
            <circle cx={66} cy={14} r={3.5} fill="#c9ced6" />
            <circle cx={70} cy={8} r={2.6} fill="#c9ced6" />
          </g>
        )}
        <Block x={16} y={52} w={56} h={36} d={13} s={m.wood} />
        {[60, 68, 76].map((y) => (
          <rect key={y} x={16} y={y} width={56} height={1.2} fill={m.wood.dark} opacity={0.6} />
        ))}
        <rect x={38} y={66} width={12} height={22} rx={1.5} fill={m.wood.dark} />
        <circle cx={47} cy={78} r={1.2} fill={WINDOW_LIT} />
        <Window x={21} y={62} w={11} h={9} lit={lit} />
        {big && <Window x={56} y={62} w={11} h={9} lit={lit} />}
        {big && <Block x={14} y={86} w={60} h={3} d={13} s={m.wood} />}
      </g>
      <g data-part="roof">
        <GableRoof x={16} y={52} w={56} d={13} rise={big ? 28 : 24} s={s} />
      </g>
      <g data-part="decorations"><Decorations kind={decoration} x={16} y={52} w={56} h={36} s={s} lit={lit} /></g>
    </g>
  );
}

function Forge({ level, lit, s, m, decoration }: BuildingProps) {
  const furnace = (
    <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
      <path d="M36 88 V76 A10 10 0 0 1 56 76 V88 Z" fill="#2a1a12" />
      <path d="M39 88 V77 A7 7 0 0 1 53 77 V88 Z" fill={lit ? FIRE : '#5a3020'} className={lit ? 'base-flame' : undefined} />
      {lit && <path d="M42 88 V80 A4 4 0 0 1 50 80 V88 Z" fill={WINDOW_LIT} />}
    </g>
  );
  if (level >= 3) {
    return (
      <g>
        <g data-part="shadows"><Shadow rx={38} /></g>
        <g data-part="base-structure">
          <Block x={10} y={46} w={66} h={42} d={14} s={m.metal} />
          {[54, 62, 70].map((y) => (
            <rect key={y} x={14} y={y} width={58} height={3} rx={1.5} fill={lit ? s.light : s.dark} className={lit ? 'base-light is-lit' : undefined} opacity={0.9} />
          ))}
          {furnace}
        </g>
        <g data-part="roof">
          {[10, 32, 54].map((x) => (
            <g key={x}>
              <polygon points={`${x},46 ${x},34 ${x + 22},46`} fill={s.base} />
              <polygon points={`${x},34 ${x + 5},31 ${x + 27},43 ${x + 22},46`} fill={s.dark} />
              <polygon points={`${x + 2},44 ${x + 2},37 ${x + 14},44`} fill={lit ? '#ffe9a6' : GLASS.base} opacity={0.8} />
            </g>
          ))}
        </g>
        <g data-part="decorations"><Decorations kind={decoration} x={10} y={46} w={66} h={42} s={s} lit={lit} /></g>
      </g>
    );
  }
  const big = level >= 2;
  return (
    <g>
      <g data-part="shadows"><Shadow rx={36} /></g>
      <g data-part="base-structure">
        <Block x={58} y={big ? 12 : 22} w={11} h={big ? 30 : 20} d={5} s={m.stone} />
        {big && lit && (
          <g opacity={0.55} className="base-smoke">
            <circle cx={66} cy={6} r={4} fill="#c9ced6" />
            <circle cx={72} cy={1} r={3} fill="#c9ced6" />
          </g>
        )}
        <Block x={14} y={50} w={60} h={38} d={13} s={m.stone} />
        {furnace}
        {big && (
          <g>
            <polygon points="16,82 30,82 27,86 19,86" fill={m.metal.base} />
            <rect x={21} y={86} width={4} height={2} fill={m.metal.dark} />
          </g>
        )}
      </g>
      <g data-part="roof">
        <Block x={11} y={44} w={66} h={6} d={14} s={s} />
      </g>
      <g data-part="decorations"><Decorations kind={decoration} x={14} y={50} w={60} h={38} s={s} lit={lit} /></g>
    </g>
  );
}

function Crystal({ x, y, h, s }: { x: number; y: number; h: number; s: Shades }) {
  const w = h * 0.4;
  return (
    <g>
      <polygon points={`${x},${y} ${x - w / 2},${y - h * 0.65} ${x},${y - h}`} fill={s.light} />
      <polygon points={`${x},${y} ${x + w / 2},${y - h * 0.65} ${x},${y - h}`} fill={s.base} />
      <polygon points={`${x},${y} ${x + w / 2},${y - h * 0.65} ${x + w * 0.2},${y - h * 0.5}`} fill={s.dark} />
    </g>
  );
}

function Spring({ level, lit, s, m, decoration }: BuildingProps) {
  return (
    <g>
      <g data-part="shadows"><Shadow rx={38} cy={84} /></g>
      <g data-part="base-structure">
        <ellipse cx={50} cy={68} rx={38} ry={18} fill={m.stone.dark} />
        <ellipse cx={50} cy={64} rx={38} ry={18} fill={m.stone.base} />
        <ellipse cx={50} cy={63} rx={31} ry={13} fill={s.dark} />
        <ellipse cx={50} cy={64} rx={28} ry={11} fill={s.base} className={lit ? 'base-light is-lit' : undefined} />
        <ellipse cx={42} cy={61} rx={10} ry={3} fill={s.light} opacity={0.7} />
      </g>
      <g data-part="roof">
        <Crystal x={50} y={58} h={level >= 2 ? 44 : 32} s={s} />
        {level >= 2 && <Crystal x={36} y={60} h={26} s={s} />}
        {level >= 2 && <Crystal x={64} y={61} h={22} s={s} />}
        {level >= 3 && (
          <g>
            {[14, 82].map((x) => (
              <Block key={x} x={x} y={18} w={4} h={52} d={3} s={m.stone} />
            ))}
            <Block x={10} y={12} w={78} h={6} d={6} s={s} />
            <rect x={12} y={18} width={74} height={1.5} fill={lit ? WINDOW_LIT : s.dark} className={lit ? 'base-light is-lit' : undefined} />
          </g>
        )}
      </g>
      <g data-part="decorations"><Decorations kind={decoration} x={18} y={64} w={64} h={14} s={s} lit={lit} /></g>
    </g>
  );
}

function Headquarters({ level, lit, s, m, decoration }: BuildingProps) {
  if (level >= 3) {
    return (
      <g>
        <g data-part="shadows"><Shadow cx={100} cy={180} rx={88} /></g>
        <g data-part="base-structure">
          {[20, 150].map((x) => (
            <g key={x}>
              <Block x={x} y={56} w={24} h={120} d={10} s={m.metal} />
              <GlassPane x={x + 4} y={64} w={16} h={80} lit={lit} />
            </g>
          ))}
          <Block x={46} y={98} w={104} h={78} d={22} s={m.metal} />
          <GlassPane x={54} y={106} w={88} h={40} lit={lit} />
          <Block x={64} y={64} w={70} h={34} d={18} s={m.metal} />
          <GlassPane x={70} y={70} w={58} h={24} lit={lit} />
          <rect x={84} y={152} width={28} height={24} fill={m.metal.dark} />
          <rect x={86} y={154} width={24} height={22} fill={lit ? WINDOW_LIT : WINDOW_DARK} className={lit ? 'base-light is-lit' : undefined} />
        </g>
        <g data-part="roof">
          <Block x={60} y={60} w={78} h={4} d={20} s={s} />
          {[20, 150].map((x) => (
            <Block key={x} x={x - 2} y={52} w={28} h={4} d={11} s={s} />
          ))}
          <rect x={107} y={16} width={3} height={40} fill={m.metal.dark} />
          <Beacon cx={108.5} cy={14} s={s} lit={lit} r={6} />
        </g>
        <g data-part="decorations"><Decorations kind={decoration} x={46} y={98} w={104} h={78} s={s} lit={lit} /></g>
      </g>
    );
  }
  const big = level >= 2;
  const towerTop = big ? 72 : 96;
  return (
    <g>
      <g data-part="shadows"><Shadow cx={100} cy={180} rx={86} /></g>
      <g data-part="base-structure">
        {[18, 150].map((x) => (
          <g key={x}>
            <Block x={x} y={towerTop} w={26} h={176 - towerTop} d={10} s={m.stone} />
            <Window x={x + 8} y={towerTop + 16} w={10} h={14} lit={lit} arch />
          </g>
        ))}
        <Block x={44} y={84} w={106} h={92} d={22} s={m.stone} />
        <rect x={44} y={128} width={106} height={3} fill={m.stone.dark} opacity={0.7} />
        <path d="M82 176 V146 A16 16 0 0 1 114 146 V176 Z" fill="#3a2a1c" />
        <path d="M86 176 V147 A12 12 0 0 1 110 147 V176 Z" fill={lit ? WINDOW_LIT : m.wood.dark} className={lit ? 'base-light is-lit' : undefined} />
        <Window x={56} y={100} w={14} h={16} lit={lit} arch />
        <Window x={124} y={100} w={14} h={16} lit={lit} arch />
      </g>
      <g data-part="roof">
        <GableRoof x={44} y={84} w={106} d={22} rise={48} s={s} />
        {big &&
          [18, 150].map((x) => <PyramidRoof key={x} x={x} y={towerTop} w={26} d={10} rise={26} s={s} />)}
        {big && <Flag x={97} y={18} s={s} h={20} />}
      </g>
      <g data-part="decorations"><Decorations kind={decoration} x={44} y={84} w={106} h={92} s={s} lit={lit} /></g>
    </g>
  );
}

const PATTERN_COLOR: Record<string, string> = {
  push: STONE.base,
  pull: WOOD.base,
  legs: '#ff5fd2',
  core: '#37d8ff',
  recovery: LEAF.base
};

/** A small piece of equipment per exercise type, lit when its sets are done. */
function Station({ pattern, x, y, done }: { pattern: string; x: number; y: number; done: boolean }) {
  const c = PATTERN_COLOR[pattern] ?? WINDOW_LIT;
  return (
    <g transform={`translate(${x} ${y})`} opacity={done ? 1 : 0.6}>
      <ellipse cx={0} cy={14} rx={18} ry={5} fill="#000" opacity={0.25} />
      {pattern === 'pull' && (
        <g>
          <rect x={-14} y={-14} width={3} height={28} fill={METAL.base} />
          <rect x={11} y={-14} width={3} height={28} fill={METAL.dark} />
          <rect x={-15} y={-16} width={30} height={3} fill={METAL.light} />
        </g>
      )}
      {pattern === 'push' && (
        <g>
          <rect x={-14} y={-2} width={3} height={14} fill={METAL.base} />
          <rect x={11} y={-2} width={3} height={14} fill={METAL.dark} />
          <rect x={-17} y={-4} width={10} height={3} fill={METAL.light} />
          <rect x={7} y={-4} width={10} height={3} fill={METAL.light} />
        </g>
      )}
      {pattern === 'legs' && <Block x={-12} y={0} w={20} h={10} d={6} s={WOOD} />}
      {pattern === 'core' && <rect x={-14} y={2} width={28} height={10} rx={5} fill={c} />}
      {pattern === 'recovery' && <rect x={-14} y={0} width={28} height={12} rx={2} fill={c} opacity={0.8} />}
      {done && (
        <g>
          <circle cx={14} cy={-14} r={6} fill={WINDOW_LIT} />
          <path d="M11 -14 L13.5 -11.5 L17 -16.5" fill="none" stroke="#3a2a00" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

function TrainingYard({ level, lit, s, m, decoration, plan }: BuildingProps & { plan?: TodayPlan | null }) {
  const stations = (plan?.exercises ?? []).slice(0, 6);
  const slots: Array<[number, number]> = [
    [56, 76],
    [100, 76],
    [144, 76],
    [56, 124],
    [100, 124],
    [144, 124]
  ];
  return (
    <g>
      <g data-part="shadows"><Shadow cx={100} cy={178} rx={90} /></g>
      <g data-part="base-structure">
        <polygon points="16,176 184,176 184,182 16,182" fill={GRASS.dark} />
        <rect x={16} y={36} width={168} height={140} rx={6} fill={level >= 3 ? '#2f8a50' : GRASS.base} />
        <rect x={16} y={36} width={168} height={8} rx={4} fill={GRASS.light} opacity={0.5} />
        {level >= 3 && (
          <g fill="none" stroke="#e8ffe9" strokeOpacity={0.55} strokeWidth={2}>
            <rect x={26} y={46} width={148} height={120} rx={10} />
            <line x1={100} y1={46} x2={100} y2={166} />
          </g>
        )}
        {stations.length
          ? stations.map((station, i) => (
              <Station key={station.id} pattern={station.pattern} x={slots[i][0]} y={slots[i][1]} done={station.done >= station.target} />
            ))
          : slots.slice(0, 3).map(([x, y]) => <Station key={x} pattern="recovery" x={x} y={y + 24} done={false} />)}
      </g>
      <g data-part="roof">
        {/* Fence: posts in the theme colour, rails in wood or metal. */}
        {[16, 50, 84, 116, 150, 184].map((x) => (
          <rect key={x} x={x - 2.5} y={level >= 2 ? 22 : 28} width={5} height={level >= 2 ? 16 : 10} fill={s.base} />
        ))}
        <rect x={14} y={level >= 2 ? 26 : 30} width={172} height={3} fill={level >= 2 ? m.metal.light : m.wood.base} />
        {level >= 2 &&
          [16, 184].map((x) => (
            <g key={x}>
              <rect x={x - 1.5} y={4} width={3} height={22} fill={m.metal.dark} />
              <Beacon cx={x} cy={4} s={s} lit={lit} r={4} />
            </g>
          ))}
        {level >= 3 && (
          <g>
            <Block x={76} y={8} w={48} h={14} d={6} s={m.metal} />
            <rect x={80} y={11} width={40} height={8} fill={lit ? s.light : s.dark} className={lit ? 'base-light is-lit' : undefined} />
          </g>
        )}
      </g>
      <g data-part="decorations"><Decorations kind={decoration} x={16} y={150} w={168} h={26} s={s} lit={lit} /></g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Decor
// ---------------------------------------------------------------------------

function Decor({ id, lit, style, color }: { id: string; lit: boolean; style?: string; color?: string }) {
  const accent = color ? THEME_SHADES[color as PaletteId] : undefined;
  switch (id) {
    case 'path': {
      if (style === 'wood') {
        return (
          <g>
            {[10, 32, 54, 76].map((y) => (
              <g key={y}>
                <rect x={8} y={y + 3} width={84} height={14} rx={2} fill={WOOD.dark} />
                <rect x={8} y={y} width={84} height={14} rx={2} fill={WOOD.base} />
                <rect x={8} y={y} width={84} height={3} rx={1.5} fill={WOOD.light} />
              </g>
            ))}
          </g>
        );
      }
      if (style === 'tiles') {
        return (
          <g>
            {[8, 52].flatMap((x) =>
              [8, 52].map((y) => (
                <g key={`${x}${y}`}>
                  <rect x={x} y={y + 3} width={40} height={38} rx={3} fill="#2a3446" />
                  <rect x={x} y={y} width={40} height={38} rx={3} fill="#4a5a74" />
                  <rect x={x + 2} y={y + 2} width={36} height={4} rx={2} fill="#7fdcff" opacity={0.35} />
                </g>
              ))
            )}
          </g>
        );
      }
      return (
        <g>
          {[
            [10, 12, 34, 24],
            [50, 8, 40, 28],
            [8, 42, 30, 32],
            [44, 42, 46, 24],
            [42, 72, 40, 20],
            [8, 78, 28, 14]
          ].map(([x, y, w, h]) => (
            <g key={`${x}${y}`}>
              <rect x={x} y={y + 3} width={w} height={h} rx={7} fill={STONE.dark} />
              <rect x={x} y={y} width={w} height={h} rx={7} fill={STONE.base} />
              <rect x={x + 3} y={y + 2} width={w - 6} height={4} rx={2} fill={STONE.light} opacity={0.8} />
            </g>
          ))}
        </g>
      );
    }
    case 'wall':
      if (style === 'hedge') {
        return (
          <g>
            <Shadow rx={44} cy={84} />
            <rect x={6} y={50} width={88} height={32} rx={12} fill={LEAF.dark} />
            <rect x={6} y={44} width={88} height={30} rx={12} fill={LEAF.base} />
            {[16, 34, 52, 70, 86].map((x) => (
              <circle key={x} cx={x} cy={50} r={6} fill={LEAF.light} opacity={0.6} />
            ))}
          </g>
        );
      }
      if (style === 'fence') {
        return (
          <g>
            <Shadow rx={44} cy={84} />
            <rect x={6} y={56} width={88} height={4} fill={WOOD.dark} />
            <rect x={6} y={70} width={88} height={4} fill={WOOD.dark} />
            {[12, 30, 48, 66, 84].map((x) => (
              <g key={x}>
                <polygon points={`${x - 5},84 ${x - 5},44 ${x},38 ${x + 5},44 ${x + 5},84`} fill={WOOD.base} />
                <polygon points={`${x},38 ${x + 5},44 ${x + 5},84 ${x + 2},84 ${x + 2},44`} fill={WOOD.dark} />
                <rect x={x - 5} y={44} width={2} height={40} fill={WOOD.light} opacity={0.7} />
              </g>
            ))}
          </g>
        );
      }
      return (
        <g>
          <Shadow rx={44} cy={84} />
          <Block x={6} y={52} w={82} h={28} d={8} s={STONE} />
          {[6, 28, 50, 72].map((x) => (
            <Block key={x} x={x} y={42} w={14} h={10} d={4} s={STONE} />
          ))}
          <rect x={6} y={65} width={82} height={1.5} fill={STONE.dark} opacity={0.6} />
          {[20, 44, 68].map((x) => (
            <rect key={x} x={x} y={52} width={1.5} height={13} fill={STONE.dark} opacity={0.6} />
          ))}
        </g>
      );
    case 'pine':
      if (style === 'oak') {
        return (
          <g>
            <Shadow rx={30} />
            <rect x={45} y={58} width={10} height={30} rx={2} fill={WOOD.base} />
            <rect x={51} y={58} width={4} height={30} fill={WOOD.dark} />
            <circle cx={50} cy={42} r={28} fill={LEAF.dark} />
            <circle cx={46} cy={38} r={25} fill={LEAF.base} />
            <circle cx={38} cy={30} r={10} fill={LEAF.light} opacity={0.7} />
          </g>
        );
      }
      if (style === 'palm') {
        return (
          <g>
            <Shadow rx={22} />
            <path d="M48 88 C 50 70, 44 50, 50 30 L56 30 C 50 50, 56 70, 54 88 Z" fill={WOOD.base} />
            {[
              'M52 30 C 40 16, 22 20, 12 34 C 26 26, 40 28, 52 30',
              'M52 30 C 64 16, 82 20, 90 34 C 76 26, 62 28, 52 30',
              'M52 30 C 42 30, 30 42, 28 56 C 36 44, 44 36, 52 30',
              'M52 30 C 62 30, 74 42, 76 56 C 68 44, 60 36, 52 30'
            ].map((d, i) => (
              <path key={d} d={d} fill={i % 2 ? LEAF.dark : LEAF.base} />
            ))}
            <circle cx={52} cy={31} r={4} fill={WOOD.dark} />
          </g>
        );
      }
      if (style === 'cherry') {
        return (
          <g>
            <Shadow rx={30} />
            <rect x={46} y={58} width={8} height={30} rx={2} fill={WOOD.base} />
            <circle cx={50} cy={42} r={27} fill="#c2588f" />
            <circle cx={46} cy={38} r={24} fill="#ff9ed4" />
            <circle cx={38} cy={30} r={9} fill="#ffd1ea" />
            {[
              [58, 34],
              [52, 50],
              [34, 48],
              [64, 48]
            ].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r={3} fill="#fff0f8" />
            ))}
          </g>
        );
      }
      return (
        <g>
          <Shadow rx={26} />
          <rect x={46} y={70} width={8} height={18} fill={WOOD.base} />
          <polygon points="50,6 74,46 26,46" fill={LEAF.base} />
          <polygon points="50,6 74,46 52,46" fill={LEAF.dark} />
          <polygon points="50,26 80,76 20,76" fill={LEAF.base} />
          <polygon points="50,26 80,76 52,76" fill={LEAF.dark} />
          <polygon points="50,8 34,36 40,36" fill={LEAF.light} opacity={0.6} />
        </g>
      );
    case 'lamp': {
      const glow = accent?.light ?? WINDOW_LIT;
      const head =
        style === 'neon' ? (
          <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
            {lit && <rect x={38} y={16} width={24} height={72} rx={12} fill={glow} opacity={0.18} />}
            <rect x={46} y={22} width={8} height={64} rx={4} fill={lit ? glow : accent?.dark ?? WINDOW_DARK} />
            <rect x={47} y={24} width={3} height={60} rx={1.5} fill="#fff" opacity={lit ? 0.6 : 0.15} />
          </g>
        ) : style === 'lantern' ? (
          <g>
            <path d="M34 88 V30 H60" fill="none" stroke={METAL.dark} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <Block x={52} y={32} w={14} h={18} d={4} s={METAL} />
            <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
              {lit && <circle cx={59} cy={41} r={18} fill={glow} opacity={0.2} />}
              <rect x={55} y={35} width={8} height={12} rx={2} fill={lit ? glow : WINDOW_DARK} />
            </g>
          </g>
        ) : (
          <g>
            <rect x={48} y={36} width={5} height={52} fill={METAL.base} />
            <rect x={51} y={36} width={2} height={52} fill={METAL.dark} />
            <polygon points="40,36 60,36 56,28 44,28" fill={METAL.dark} />
            <g className={lit ? 'base-light is-lit' : 'base-light-off'}>
              {lit && <circle cx={50} cy={22} r={18} fill={glow} opacity={0.22} />}
              <circle cx={50} cy={22} r={7} fill={lit ? glow : WINDOW_DARK} />
            </g>
            <polygon points="42,16 58,16 54,10 46,10" fill={METAL.base} />
          </g>
        );
      return (
        <g>
          <Shadow rx={14} />
          {style === 'neon' && <rect x={40} y={84} width={20} height={5} rx={2} fill={METAL.dark} />}
          {head}
        </g>
      );
    }
    case 'banner': {
      const flag = accent ?? THEME_SHADES.amber;
      return (
        <g>
          <Shadow rx={14} />
          <rect x={32} y={10} width={4} height={80} fill={METAL.base} />
          <rect x={34} y={10} width={2} height={80} fill={METAL.dark} />
          <circle cx={34} cy={9} r={3.5} fill={WINDOW_LIT} />
          <path d="M36 14 H76 V58 L56 48 L36 58 Z" fill={flag.base} />
          <path d="M60 14 H76 V58 L60 50 Z" fill={flag.dark} />
          {style === 'stripe' && <rect x={36} y={26} width={40} height={7} fill="#fff" opacity={0.9} />}
          {style === 'chevron' && <path d="M36 22 L56 34 L76 22 V31 L56 43 L36 31 Z" fill="#fff" opacity={0.9} />}
          <rect x={36} y={14} width={40} height={3} fill={flag.light} />
        </g>
      );
    }
    case 'garden': {
      const flowers =
        style === 'roses'
          ? [THEME_SHADES.red.base, THEME_SHADES.red.light]
          : style === 'lavender'
            ? [THEME_SHADES.violet.base, THEME_SHADES.violet.light]
            : style === 'tulips'
              ? [accent?.base ?? THEME_SHADES.magenta.base, accent?.light ?? THEME_SHADES.magenta.light]
              : ['#ff5fd2', WINDOW_LIT, '#37d8ff', '#ffffff'];
      return (
        <g>
          <Shadow rx={40} cy={86} />
          <Block x={10} y={56} w={72} h={22} d={10} s={WOOD} />
          <polygon points="12,56 17,53 80,53 80,56" fill="#5a3a1c" />
          {[
            [20, 50],
            [34, 46],
            [48, 50],
            [62, 46],
            [74, 50],
            [27, 40],
            [55, 40],
            [69, 38]
          ].map(([x, y], i) => (
            <g key={`${x}${y}`}>
              <rect x={x - 0.8} y={y} width={1.6} height={8} fill={LEAF.dark} />
              {style === 'lavender' ? (
                <rect x={x - 2.5} y={y - 9} width={5} height={11} rx={2.5} fill={flowers[i % 2]} />
              ) : style === 'tulips' ? (
                <path d={`M${x - 5} ${y} Q${x - 5} ${y - 10} ${x} ${y - 8} Q${x + 5} ${y - 10} ${x + 5} ${y} Z`} fill={flowers[i % 2]} />
              ) : (
                <circle cx={x} cy={y - 2} r={4.5} fill={flowers[i % flowers.length]} />
              )}
              {!style || style === 'wildflowers' || style === 'roses' ? <circle cx={x} cy={y - 2} r={1.5} fill="#fff4b0" /> : null}
            </g>
          ))}
        </g>
      );
    }
    case 'fountain': {
      const water = (
        <g className={lit ? 'base-light is-lit' : undefined}>
          <ellipse cx={50} cy={66} rx={28} ry={10} fill={GLASS.dark} />
          <ellipse cx={50} cy={67} rx={26} ry={8.5} fill={GLASS.base} />
          <ellipse cx={42} cy={65} rx={9} ry={2.5} fill={GLASS.light} opacity={0.8} />
        </g>
      );
      return (
        <g>
          <Shadow rx={40} cy={86} />
          <ellipse cx={50} cy={72} rx={38} ry={16} fill={STONE.dark} />
          <ellipse cx={50} cy={66} rx={38} ry={16} fill={STONE.base} />
          {water}
          {style === 'tiered' ? (
            <g>
              <rect x={46} y={30} width={8} height={36} fill={STONE.base} />
              <rect x={51} y={30} width={3} height={36} fill={STONE.dark} />
              <ellipse cx={50} cy={36} rx={18} ry={6} fill={STONE.dark} />
              <ellipse cx={50} cy={33} rx={18} ry={6} fill={STONE.light} />
              <ellipse cx={50} cy={33} rx={13} ry={3.5} fill={GLASS.base} />
              <path d="M50 30 V18" stroke={GLASS.light} strokeWidth={3} strokeLinecap="round" />
            </g>
          ) : style === 'jet' ? (
            <g className={lit ? 'base-light is-lit' : undefined}>
              <path d="M47 66 Q50 30 50 8 Q50 30 53 66 Z" fill={GLASS.base} />
              <path d="M49 66 Q50 30 50 10" stroke={GLASS.light} strokeWidth={1.5} fill="none" />
              <circle cx={50} cy={9} r={5} fill={GLASS.light} opacity={0.7} />
            </g>
          ) : (
            <g>
              <rect x={46} y={40} width={8} height={26} fill={STONE.base} />
              <rect x={51} y={40} width={3} height={26} fill={STONE.dark} />
              <path d="M50 40 C 40 24, 30 30, 28 48" fill="none" stroke={GLASS.base} strokeWidth={4} strokeLinecap="round" />
              <path d="M50 40 C 60 24, 70 30, 72 48" fill="none" stroke={GLASS.light} strokeWidth={4} strokeLinecap="round" />
            </g>
          )}
        </g>
      );
    }
    case 'bush':
      return (
        <g>
          <Shadow rx={26} cy={86} />
          <ellipse cx={50} cy={70} rx={30} ry={18} fill={LEAF.dark} />
          <circle cx={36} cy={62} r={16} fill={LEAF.base} />
          <circle cx={58} cy={58} r={18} fill={LEAF.base} />
          <circle cx={50} cy={50} r={10} fill={LEAF.light} opacity={0.6} />
          {style === 'flowering' &&
            [
              [34, 56],
              [52, 48],
              [64, 60],
              [44, 66],
              [60, 70]
            ].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={3.2} fill={x % 2 ? '#ffd1ea' : '#fff4b0'} />)}
        </g>
      );
    case 'rock':
      return (
        <g>
          <Shadow rx={30} cy={84} />
          <polygon points="20,80 26,52 46,38 70,44 82,66 74,82" fill={STONE.base} />
          <polygon points="46,38 70,44 82,66 60,60" fill={STONE.dark} />
          <polygon points="26,52 46,38 60,60 36,64" fill={STONE.light} />
          {style === 'mossy' && <path d="M24 60 Q38 50 50 56 Q62 48 72 52 L70 58 Q56 56 44 62 Q32 58 24 66 Z" fill={LEAF.base} />}
        </g>
      );
    case 'flowers': {
      const c = accent ?? THEME_SHADES.magenta;
      return (
        <g>
          {[
            [24, 32],
            [44, 22],
            [66, 30],
            [30, 58],
            [54, 50],
            [74, 62],
            [40, 78],
            [64, 82],
            [18, 80]
          ].map(([x, y], i) => (
            <g key={`${x}${y}`}>
              <rect x={x - 0.8} y={y} width={1.6} height={7} fill={LEAF.dark} />
              <circle cx={x} cy={y} r={4.5} fill={i % 3 === 0 ? c.light : i % 3 === 1 ? c.base : '#fff4b0'} />
              <circle cx={x} cy={y} r={1.6} fill="#fff4b0" />
            </g>
          ))}
        </g>
      );
    }
    case 'bench': {
      const c = accent ?? WOOD;
      return (
        <g>
          <Shadow rx={34} cy={84} />
          <rect x={18} y={66} width={4} height={18} fill={METAL.dark} />
          <rect x={78} y={66} width={4} height={18} fill={METAL.dark} />
          <Block x={14} y={60} w={70} h={7} d={8} s={c} />
          <Block x={14} y={42} w={70} h={6} d={4} s={c} />
          <rect x={18} y={48} width={3} height={12} fill={METAL.base} />
          <rect x={77} y={48} width={3} height={12} fill={METAL.base} />
        </g>
      );
    }
    case 'campfire':
      return (
        <g>
          <Shadow rx={30} cy={84} />
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return <circle key={deg} cx={50 + Math.cos(rad) * 22} cy={74 + Math.sin(rad) * 9} r={5} fill={STONE.base} />;
          })}
          <rect x={30} y={70} width={40} height={6} rx={3} fill={WOOD.dark} transform="rotate(-14 50 73)" />
          <rect x={30} y={70} width={40} height={6} rx={3} fill={WOOD.base} transform="rotate(14 50 73)" />
          <g className={lit ? 'base-flame' : undefined}>
            <path d="M50 30 C 62 46, 64 58, 50 70 C 36 58, 40 46, 50 30 Z" fill={lit ? FIRE : '#7a3a20'} />
            <path d="M50 46 C 56 54, 56 62, 50 68 C 44 62, 44 54, 50 46 Z" fill={lit ? WINDOW_LIT : '#a0522d'} />
          </g>
          {lit && <circle cx={50} cy={60} r={26} fill={FIRE} opacity={0.16} />}
        </g>
      );
    case 'picnic': {
      const cloth = accent ?? THEME_SHADES.red;
      return (
        <g>
          <Shadow rx={38} cy={86} />
          <Block x={10} y={72} w={80} h={5} d={6} s={WOOD} />
          <rect x={22} y={56} width={4} height={24} fill={WOOD.dark} />
          <rect x={74} y={56} width={4} height={24} fill={WOOD.dark} />
          <Block x={14} y={50} w={72} h={7} d={10} s={cloth} />
          {[20, 36, 52, 68].map((x) => (
            <rect key={x} x={x} y={50} width={7} height={7} fill="#fff" opacity={0.75} />
          ))}
          <circle cx={42} cy={46} r={4} fill={THEME_SHADES.lime.base} />
          <rect x={56} y={40} width={6} height={8} rx={1} fill={WINDOW_LIT} />
        </g>
      );
    }
    case 'gazebo': {
      const roof = accent ?? THEME_SHADES.white;
      return (
        <g>
          <Shadow rx={40} cy={86} />
          <ellipse cx={50} cy={82} rx={38} ry={10} fill={STONE.dark} />
          <ellipse cx={50} cy={79} rx={38} ry={10} fill={STONE.light} />
          {[20, 40, 60, 80].map((x) => (
            <rect key={x} x={x - 2} y={38} width={4} height={42} fill={x > 50 ? WOOD.dark : WOOD.light} />
          ))}
          <polygon points="8,40 50,8 92,40" fill={roof.base} />
          <polygon points="50,8 92,40 60,40" fill={roof.dark} />
          <rect x={8} y={38} width={84} height={5} fill={roof.dark} />
          {lit && <circle cx={50} cy={50} r={4} fill={WINDOW_LIT} className="base-light is-lit" />}
        </g>
      );
    }
    case 'torch':
      return (
        <g>
          <Shadow rx={12} />
          <rect x={47} y={40} width={6} height={48} fill={WOOD.base} />
          <rect x={50} y={40} width={3} height={48} fill={WOOD.dark} />
          <rect x={44} y={36} width={12} height={6} fill={METAL.dark} />
          <g className={lit ? 'base-flame' : undefined}>
            <path d="M50 8 C 60 20, 60 30, 50 36 C 40 30, 40 20, 50 8 Z" fill={lit ? FIRE : '#7a3a20'} />
            <path d="M50 20 C 54 26, 54 31, 50 34 C 46 31, 46 26, 50 20 Z" fill={lit ? WINDOW_LIT : '#a0522d'} />
          </g>
          {lit && <circle cx={50} cy={26} r={18} fill={FIRE} opacity={0.18} />}
        </g>
      );
    case 'lanterns': {
      const c = accent ?? THEME_SHADES.amber;
      return (
        <g>
          <Shadow rx={40} cy={88} />
          <rect x={10} y={20} width={4} height={68} fill={WOOD.dark} />
          <rect x={86} y={20} width={4} height={68} fill={WOOD.dark} />
          <path d="M12 22 Q50 46 88 22" fill="none" stroke={METAL.dark} strokeWidth={1.5} />
          {[24, 37, 50, 63, 76].map((x, i) => {
            const y = 22 + Math.sin((i + 1) * 0.6) * 16;
            return (
              <g key={x} className={lit ? 'base-light is-lit' : 'base-light-off'}>
                <rect x={x - 4} y={y + 2} width={8} height={10} rx={2} fill={lit ? (i % 2 ? c.light : c.base) : c.dark} />
              </g>
            );
          })}
        </g>
      );
    }
    case 'arch': {
      const c = accent ?? THEME_SHADES.magenta;
      return (
        <g>
          <Shadow rx={34} cy={86} />
          <rect x={18} y={36} width={8} height={50} fill={WOOD.base} />
          <rect x={74} y={36} width={8} height={50} fill={WOOD.dark} />
          <path d="M18 40 A32 30 0 0 1 82 40 L74 40 A24 22 0 0 0 26 40 Z" fill={WOOD.base} />
          {[
            [20, 44],
            [24, 30],
            [34, 20],
            [48, 14],
            [62, 18],
            [74, 28],
            [80, 42],
            [22, 60],
            [80, 62]
          ].map(([x, y], i) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={5} fill={i % 2 ? c.light : c.base} />
          ))}
          {[30, 52, 70].map((x) => (
            <circle key={x} cx={x} cy={x === 52 ? 12 : 24} r={4} fill={LEAF.base} />
          ))}
        </g>
      );
    }
    case 'statue': {
      const m = THEME_SHADES.white;
      return (
        <g>
          <Shadow rx={28} cy={88} />
          <Block x={28} y={70} w={40} h={18} d={8} s={STONE} />
          {style === 'runner' ? (
            <g>
              <circle cx={52} cy={20} r={7} fill={m.base} />
              <path d="M50 28 L46 48 L36 62 M46 48 L58 60 L60 70 M48 32 L36 40 M50 32 L64 26" stroke={m.base} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M50 28 L46 48 M48 32 L36 40" stroke={m.dark} strokeWidth={3} strokeLinecap="round" fill="none" />
            </g>
          ) : (
            <g>
              <circle cx={50} cy={22} r={7} fill={m.base} />
              <path d="M38 34 H62 L58 56 H42 Z" fill={m.base} />
              <path d="M50 34 H62 L58 56 H50 Z" fill={m.dark} />
              <path d="M38 36 L28 28 L30 16 M62 36 L72 28 L70 16" stroke={m.base} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M44 56 L42 70 M56 56 L58 70" stroke={m.dark} strokeWidth={7} strokeLinecap="round" />
            </g>
          )}
        </g>
      );
    }
    case 'plyobox': {
      const c = accent ?? WOOD;
      return (
        <g>
          <Shadow rx={30} cy={86} />
          <Block x={24} y={48} w={44} h={36} d={14} s={c} />
          <rect x={38} y={60} width={16} height={6} rx={3} fill={c.dark} />
        </g>
      );
    }
    case 'pullupbar': {
      const c = accent ?? METAL;
      return (
        <g>
          <Shadow rx={38} cy={88} />
          <rect x={16} y={18} width={6} height={70} fill={c.base} />
          <rect x={19} y={18} width={3} height={70} fill={c.dark} />
          <rect x={78} y={18} width={6} height={70} fill={c.base} />
          <rect x={81} y={18} width={3} height={70} fill={c.dark} />
          <rect x={12} y={16} width={76} height={5} rx={2.5} fill={METAL.light} />
          <rect x={12} y={19} width={76} height={2} fill={METAL.dark} />
          <rect x={14} y={84} width={10} height={4} fill={STONE.dark} />
          <rect x={76} y={84} width={10} height={4} fill={STONE.dark} />
        </g>
      );
    }
    case 'dipbars': {
      const c = accent ?? METAL;
      return (
        <g>
          <Shadow rx={38} cy={88} />
          {[
            [16, 46],
            [76, 46],
            [26, 56],
            [86, 56]
          ].map(([x, y]) => (
            <rect key={`${x}${y}`} x={x} y={y} width={5} height={88 - y} fill={y > 50 ? c.dark : c.base} />
          ))}
          <rect x={14} y={44} width={68} height={5} rx={2.5} fill={METAL.light} />
          <rect x={24} y={54} width={68} height={5} rx={2.5} fill={METAL.base} />
        </g>
      );
    }
    case 'punchbag': {
      const c = accent ?? THEME_SHADES.red;
      return (
        <g>
          <Shadow rx={26} cy={88} />
          <rect x={20} y={8} width={5} height={80} fill={METAL.dark} />
          <rect x={20} y={8} width={42} height={5} fill={METAL.base} />
          <line x1={56} y1={13} x2={56} y2={24} stroke={METAL.dark} strokeWidth={2} />
          <rect x={44} y={24} width={24} height={50} rx={10} fill={c.base} />
          <rect x={58} y={24} width={10} height={50} rx={5} fill={c.dark} />
          <rect x={47} y={28} width={5} height={42} rx={2.5} fill={c.light} opacity={0.7} />
          <rect x={44} y={40} width={24} height={4} fill={c.dark} opacity={0.6} />
        </g>
      );
    }
    case 'lilypad':
      return (
        <g>
          <path d="M50 50 m-24 0 a24 14 0 1 0 48 0 a24 14 0 1 0 -48 0 Z M50 50 L70 44" fill={LEAF.base} />
          <path d="M50 50 L72 42 A24 14 0 0 1 74 50 Z" fill="#1f5e3b" />
          <ellipse cx={42} cy={47} rx={9} ry={4} fill={LEAF.light} opacity={0.6} />
          <circle cx={36} cy={64} r={9} fill={LEAF.dark} />
          <circle cx={60} cy={30} r={6} fill="#ffc2e6" />
          <circle cx={60} cy={30} r={2.5} fill="#fff4b0" />
        </g>
      );
    case 'bridge':
      return (
        <g>
          <Shadow rx={44} cy={80} />
          {[10, 26, 42, 58, 74].map((x) => (
            <g key={x}>
              <rect x={x} y={40 + 2} width={14} height={34} fill={WOOD.dark} />
              <rect x={x} y={40} width={14} height={32} fill={WOOD.base} />
              <rect x={x} y={40} width={14} height={3} fill={WOOD.light} />
            </g>
          ))}
          <rect x={8} y={30} width={84} height={4} rx={2} fill={WOOD.dark} />
          {[10, 50, 88].map((x) => (
            <rect key={x} x={x - 2} y={30} width={4} height={14} fill={WOOD.dark} />
          ))}
        </g>
      );
    case 'hay':
      return (
        <g>
          <Shadow rx={30} cy={86} />
          <Block x={18} y={52} w={56} h={32} d={14} s={{ light: '#f6df8a', base: '#e2bf5a', dark: '#a8862f' }} />
          {[60, 70].map((y) => (
            <rect key={y} x={18} y={y} width={56} height={2.5} fill="#a8862f" opacity={0.7} />
          ))}
          <path d="M22 52 l3 -6 M34 52 l2 -7 M48 52 l3 -6 M62 52 l2 -6" stroke="#f6df8a" strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case 'barrels':
      return (
        <g>
          <Shadow rx={32} cy={86} />
          {[
            [32, 62],
            [62, 62],
            [47, 40]
          ].map(([cx, cy]) => (
            <g key={`${cx}${cy}`}>
              <rect x={cx - 13} y={cy - 4} width={26} height={26} rx={6} fill={WOOD.base} />
              <rect x={cx + 3} y={cy - 4} width={10} height={26} rx={4} fill={WOOD.dark} />
              <ellipse cx={cx} cy={cy - 4} rx={13} ry={5} fill={WOOD.light} />
              <rect x={cx - 13} y={cy + 3} width={26} height={2.5} fill={METAL.dark} />
              <rect x={cx - 13} y={cy + 14} width={26} height={2.5} fill={METAL.dark} />
            </g>
          ))}
        </g>
      );
    case 'pumpkins':
      return (
        <g>
          <Shadow rx={32} cy={86} />
          {[
            [34, 70, 14],
            [62, 72, 11],
            [50, 56, 9]
          ].map(([cx, cy, r]) => (
            <g key={`${cx}${cy}`}>
              <ellipse cx={cx} cy={cy} rx={r * 1.15} ry={r} fill="#d9661f" />
              <ellipse cx={cx - r * 0.35} cy={cy} rx={r * 0.45} ry={r * 0.95} fill="#f08a2e" />
              <ellipse cx={cx + r * 0.45} cy={cy} rx={r * 0.35} ry={r * 0.9} fill="#b8521a" />
              <rect x={cx - 1.5} y={cy - r - 5} width={3} height={6} rx={1} fill={LEAF.dark} />
            </g>
          ))}
        </g>
      );
    case 'birdhouse': {
      const c = accent ?? THEME_SHADES.red;
      return (
        <g>
          <Shadow rx={14} />
          <rect x={47} y={50} width={6} height={38} fill={WOOD.dark} />
          <Block x={36} y={30} w={24} h={22} d={8} s={WOOD} />
          <circle cx={48} cy={40} r={4} fill="#2a1a10" />
          <polygon points="32,32 48,16 64,32" fill={c.base} />
          <polygon points="48,16 64,32 72,27 56,11" fill={c.dark} />
          <circle cx={68} cy={22} r={3.5} fill="#ffd76a" className="base-bob" />
        </g>
      );
    }
    case 'coop': {
      const c = accent ?? THEME_SHADES.red;
      return (
        <g>
          <Shadow rx={36} cy={86} />
          <Block x={18} y={50} w={52} h={34} d={14} s={WOOD} />
          {[58, 66, 74].map((y) => (
            <rect key={y} x={18} y={y} width={52} height={1.2} fill={WOOD.dark} opacity={0.6} />
          ))}
          <rect x={36} y={66} width={14} height={18} rx={7} fill="#2a1a10" />
          <rect x={30} y={78} width={26} height={3} fill={WOOD.light} transform="rotate(-12 43 80)" />
          <GableRoof x={18} y={50} w={52} d={14} rise={20} s={c} />
        </g>
      );
    }
    case 'beehive':
      return (
        <g>
          <Shadow rx={22} />
          <rect x={44} y={64} width={6} height={24} fill={WOOD.dark} />
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={47} cy={62 - i * 9} rx={20 - i * 3.5} ry={6} fill={i % 2 ? '#e2bf5a' : '#f6d36b'} />
          ))}
          <ellipse cx={47} cy={34} rx={7} ry={4} fill="#f6df8a" />
          <ellipse cx={47} cy={58} rx={4} ry={3} fill="#5a3a10" />
          <g className="base-buzz">
            <circle cx={70} cy={30} r={2.5} fill="#2a2a2a" />
            <circle cx={70} cy={30} r={1.2} fill="#ffd76a" />
            <circle cx={26} cy={42} r={2.5} fill="#2a2a2a" />
            <circle cx={26} cy={42} r={1.2} fill="#ffd76a" />
          </g>
        </g>
      );
    case 'well':
      return (
        <g>
          <Shadow rx={30} cy={86} />
          <ellipse cx={50} cy={78} rx={26} ry={9} fill={STONE.dark} />
          <rect x={24} y={58} width={52} height={20} fill={STONE.base} />
          <rect x={56} y={58} width={20} height={20} fill={STONE.dark} />
          <ellipse cx={50} cy={58} rx={26} ry={9} fill={STONE.light} />
          <ellipse cx={50} cy={58} rx={18} ry={5.5} fill="#1f3a52" />
          <rect x={24} y={20} width={4} height={40} fill={WOOD.dark} />
          <rect x={72} y={20} width={4} height={40} fill={WOOD.dark} />
          <polygon points="18,24 50,8 82,24" fill={THEME_SHADES.red.base} />
          <polygon points="50,8 82,24 66,24" fill={THEME_SHADES.red.dark} />
          <rect x={46} y={30} width={8} height={10} rx={1} fill={WOOD.base} />
        </g>
      );
    case 'barn': {
      const c = accent ?? THEME_SHADES.red;
      const walls = { light: mixHex(c.light, '#ffffff', 0.25), base: c.base, dark: c.dark };
      return (
        <g>
          <Shadow rx={40} cy={88} />
          <Block x={12} y={46} w={64} h={42} d={14} s={walls} />
          <rect x={30} y={60} width={28} height={28} fill="#ffffff" opacity={0.9} />
          <rect x={33} y={63} width={22} height={25} fill={c.dark} />
          <path d="M33 63 L55 88 M55 63 L33 88" stroke="#ffffff" strokeWidth={2.5} />
          <polygon points="10,48 22,28 44,18 66,28 78,48" fill={STONE.dark} />
          <polygon points="44,18 66,28 78,48 92,40 80,22 58,12" fill={STONE.base} />
          <rect x={38} y={30} width={12} height={10} rx={1.5} fill={WINDOW_LIT} opacity={0.85} />
        </g>
      );
    }
    case 'windmill': {
      const c = accent ?? THEME_SHADES.white;
      return (
        <g>
          <Shadow rx={26} cy={88} />
          <polygon points="34,88 40,30 60,30 66,88" fill={STONE.base} />
          <polygon points="52,30 60,30 66,88 56,88" fill={STONE.dark} />
          <polygon points="36,32 50,16 64,32" fill={c.base} />
          <polygon points="50,16 64,32 56,32" fill={c.dark} />
          <rect x={44} y={66} width={12} height={22} rx={6} fill={WOOD.dark} />
          <g transform="translate(50 32)">
            <g className="base-spin">
              {[0, 90, 180, 270].map((deg) => (
                <g key={deg} transform={`rotate(${deg})`}>
                  <rect x={-2} y={-34} width={4} height={34} fill={WOOD.dark} />
                  <rect x={2} y={-32} width={10} height={24} fill={WOOD.light} opacity={0.95} />
                </g>
              ))}
            </g>
            <circle r={4} fill={METAL.dark} />
          </g>
        </g>
      );
    }
    case 'signpost':
      return (
        <g>
          <Shadow rx={16} />
          <rect x={46} y={20} width={7} height={68} fill={WOOD.base} />
          <rect x={50} y={20} width={3} height={68} fill={WOOD.dark} />
          <polygon points="24,26 66,26 74,33 66,40 24,40" fill={WOOD.light} />
          <polygon points="76,46 34,46 26,53 34,60 76,60" fill={WOOD.base} />
          <rect x={32} y={31} width={26} height={3} rx={1.5} fill={WOOD.dark} opacity={0.6} />
          <rect x={40} y={51} width={28} height={3} rx={1.5} fill={WOOD.dark} opacity={0.6} />
        </g>
      );
    case 'tent': {
      const c = accent ?? THEME_SHADES.amber;
      return (
        <g>
          <Shadow rx={38} cy={86} />
          <polygon points="12,84 46,26 80,84" fill={c.base} />
          <polygon points="46,26 80,84 92,76 58,20" fill={c.dark} />
          <polygon points="38,84 46,56 54,84" fill="#2a1a10" />
          <polygon points="46,26 30,56 36,56" fill={c.light} opacity={0.6} />
          <line x1={46} y1={26} x2={46} y2={14} stroke={WOOD.dark} strokeWidth={3} />
          <polygon points="46,14 58,17 46,20" fill={THEME_SHADES.lime.base} />
        </g>
      );
    }
    case 'parasol': {
      const c = accent ?? THEME_SHADES.cyan;
      return (
        <g>
          <ellipse cx={50} cy={84} rx={34} ry={8} fill="#000" opacity={0.2} />
          <rect x={48} y={30} width={4} height={56} fill="#f4f4f0" />
          <path d="M14 34 Q50 4 86 34 Z" fill={c.base} />
          {[26, 50, 74].map((x) => (
            <path key={x} d={`M${x - 12} 34 Q${x} 14 ${x + 12} 34`} fill="#ffffff" opacity={x === 50 ? 0.9 : 0} />
          ))}
          <path d="M14 34 Q32 28 38 34 Q50 28 62 34 Q68 28 86 34" fill="none" stroke={c.dark} strokeWidth={3} />
          <rect x={20} y={72} width={36} height={8} rx={3} fill={THEME_SHADES.lime.light} transform="rotate(-8 38 76)" />
        </g>
      );
    }
    case 'sandcastle':
      return (
        <g>
          <Shadow rx={34} cy={86} />
          <Block x={22} y={56} w={48} h={28} d={10} s={{ light: '#f3dca4', base: '#d9b672', dark: '#a8864a' }} />
          {[22, 38, 54].map((x) => (
            <Block key={x} x={x} y={46} w={12} h={10} d={4} s={{ light: '#f3dca4', base: '#d9b672', dark: '#a8864a' }} />
          ))}
          <rect x={40} y={68} width={10} height={16} rx={5} fill="#a8864a" />
          <line x1={46} y1={46} x2={46} y2={28} stroke={WOOD.dark} strokeWidth={2} />
          <polygon points="46,28 58,32 46,36" fill={THEME_SHADES.red.base} />
        </g>
      );
    case 'snowman': {
      const scarf = accent ?? THEME_SHADES.red;
      return (
        <g>
          <Shadow rx={22} />
          <circle cx={50} cy={70} r={18} fill="#eef3f8" />
          <circle cx={56} cy={72} r={14} fill="#d6e0ea" opacity={0.6} />
          <circle cx={50} cy={42} r={13} fill="#ffffff" />
          <rect x={38} y={50} width={24} height={6} rx={3} fill={scarf.base} />
          <rect x={52} y={52} width={6} height={14} rx={3} fill={scarf.dark} />
          <circle cx={46} cy={39} r={1.8} fill="#2a2a2a" />
          <circle cx={54} cy={39} r={1.8} fill="#2a2a2a" />
          <polygon points="50,43 62,45 50,47" fill="#f08a2e" />
          <rect x={40} y={22} width={20} height={6} fill="#2a2a2a" />
          <rect x={44} y={12} width={12} height={12} fill="#2a2a2a" />
        </g>
      );
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Trophies
// ---------------------------------------------------------------------------

const TIER_SHADES: Record<TrophyTier, Shades> = {
  bronze: { light: '#f2b98a', base: '#c97f45', dark: '#8a4f24' },
  silver: { light: '#ffffff', base: '#cfd7e0', dark: '#8f9aa8' },
  gold: { light: '#fff0a8', base: '#f7c948', dark: '#b9861a' }
};

export function TrophyArt({
  trophyId,
  verified,
  style,
  color
}: {
  trophyId: string;
  verified?: boolean;
  style?: string;
  color?: string;
}) {
  const def = getTrophyDef(trophyId);
  if (!def) return null;
  const m = TIER_SHADES[def.tier];
  const accent = color ? THEME_SHADES[color as PaletteId] : undefined;
  const pedestal: Shades =
    style === 'marble'
      ? { light: '#ffffff', base: '#eef1f5', dark: '#b8c1cc' }
      : style === 'neon'
        ? { light: accent?.light ?? '#8eeaff', base: '#2a3142', dark: '#171c27' }
        : accent ?? STONE;
  return (
    <g>
      <Shadow rx={26} cy={90} />
      <g data-part="pedestal">
        <Block x={28} y={74} w={40} h={14} d={6} s={pedestal} />
        {style === 'neon' && <rect x={30} y={80} width={36} height={2.5} rx={1.2} fill={pedestal.light} className="base-light is-lit" />}
        {style === 'marble' && <path d="M32 80 q8 -4 14 1 t16 -2" fill="none" stroke="#a9b3c0" strokeWidth={1.2} />}
      </g>
      <g data-part="trophy">
        {def.shape === 'cup' && (
          <g>
            <path d="M33 26 H25 A9 9 0 0 0 34 42" fill="none" stroke={m.dark} strokeWidth={4} />
            <path d="M67 26 H75 A9 9 0 0 1 66 42" fill="none" stroke={m.dark} strokeWidth={4} />
            <path d="M32 20 H68 V32 A18 18 0 0 1 32 32 Z" fill={m.base} />
            <path d="M50 20 H68 V32 A18 18 0 0 1 50 50 Z" fill={m.dark} />
            <rect x={36} y={22} width={5} height={16} rx={2.5} fill={m.light} />
            <rect x={46} y={50} width={8} height={14} fill={m.base} />
            <rect x={38} y={63} width={24} height={9} rx={2} fill={m.dark} />
            <rect x={38} y={63} width={24} height={3} rx={1.5} fill={m.light} />
          </g>
        )}
        {def.shape === 'monument' && (
          <g>
            <polygon points="41,74 44,24 50,12 56,24 59,74" fill={m.base} />
            <polygon points="50,12 56,24 59,74 50,74" fill={m.dark} />
            <polygon points="44,26 50,12 47,74 42,74" fill={m.light} opacity={0.6} />
          </g>
        )}
        {def.shape === 'medal' && (
          <g>
            <polygon points="36,12 46,12 54,40 46,42" fill={THEME_SHADES.cyan.base} />
            <polygon points="64,12 54,12 46,40 54,42" fill={THEME_SHADES.magenta.base} />
            <circle cx={50} cy={53} r={17} fill={m.dark} />
            <circle cx={50} cy={51} r={16} fill={m.base} />
            <circle cx={50} cy={51} r={10} fill={m.light} opacity={0.55} />
            <polygon points="50,43 52.5,48.5 58,49 54,53 55,58.5 50,55.5 45,58.5 46,53 42,49 47.5,48.5" fill={m.dark} />
          </g>
        )}
        {def.shape === 'statue' && (
          <g>
            <rect x={20} y={8} width={60} height={5} rx={2} fill={METAL.light} />
            <rect x={20} y={11} width={60} height={2} fill={METAL.dark} />
            <path d="M36 13 L42 34 L47 34 L42 13 Z" fill={m.base} />
            <path d="M64 13 L58 34 L53 34 L58 13 Z" fill={m.dark} />
            <circle cx={50} cy={30} r={7} fill={m.base} />
            <path d="M41 36 H59 L56 58 H44 Z" fill={m.base} />
            <path d="M50 36 H59 L56 58 H50 Z" fill={m.dark} />
            <path d="M44 58 L42 74 H47 L49 58 Z M56 58 L58 74 H53 L51 58 Z" fill={m.dark} />
          </g>
        )}
      </g>
      {verified && (
        <g>
          <circle cx={80} cy={20} r={10} fill={THEME_SHADES.cyan.base} />
          <path d="M75 20 L79 24 L86 16" fill="none" stroke="#06131a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Artwork for any placed item, drawn in a 100×100 box (200×200 for 2×2 items). */
export function ItemArt({
  item,
  lit,
  verified,
  plan
}: {
  item: PlacedItem;
  lit: boolean;
  verified?: boolean;
  plan?: TodayPlan | null;
}): ReactNode {
  if (item.itemId.startsWith(TROPHY_ITEM_PREFIX)) {
    return (
      <TrophyArt trophyId={item.itemId.slice(TROPHY_ITEM_PREFIX.length)} verified={verified} style={item.style} color={item.color} />
    );
  }
  const s = themeFor(item.itemId, item.color);
  const props: BuildingProps = {
    level: Math.max(item.level, 1),
    lit,
    s,
    m: materialsFor(item.color, s),
    decoration: item.style
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
      return <TrainingYard {...props} plan={plan} />;
    default:
      return <Decor id={item.itemId} lit={lit} style={item.style} color={item.color} />;
  }
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

const TERRAIN_COLORS: Record<string, { base: string; light: string; dark: string; detail: string }> = {
  grass: { base: '#3d7a45', light: '#468750', dark: '#356b3c', detail: '#5e9f5f' },
  // Land you don't own yet: the same grass, a shade darker and calmer.
  wild: { base: '#2c5534', light: '#33603b', dark: '#264b2e', detail: '#3f7346' },
  meadow: { base: '#33683f', light: '#3d7a4b', dark: '#2a5a35', detail: '#ffd1ea' },
  dirt: { base: '#6b4a2e', light: '#7a5636', dark: '#5a3d25', detail: '#8f6a45' },
  sand: { base: '#c9a86a', light: '#d6b87c', dark: '#b8975a', detail: '#e8d29d' },
  plaza: { base: '#7f8a99', light: '#8c97a6', dark: '#727d8c', detail: '#a9b3c0' },
  water: { base: '#1f6f9c', light: '#2a80ad', dark: '#1a5f88', detail: '#7fd3f5' },
  snow: { base: '#dfe8f1', light: '#eef3f8', dark: '#cfdae6', detail: '#ffffff' }
};

/** Deterministic small number per tile, for scattering details. */
function tileHash(x: number, y: number, salt = 0): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** A blade-of-grass tuft; some sway in the breeze. */
function Tuft({ x, y, color, sway, delay }: { x: number; y: number; color: string; sway: boolean; delay: number }) {
  return (
    <g className={sway ? 'base-sway' : undefined} style={sway ? { animationDelay: `${delay}s` } : undefined}>
      <path d={`M${x} ${y} q-2 -7 -4 -9 M${x} ${y} q0 -8 1 -11 M${x} ${y} q2 -6 5 -8`} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
    </g>
  );
}

/**
 * One ground tile, drawn edge to edge so neighbouring tiles of the same
 * ground blend into one seamless surface. Soft blotches and scattered
 * details (tufts, flowers, pebbles, ripples) are placed by a per-tile hash
 * so the ground looks natural rather than tiled; a few of them move.
 */
export function TerrainTile({ x, y, terrain }: { x: number; y: number; terrain: string }) {
  const c = TERRAIN_COLORS[terrain] ?? TERRAIN_COLORS.grass;
  const h = tileHash(x, y);
  const h2 = tileHash(x, y, 1);
  const px = x * 100;
  const py = y * 100;
  const at = (n: number, salt: number) => 12 + (tileHash(x, y, salt) % 76) + 0 * n;
  const delay = (h % 30) / 10;

  // Soft light/dark blotches give the ground texture without visible squares.
  // Kept inside the tile (centre 30–70, radius ≤ 28) so they never stain a different neighbour.
  const mid = (salt: number) => 30 + (tileHash(x, y, salt) % 41);
  const blotches = (
    <>
      <ellipse cx={px + mid(2)} cy={py + mid(3)} rx={16 + (h % 12)} ry={10 + (h2 % 10)} fill={c.light} opacity={0.45} />
      <ellipse cx={px + mid(4)} cy={py + mid(5)} rx={14 + (h2 % 12)} ry={9 + (h % 9)} fill={c.dark} opacity={0.4} />
    </>
  );

  if (terrain === 'water') {
    return (
      <g pointerEvents="none">
        <rect x={px - 0.5} y={py - 0.5} width={101} height={101} fill={c.base} />
        {blotches}
        <g className="base-shimmer" style={{ animationDelay: `${delay}s` }}>
          <path d={`M${px + at(0, 6) - 14} ${py + at(0, 7)} q7 -5 14 0 t14 0`} fill="none" stroke={c.detail} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
          <path d={`M${px + at(0, 8) - 10} ${py + at(0, 9)} q5 -4 10 0`} fill="none" stroke={c.detail} strokeWidth={2.5} strokeLinecap="round" opacity={0.45} />
        </g>
      </g>
    );
  }

  return (
    <g pointerEvents="none">
      <rect x={px - 0.5} y={py - 0.5} width={101} height={101} fill={c.base} />
      {terrain !== 'plaza' && blotches}
      {terrain === 'plaza' && (
        <g>
          {[0, 1].flatMap((i) =>
            [0, 1].map((j) => (
              <rect key={`${i}${j}`} x={px + 3 + i * 50} y={py + 3 + j * 50} width={44} height={44} rx={3}
                fill={(i + j + (h % 2)) % 2 ? c.light : c.base} opacity={0.9} />
            ))
          )}
        </g>
      )}
      {terrain === 'grass' && (
        <g>
          {/* Fine speckle: tiny light and dark flecks read as blades of grass. */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={`s${i}`} cx={px + at(i, 90 + i)} cy={py + at(i, 100 + i)} r={1.6} fill={i % 2 ? c.light : c.dark} opacity={0.8} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <Tuft key={i} x={px + at(i, 10 + i)} y={py + at(i, 20 + i)} color={i % 2 ? c.light : c.detail} sway={(h >>> i) % 3 === 0} delay={delay + i * 0.4} />
          ))}
          {h % 7 === 0 && <circle cx={px + at(0, 110)} cy={py + at(0, 111)} r={2.4} fill="#fff4b0" />}
        </g>
      )}
      {terrain === 'meadow' && (
        <g>
          <Tuft x={px + at(0, 30)} y={py + at(0, 31)} color={c.light} sway delay={delay} />
          {[0, 1, 2].map((i) => {
            const fx = px + at(i, 40 + i);
            const fy = py + at(i, 50 + i);
            const colors = ['#ffd1ea', '#fff4b0', '#c9b8ff'];
            return (
              <g key={i} className="base-sway" style={{ animationDelay: `${delay + i * 0.6}s` }}>
                <path d={`M${fx} ${fy + 8} q1 -4 0 -8`} stroke="#3c7a4e" strokeWidth={1.6} fill="none" />
                <circle cx={fx} cy={fy} r={3.2} fill={colors[(h + i) % 3]} />
                <circle cx={fx} cy={fy} r={1.2} fill="#fff4b0" />
              </g>
            );
          })}
        </g>
      )}
      {terrain === 'dirt' && (
        <g>
          <circle cx={px + at(0, 60)} cy={py + at(0, 61)} r={2.6} fill={c.detail} />
          <circle cx={px + at(0, 62)} cy={py + at(0, 63)} r={1.8} fill={c.light} />
          <ellipse cx={px + at(0, 64)} cy={py + at(0, 65)} rx={3.5} ry={2.2} fill={c.dark} />
          <path d={`M${px + at(0, 66)} ${py + at(0, 67)} l6 3 l4 -2`} stroke={c.dark} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </g>
      )}
      {terrain === 'sand' && (
        <g>
          <path d={`M${px + 10} ${py + at(0, 70)} q12 -5 24 0 t24 0 t24 0`} stroke={c.dark} strokeWidth={1.6} fill="none" opacity={0.5} />
          <path d={`M${px + 18} ${py + at(0, 71)} q10 -4 20 0 t20 0`} stroke={c.light} strokeWidth={1.4} fill="none" opacity={0.7} />
          {h % 3 === 0 && (
            <circle cx={px + at(0, 72)} cy={py + at(0, 73)} r={2} fill="#fffbe6" className="base-sparkle" style={{ animationDelay: `${delay}s` }} />
          )}
        </g>
      )}
      {terrain === 'snow' && (
        <g>
          <ellipse cx={px + at(0, 80)} cy={py + at(0, 81)} rx={10} ry={4} fill="#c3d0de" opacity={0.6} />
          {[0, 1].map((i) => (
            <circle key={i} cx={px + at(i, 82 + i)} cy={py + at(i, 84 + i)} r={1.8} fill={c.detail} className="base-sparkle" style={{ animationDelay: `${delay + i}s` }} />
          ))}
        </g>
      )}
    </g>
  );
}
