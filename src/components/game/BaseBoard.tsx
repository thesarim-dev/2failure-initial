import type { KeyboardEvent, ReactNode } from 'react';
import {
  GRID_SIZE,
  TROPHY_ITEM_PREFIX,
  buildableBounds,
  getItemDef,
  isTileBuildable
} from '../../game/catalog';
import { itemSize, type GameState, type PlacedItem, type TodayPlan } from '../../game/engine';
import { ItemArt, TerrainTile, THEME_SHADES, themeFor } from './BaseArt';
import { useMemo, useRef } from 'react';
import { BaseBirds, BaseCritters } from './Critters';

export { ItemArt, TrophyArt } from './BaseArt';

const T = 100; // tile size in board units

/** Small dots under a building showing its level. */
function LevelPips({ level, color, cx = 50, y = 97 }: { level: number; color: string; cx?: number; y?: number }) {
  if (level < 1) return null;
  const gap = 9;
  const start = cx - ((level - 1) * gap) / 2;
  return (
    <g>
      {Array.from({ length: level }, (_, i) => (
        <circle key={i} cx={start + i * gap} cy={y} r={2.8} fill={color} stroke="#0d1310" strokeWidth={1.2} />
      ))}
    </g>
  );
}

/** Standalone preview used in the build menu and info sheet. */
export function ItemPreview({ itemId, level = 1, trophyId, verified, size = 56, style, color }: {
  itemId?: string;
  level?: number;
  trophyId?: string;
  verified?: boolean;
  size?: number;
  style?: string;
  color?: string;
}) {
  const id = trophyId ? `${TROPHY_ITEM_PREFIX}${trophyId}` : itemId ?? '';
  const box = itemSize(id) * T;
  return (
    <svg viewBox={`0 0 ${box} ${box}`} width={size} height={size} aria-hidden="true" className="base-preview">
      <ItemArt item={{ uid: 'preview', itemId: id, x: 0, y: 0, level, style, color }} lit verified={verified} />
    </svg>
  );
}

function accentFor(itemId: string, color?: string): string {
  return color ? THEME_SHADES[color as keyof typeof THEME_SHADES]?.light ?? themeFor(itemId).light : themeFor(itemId).light;
}

type BoardProps = {
  state: GameState;
  plan?: TodayPlan | null;
  lit: boolean;
  selectedUid: string | null;
  /** When set, the board is in place/move mode and these tiles are valid. */
  validTiles: Set<string> | null;
  labelForItem: (item: PlacedItem) => string;
  onTile: (x: number, y: number) => void;
  onItem: (uid: string) => void;
  tileLabel: (x: number, y: number) => string;
  /** Paint mode: drag across tiles to paint terrain. */
  painting?: boolean;
  onPaint?: (tile: [number, number]) => void;
  svgId?: string;
};

function onKeyActivate(event: KeyboardEvent, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

/**
 * Isometric projection. The ground is drawn in flat "world" units (100 per
 * tile) inside a group with this matrix, which turns each square tile into a
 * 100×50 diamond. Upright things (buildings, animals) are drawn unskewed and
 * placed at the projected point of their footprint.
 */
const ISO = 'matrix(0.5 0.25 -0.5 0.25 0 0)';
export function project([x, y]: [number, number]): [number, number] {
  return [(x - y) * 0.5, (x + y) * 0.25];
}

function hash2(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

const WILD_PROPS: Array<{ itemId: string; style?: string }> = [
  { itemId: 'pine', style: 'pine' },
  { itemId: 'pine', style: 'oak' },
  { itemId: 'pine', style: 'pine' },
  { itemId: 'bush', style: 'round' },
  { itemId: 'rock', style: 'mossy' },
  { itemId: 'rock', style: 'boulder' }
];

export function BaseBoard({
  state,
  plan,
  lit,
  selectedUid,
  validTiles,
  labelForItem,
  onTile,
  onItem,
  tileLabel,
  painting = false,
  onPaint,
  svgId
}: BoardProps) {
  // Land is bought with coins, separately from HQ level.
  const land = state.landLevel;
  const placing = validTiles !== null;
  const inert = placing || painting;
  const jobs = new Map(state.constructions.map((job) => [job.uid, job]));
  const { min, max } = buildableBounds(land);
  const a = min * T;
  const b = (max + 1) * T;

  // Frame the owned diamond with plenty of countryside around it.
  const span = b - a;
  const viewW = span * 1.18;
  const viewH = viewW * 0.8;
  const centerY = (a + b) * 0.25 - span * 0.05;
  const viewBox = `${-viewW / 2} ${centerY - viewH / 2} ${viewW} ${viewH}`;

  const animate = useMemo(
    () => typeof window === 'undefined' || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Ground tiles: your land, and darker wild land around it.
  const ground: ReactNode[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const owned = isTileBuildable(x, y, land);
      ground.push(
        <TerrainTile key={`t${x},${y}`} x={x} y={y} terrain={owned ? state.terrain?.[`${x},${y}`] ?? 'grass' : 'wild'} />
      );
      if (owned) {
        ground.push(
          <rect key={`c${x},${y}`} x={x * T} y={y * T} width={T} height={T} fill="transparent"
            onClick={inert ? undefined : () => onTile(x, y)} />
        );
      }
    }
  }

  // Trees and rocks scattered over land you don't own yet, like a forest edge.
  const wildProps = useMemo(() => {
    const props: Array<{ x: number; y: number; itemId: string; style?: string }> = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (isTileBuildable(x, y, land)) continue;
        const gap = Math.max(min - x, x - max, min - y, y - max);
        const h = hash2(x, y);
        // Sparse right next to your land, a little denser further out.
        if (gap < 1 || h % (gap > 2 ? 4 : 6) !== 0) continue;
        props.push({ x, y, ...WILD_PROPS[(h >>> 4) % WILD_PROPS.length] });
      }
    }
    return props;
  }, [land, min, max]);

  // Everything upright, sorted back to front so nearer things overlap.
  type Sprite = { key: string; depth: number; node: ReactNode };
  const sprites: Sprite[] = [];
  for (const p of wildProps) {
    const [cx, cy] = project([(p.x + 0.5) * T, (p.y + 0.5) * T]);
    sprites.push({
      key: `w${p.x},${p.y}`,
      depth: p.x + p.y + 1,
      node: (
        <g key={`w${p.x},${p.y}`} transform={`translate(${cx - 50} ${cy - 88})`} pointerEvents="none" className="base-wild-prop">
          <ItemArt item={{ uid: 'wild', itemId: p.itemId, x: 0, y: 0, level: 1, style: p.style }} lit={lit} />
        </g>
      )
    });
  }
  for (const item of state.placed) {
    const size = itemSize(item.itemId);
    const construction = jobs.get(item.uid);
    const building = !!construction;
    const selected = selectedUid === item.uid;
    const def = getItemDef(item.itemId);
    const trophyId = item.itemId.startsWith(TROPHY_ITEM_PREFIX) ? item.itemId.slice(TROPHY_ITEM_PREFIX.length) : null;
    const verified = trophyId ? state.trophies[trophyId]?.verified : undefined;
    const [cx, cy] = project([(item.x + size / 2) * T, (item.y + size / 2) * T]);
    const box = size * T;
    sprites.push({
      key: item.uid,
      depth: item.x + item.y + size,
      node: (
        <g
          key={item.uid}
          transform={`translate(${cx - box / 2} ${cy - box * 0.9})`}
          className={`base-item group ${selected ? 'is-selected' : ''} ${inert ? 'is-inert' : ''}`}
          role={inert ? undefined : 'button'}
          tabIndex={inert ? -1 : 0}
          aria-label={labelForItem(item)}
          pointerEvents={inert ? 'none' : undefined}
          onClick={inert ? undefined : () => onItem(item.uid)}
          onKeyDown={inert ? undefined : (e) => onKeyActivate(e, () => onItem(item.uid))}>
          <rect x={box * 0.12} y={box * 0.1} width={box * 0.76} height={box * 0.82} fill="transparent" />
          <g className="base-item-art transition-transform duration-200 ease-out group-hover:-translate-y-1">
            {building && item.level === 0 ? (
              <rect x={14} y={30} width={box - 28} height={box - 40} rx={4} className="base-foundation" />
            ) : (
              <g className="base-pop">
                <g transform={item.flip ? `translate(${box} 0) scale(-1 1)` : undefined}>
                  <ItemArt item={item} lit={lit} verified={verified} plan={plan} />
                </g>
              </g>
            )}
          </g>
          {def?.kind === 'structure' && !building && (
            <LevelPips level={item.level} color={accentFor(item.itemId, item.color)} cx={box / 2} y={box - 4} />
          )}
          {building && construction && (
            <g className="base-scaffold">
              <rect x={10} y={16} width={box - 20} height={box - 24} rx={4} fill="url(#base-scaffold-hatch)" className="base-scaffold-fill" />
              <rect x={10} y={16} width={box - 20} height={box - 24} rx={4} className="base-scaffold-frame" />
              <circle cx={box - 18} cy={20} r={15} className="base-scaffold-badge" />
              <text x={box - 18} y={26} textAnchor="middle" className="base-scaffold-count">
                {construction.setsRemaining}
              </text>
            </g>
          )}
        </g>
      )
    });
  }
  sprites.sort((p, q) => p.depth - q.depth);

  const selected = state.placed.find((p) => p.uid === selectedUid);

  // Drag to paint: read the pointer in ground (world) coordinates.
  const groundRef = useRef<SVGGElement>(null);
  const lastPainted = useRef<string | null>(null);
  const tileFromEvent = (event: React.PointerEvent): [number, number] | null => {
    const ctm = groundRef.current?.getScreenCTM();
    if (!ctm) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    const x = Math.floor(point.x / T);
    const y = Math.floor(point.y / T);
    return isTileBuildable(x, y, land) ? [x, y] : null;
  };
  const paintAt = (event: React.PointerEvent) => {
    const tile = tileFromEvent(event);
    if (!tile || !onPaint) return;
    const key = `${tile[0]},${tile[1]}`;
    if (lastPainted.current === key) return;
    lastPainted.current = key;
    onPaint(tile);
  };

  const fireflies = [0, 1, 2, 3, 4, 5].map((i) => {
    const [fx, fy] = project([a + 40 + ((i * 397) % Math.max(1, span - 80)), a + 40 + ((i * 613) % Math.max(1, span - 80))]);
    return <circle key={i} cx={fx} cy={fy - 30} r={3} className="base-firefly" style={{ animationDelay: `${i * 0.9}s` }} />;
  });

  return (
    <svg
      id={svgId}
      viewBox={viewBox}
      onPointerDown={
        painting
          ? (event) => {
              (event.target as Element).setPointerCapture?.(event.pointerId);
              lastPainted.current = null;
              paintAt(event);
            }
          : undefined
      }
      onPointerMove={painting ? (event) => event.buttons && paintAt(event) : undefined}
      onPointerUp={painting ? () => (lastPainted.current = null) : undefined}
      className={`base-board is-iso ${lit ? 'is-lit' : 'is-quiet'} ${placing ? 'is-placing' : ''} ${painting ? 'is-painting' : ''}`}
      role="group">
      <defs>
        <pattern id="base-scaffold-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="16" className="base-scaffold-line" strokeWidth="3" />
        </pattern>
        <radialGradient id="base-vignette" cx="50%" cy="48%" r="62%">
          <stop offset="55%" stopColor="#0b120d" stopOpacity="0" />
          <stop offset="100%" stopColor="#0b120d" stopOpacity="0.7" />
        </radialGradient>
      </defs>

      {/* The ground, in world units, tilted into diamonds. */}
      <g ref={groundRef} transform={ISO}>
        <rect x={-30 * T} y={-30 * T} width={(GRID_SIZE + 60) * T} height={(GRID_SIZE + 60) * T} className="base-wild-ground" />
        {ground}
        {selected && (
          <rect
            x={selected.x * T + 4}
            y={selected.y * T + 4}
            width={itemSize(selected.itemId) * T - 8}
            height={itemSize(selected.itemId) * T - 8}
            rx={10}
            className="base-selection"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}
        {/* The grid only shows while building, moving or painting. */}
        {inert && (
          <g className="base-grid" pointerEvents="none">
            {Array.from({ length: max - min + 2 }, (_, i) => (min + i) * T).map((v) => (
              <g key={v}>
                <line x1={v} y1={a} x2={v} y2={b} vectorEffect="non-scaling-stroke" />
                <line x1={a} y1={v} x2={b} y2={v} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </g>
        )}
        {placing &&
          [...validTiles].map((key) => {
            const [x, y] = key.split(',').map(Number);
            return (
              <rect
                key={`v${key}`}
                x={x * T + 6}
                y={y * T + 6}
                width={T - 12}
                height={T - 12}
                rx={10}
                className="base-valid-tile"
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex={0}
                aria-label={tileLabel(x, y)}
                onClick={() => onTile(x, y)}
                onKeyDown={(e) => onKeyActivate(e, () => onTile(x, y))}
              />
            );
          })}
      </g>

      <BaseCritters state={state} animate={animate} project={project} />

      {sprites.map((sprite) => sprite.node)}

      <BaseBirds state={state} animate={animate} project={project} />

      <g className="base-fireflies" pointerEvents="none">{fireflies}</g>

      {/* Soft darkening toward the edges keeps the eye on your base. */}
      <rect x={-viewW / 2} y={centerY - viewH / 2} width={viewW} height={viewH} fill="url(#base-vignette)" pointerEvents="none" />
    </svg>
  );
}
