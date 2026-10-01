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
import { MAX_LAND_LEVEL } from '../../game/catalog';
import { useMemo, useRef } from 'react';
import { BaseCritters } from './Critters';

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
  const items = [...state.placed].sort((a, b) => a.y + itemSize(a.itemId) - (b.y + itemSize(b.itemId)) || a.x - b.x);
  const jobs = new Map(state.constructions.map((job) => [job.uid, job]));

  const tiles: ReactNode[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!isTileBuildable(x, y, land)) continue;
      tiles.push(<TerrainTile key={`t${x},${y}`} x={x} y={y} terrain={state.terrain?.[`${x},${y}`] ?? 'grass'} />);
      tiles.push(
        <rect
          key={`${x},${y}`}
          x={x * T}
          y={y * T}
          width={T}
          height={T}
          fill="transparent"
          onClick={placing || painting ? undefined : () => onTile(x, y)}
        />
      );
    }
  }

  // Frame the land you own, plus a sliver of locked land and the island's cliff edge.
  const { min, max } = buildableBounds(land);
  const pad = land >= MAX_LAND_LEVEL ? T * 0.3 : T * 0.45;
  const cliff = 34;
  const viewStart = min * T - pad;
  const viewSize = (max - min + 1) * T + pad * 2;
  const landX = min * T;
  const landEnd = (max + 1) * T;

  const animate = useMemo(
    () => typeof window === 'undefined' || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Drag to paint terrain.
  const svgRef = useRef<SVGSVGElement>(null);
  const lastPainted = useRef<string | null>(null);
  const tileFromEvent = (event: React.PointerEvent): [number, number] | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
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
    const fx = landX + 40 + ((i * 397) % Math.max(1, landEnd - landX - 80));
    const fy = landX + 40 + ((i * 613) % Math.max(1, landEnd - landX - 80));
    return <circle key={i} cx={fx} cy={fy} r={3} className="base-firefly" style={{ animationDelay: `${i * 0.9}s` }} />;
  });

  return (
    <svg
      ref={svgRef}
      id={svgId}
      viewBox={`${viewStart} ${viewStart} ${viewSize} ${viewSize + cliff}`}
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
      className={`base-board ${lit ? 'is-lit' : 'is-quiet'} ${placing ? 'is-placing' : ''} ${painting ? 'is-painting' : ''}`}
      role="group">
      <defs>
        <pattern id="base-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="14" className="base-hatch-line" strokeWidth="5" />
        </pattern>
        <pattern id="base-scaffold-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="16" className="base-scaffold-line" strokeWidth="3" />
        </pattern>
      </defs>
      <rect x={-T} y={-T} width={(GRID_SIZE + 2) * T} height={(GRID_SIZE + 2) * T} className="base-ground" />
      <rect x={landX - 4} y={landX - 4} width={landEnd - landX + 8} height={landEnd - landX + 8} rx={12} fill="#1b3a26" />
      {/* Land you don't own yet: one seamless foggy layer. */}
      <rect x={0} y={0} width={GRID_SIZE * T} height={GRID_SIZE * T} className="base-tile--locked" />
      <rect x={0} y={0} width={GRID_SIZE * T} height={GRID_SIZE * T} fill="url(#base-hatch)" pointerEvents="none" />
      {tiles}
      {/* The owned land is a raised island: an earthy cliff under its front edge. */}
      <g pointerEvents="none">
        <rect x={landX} y={landEnd} width={landEnd - landX} height={cliff} rx={6} fill="#5a3d24" />
        <rect x={landX} y={landEnd + cliff * 0.5} width={landEnd - landX} height={cliff * 0.5} rx={6} fill="#432c19" />
        <rect x={landX} y={landEnd} width={landEnd - landX} height={5} fill="#2a5b3a" />
      </g>

      <BaseCritters state={state} animate={animate} />

      {items.map((item) => {
        const size = itemSize(item.itemId);
        const construction = jobs.get(item.uid);
        const building = !!construction;
        const selected = selectedUid === item.uid;
        const def = getItemDef(item.itemId);
        const trophyId = item.itemId.startsWith(TROPHY_ITEM_PREFIX)
          ? item.itemId.slice(TROPHY_ITEM_PREFIX.length)
          : null;
        const verified = trophyId ? state.trophies[trophyId]?.verified : undefined;
        return (
          <g
            key={item.uid}
            transform={`translate(${item.x * T} ${item.y * T})`}
            className={`base-item group ${selected ? 'is-selected' : ''} ${placing || painting ? 'is-inert' : ''}`}
            role={placing || painting ? undefined : 'button'}
            tabIndex={placing || painting ? -1 : 0}
            aria-label={labelForItem(item)}
            pointerEvents={painting ? 'none' : undefined}
            onClick={placing || painting ? undefined : () => onItem(item.uid)}
            onKeyDown={placing || painting ? undefined : (e) => onKeyActivate(e, () => onItem(item.uid))}>
            <rect width={size * T} height={size * T} fill="transparent" />
            {selected && (
              <rect x={3} y={3} width={size * T - 6} height={size * T - 6} rx={12} className="base-selection" />
            )}
            <g className="base-item-art transition-transform duration-200 ease-out group-hover:-translate-y-1">
              {building && item.level === 0 ? (
                <rect x={14} y={30} width={size * T - 28} height={size * T - 40} rx={4} className="base-foundation" />
              ) : (
                <g className="base-pop">
                  <g transform={item.flip ? `translate(${size * T} 0) scale(-1 1)` : undefined}>
                    <ItemArt item={item} lit={lit} verified={verified} plan={plan} />
                  </g>
                </g>
              )}
            </g>
            {def?.kind === 'structure' && !building && (
              <LevelPips
                level={item.level}
                color={accentFor(item.itemId, item.color)}
                cx={(size * T) / 2}
                y={size * T - 4}
              />
            )}
            {building && construction && (
              <g className="base-scaffold">
                <rect x={10} y={16} width={size * T - 20} height={size * T - 24} rx={4} fill="url(#base-scaffold-hatch)" className="base-scaffold-fill" />
                <rect x={10} y={16} width={size * T - 20} height={size * T - 24} rx={4} className="base-scaffold-frame" />
                <circle cx={size * T - 18} cy={20} r={15} className="base-scaffold-badge" />
                <text x={size * T - 18} y={26} textAnchor="middle" className="base-scaffold-count">
                  {construction.setsRemaining}
                </text>
              </g>
            )}
          </g>
        );
      })}

      <g className="base-fireflies" pointerEvents="none">{fireflies}</g>

      {/* The grid only shows while building, moving or painting. */}
      {(placing || painting) && (
        <g className="base-grid" pointerEvents="none">
          {Array.from({ length: max - min + 2 }, (_, i) => (min + i) * T).map((v) => (
            <g key={v}>
              <line x1={v} y1={landX} x2={v} y2={landEnd} />
              <line x1={landX} y1={v} x2={landEnd} y2={v} />
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
              role="button"
              tabIndex={0}
              aria-label={tileLabel(x, y)}
              onClick={() => onTile(x, y)}
              onKeyDown={(e) => onKeyActivate(e, () => onTile(x, y))}
            />
          );
        })}
    </svg>
  );
}
