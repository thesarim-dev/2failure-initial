import type { KeyboardEvent, ReactNode } from 'react';
import {
  GRID_SIZE,
  TROPHY_ITEM_PREFIX,
  buildableBounds,
  getItemDef,
  isTileBuildable
} from '../../game/catalog';
import { hqLevel, itemSize, type GameState, type PlacedItem, type TodayPlan } from '../../game/engine';
import { ItemArt, THEME_SHADES, themeFor } from './BaseArt';

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
  tileLabel
}: BoardProps) {
  const level = hqLevel(state);
  const placing = validTiles !== null;
  const items = [...state.placed].sort((a, b) => a.y + itemSize(a.itemId) - (b.y + itemSize(b.itemId)) || a.x - b.x);
  const jobs = new Map(state.constructions.map((job) => [job.uid, job]));

  const tiles: ReactNode[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const open = isTileBuildable(x, y, level);
      tiles.push(
        <rect
          key={`${x},${y}`}
          x={x * T + 1}
          y={y * T + 1}
          width={T - 2}
          height={T - 2}
          rx={8}
          className={open ? ((x + y) % 2 ? 'base-tile' : 'base-tile base-tile--alt') : 'base-tile base-tile--locked'}
          onClick={placing ? undefined : () => onTile(x, y)}
        />
      );
      if (!open) {
        tiles.push(
          <rect
            key={`h${x},${y}`}
            x={x * T + 1}
            y={y * T + 1}
            width={T - 2}
            height={T - 2}
            rx={8}
            fill="url(#base-hatch)"
            pointerEvents="none"
          />
        );
      }
    }
  }

  // Frame the land you own, plus a sliver of locked land to hint at what HQ unlocks.
  const { min, max } = buildableBounds(level);
  const pad = level >= 3 ? 0 : T * 0.45;
  const viewStart = min * T - pad;
  const viewSize = (max - min + 1) * T + pad * 2;

  return (
    <svg
      viewBox={`${viewStart} ${viewStart} ${viewSize} ${viewSize}`}
      className={`base-board ${lit ? 'is-lit' : 'is-quiet'} ${placing ? 'is-placing' : ''}`}
      role="group">
      <defs>
        <pattern id="base-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="14" className="base-hatch-line" strokeWidth="5" />
        </pattern>
        <pattern id="base-scaffold-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="16" className="base-scaffold-line" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width={GRID_SIZE * T} height={GRID_SIZE * T} className="base-ground" />
      {tiles}

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
            className={`base-item group ${selected ? 'is-selected' : ''} ${placing ? 'is-inert' : ''}`}
            role={placing ? undefined : 'button'}
            tabIndex={placing ? -1 : 0}
            aria-label={labelForItem(item)}
            onClick={placing ? undefined : () => onItem(item.uid)}
            onKeyDown={placing ? undefined : (e) => onKeyActivate(e, () => onItem(item.uid))}>
            <rect width={size * T} height={size * T} fill="transparent" />
            {selected && (
              <rect x={3} y={3} width={size * T - 6} height={size * T - 6} rx={12} className="base-selection" />
            )}
            <g className="base-item-art transition-transform duration-200 ease-out group-hover:-translate-y-1">
              {building && item.level === 0 ? (
                <rect x={14} y={30} width={size * T - 28} height={size * T - 40} rx={4} className="base-foundation" />
              ) : (
                <ItemArt item={item} lit={lit} verified={verified} plan={plan} />
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
