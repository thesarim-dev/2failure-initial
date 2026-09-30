import type { KeyboardEvent, ReactNode } from 'react';
import {
  GRID_SIZE,
  TROPHY_ITEM_PREFIX,
  buildableBounds,
  getItemDef,
  getTrophyDef,
  isTileBuildable,
  type TrophyTier
} from '../../game/catalog';
import { hqLevel, itemSize, type GameState, type PlacedItem } from '../../game/engine';

/** Accent colours, one per resource, reused across the game UI. */
export const RESOURCE_COLOR = {
  stone: '#c9d2dc',
  timber: '#f2a541',
  iron: '#ff5fd2',
  crystal: '#37d8ff'
} as const;

const LIME = '#c8f032';
const PINE = '#5be38a';
const TIER_COLOR: Record<TrophyTier, string> = {
  bronze: '#d8925a',
  silver: '#d5dce4',
  gold: '#f7c948'
};

const T = 100; // tile size in board units

type ArtProps = { level: number; lit: boolean };

/** A warm window or lamp that goes dark on quiet days. */
function Light({ lit, children }: { lit: boolean; children: ReactNode }) {
  return <g className={lit ? 'base-light is-lit' : 'base-light'}>{children}</g>;
}

function Shadow({ w = 34, cy = 88, cx = 50 }: { w?: number; cy?: number; cx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={w} ry={w * 0.24} className="base-shadow" />;
}

function LevelPips({ level, color, cx = 50, y = 97 }: { level: number; color: string; cx?: number; y?: number }) {
  if (level < 1) return null;
  const gap = 9;
  const start = cx - ((level - 1) * gap) / 2;
  return (
    <g>
      {Array.from({ length: level }, (_, i) => (
        <circle key={i} cx={start + i * gap} cy={y} r={2.6} fill={color} />
      ))}
    </g>
  );
}

function Watchtower({ level, lit }: ArtProps) {
  const c = RESOURCE_COLOR.stone;
  return (
    <g>
      <Shadow w={26} />
      <rect x={33} y={38} width={34} height={50} rx={3} className="base-body" stroke={c} strokeWidth={2.5} />
      {level >= 2 && <line x1={33} y1={56} x2={67} y2={56} stroke={c} strokeWidth={2} opacity={0.7} />}
      {level >= 3 && <line x1={33} y1={72} x2={67} y2={72} stroke={c} strokeWidth={2} opacity={0.7} />}
      <rect x={26} y={28} width={48} height={12} rx={2} className="base-body-2" stroke={c} strokeWidth={2.5} />
      {[26, 38, 50, 62].map((x) => (
        <rect key={x} x={x} y={21} width={8} height={8} rx={1} className="base-body-2" stroke={c} strokeWidth={2} />
      ))}
      <Light lit={lit}>
        <rect x={45} y={level >= 3 ? 44 : 60} width={10} height={12} rx={5} fill={LIME} />
        {level >= 3 && <rect x={45} y={62} width={10} height={12} rx={5} fill={LIME} />}
      </Light>
      {level >= 2 && (
        <g>
          <line x1={50} y1={21} x2={50} y2={4} stroke={c} strokeWidth={2} />
          <path d="M50 4 L66 8 L50 13 Z" fill={RESOURCE_COLOR.timber} />
        </g>
      )}
    </g>
  );
}

function Lodge({ level, lit }: ArtProps) {
  const c = RESOURCE_COLOR.timber;
  return (
    <g>
      <Shadow w={36} />
      {level >= 2 && <rect x={63} y={24} width={9} height={18} className="base-body-2" stroke={c} strokeWidth={2} />}
      <rect x={20} y={48} width={60} height={40} rx={3} className="base-body" stroke={c} strokeWidth={2.5} />
      <path d="M13 51 L50 21 L87 51 Z" className="base-body-2" stroke={c} strokeWidth={2.5} strokeLinejoin="round" />
      {level >= 3 && <path d="M24 48 L50 28 L76 48" fill="none" stroke={c} strokeWidth={1.5} opacity={0.6} />}
      <rect x={44} y={66} width={12} height={22} rx={2} fill={c} opacity={0.85} />
      <Light lit={lit}>
        <rect x={26} y={58} width={12} height={10} rx={2} fill={LIME} />
        {level >= 3 && <rect x={62} y={58} width={12} height={10} rx={2} fill={LIME} />}
      </Light>
    </g>
  );
}

function Forge({ level, lit }: ArtProps) {
  const c = RESOURCE_COLOR.iron;
  return (
    <g>
      <Shadow w={36} />
      <rect x={62} y={level >= 2 ? 12 : 20} width={12} height={level >= 2 ? 30 : 22} className="base-body-2" stroke={c} strokeWidth={2} />
      <rect x={18} y={46} width={64} height={42} rx={3} className="base-body" stroke={c} strokeWidth={2.5} />
      <rect x={14} y={40} width={72} height={9} rx={2} className="base-body-2" stroke={c} strokeWidth={2.5} />
      <Light lit={lit}>
        <path d="M36 88 V74 A14 14 0 0 1 64 74 V88 Z" fill={c} />
        <circle cx={68} cy={level >= 2 ? 7 : 14} r={level >= 3 ? 5 : 3.5} fill={c} />
      </Light>
      {level >= 3 && <path d="M22 80 h12 l-3 5 h-6 z" fill={RESOURCE_COLOR.stone} />}
    </g>
  );
}

function Spring({ level, lit }: ArtProps) {
  const c = RESOURCE_COLOR.crystal;
  const spikes =
    level >= 3
      ? ['M30 52 L36 22 L42 52 Z', 'M44 50 L50 10 L56 50 Z', 'M58 52 L64 24 L70 52 Z']
      : level >= 2
        ? ['M34 52 L40 26 L46 52 Z', 'M52 52 L60 20 L66 52 Z']
        : ['M44 52 L50 26 L56 52 Z'];
  return (
    <g>
      <Shadow w={38} cy={84} />
      <ellipse cx={50} cy={64} rx={38} ry={22} className="base-body-2" stroke={RESOURCE_COLOR.stone} strokeWidth={2.5} />
      <Light lit={lit}>
        <ellipse cx={50} cy={64} rx={29} ry={15} fill={c} opacity={0.55} stroke={c} strokeWidth={2} />
      </Light>
      {spikes.map((d) => (
        <path key={d} d={d} fill={c} opacity={0.9} stroke={c} strokeWidth={1.5} strokeLinejoin="round" />
      ))}
    </g>
  );
}

function Headquarters({ level, lit }: ArtProps) {
  const c = RESOURCE_COLOR.crystal;
  const towerTop = level >= 2 ? 70 : 96;
  return (
    <g>
      <Shadow w={84} cy={180} cx={100} />
      {[22, 152].map((x) => (
        <g key={x}>
          <rect x={x} y={towerTop} width={26} height={176 - towerTop} rx={3} className="base-body-2" stroke={c} strokeWidth={3} />
          {level >= 2 && (
            <path d={`M${x - 4} ${towerTop} L${x + 13} ${towerTop - 24} L${x + 30} ${towerTop} Z`} className="base-body" stroke={c} strokeWidth={3} strokeLinejoin="round" />
          )}
          <Light lit={lit}>
            <rect x={x + 8} y={towerTop + 18} width={10} height={14} rx={5} fill={LIME} />
          </Light>
        </g>
      ))}
      <rect x={42} y={80} width={116} height={96} rx={4} className="base-body" stroke={c} strokeWidth={3} />
      <path d="M32 84 L100 34 L168 84 Z" className="base-body-2" stroke={c} strokeWidth={3} strokeLinejoin="round" />
      {level >= 3 && (
        <g>
          <line x1={100} y1={34} x2={100} y2={10} stroke={c} strokeWidth={3} />
          <Light lit={lit}>
            <circle cx={100} cy={8} r={7} fill={LIME} />
          </Light>
        </g>
      )}
      <Light lit={lit}>
        <path d="M84 176 V148 A16 16 0 0 1 116 148 V176 Z" fill={LIME} />
        <rect x={56} y={100} width={14} height={14} rx={2} fill={LIME} />
        <rect x={130} y={100} width={14} height={14} rx={2} fill={LIME} />
      </Light>
      {level >= 2 && (
        <g>
          <line x1={60} y1={80} x2={60} y2={52} stroke={c} strokeWidth={2.5} />
          <path d="M60 52 L80 57 L60 63 Z" fill={LIME} />
        </g>
      )}
    </g>
  );
}

function Decor({ id, lit }: { id: string; lit: boolean }) {
  switch (id) {
    case 'path':
      return (
        <g>
          <rect x={6} y={6} width={88} height={88} rx={10} className="base-path" />
          {[
            [16, 18, 30, 22],
            [52, 14, 32, 26],
            [14, 50, 26, 30],
            [46, 48, 38, 20],
            [48, 74, 30, 14]
          ].map(([x, y, w, h]) => (
            <rect key={`${x}${y}`} x={x} y={y} width={w} height={h} rx={6} className="base-path-stone" />
          ))}
        </g>
      );
    case 'wall':
      return (
        <g>
          <Shadow w={42} cy={82} />
          <rect x={8} y={50} width={84} height={28} rx={3} className="base-body" stroke={RESOURCE_COLOR.stone} strokeWidth={2.5} />
          {[8, 31, 54, 77].map((x) => (
            <rect key={x} x={x} y={41} width={15} height={11} rx={1.5} className="base-body-2" stroke={RESOURCE_COLOR.stone} strokeWidth={2} />
          ))}
        </g>
      );
    case 'pine':
      return (
        <g>
          <Shadow w={24} />
          <rect x={46} y={72} width={8} height={16} fill={RESOURCE_COLOR.timber} />
          <path d="M50 10 L72 44 L28 44 Z" className="base-pine" stroke={PINE} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M50 28 L78 74 L22 74 Z" className="base-pine" stroke={PINE} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      );
    case 'lamp':
      return (
        <g>
          <Shadow w={14} />
          <line x1={50} y1={88} x2={50} y2={38} stroke={RESOURCE_COLOR.stone} strokeWidth={4} strokeLinecap="round" />
          <rect x={40} y={26} width={20} height={14} rx={3} className="base-body-2" stroke={RESOURCE_COLOR.stone} strokeWidth={2} />
          <Light lit={lit}>
            <circle cx={50} cy={33} r={22} fill={LIME} opacity={0.18} />
            <circle cx={50} cy={33} r={5} fill={LIME} />
          </Light>
        </g>
      );
    case 'banner':
      return (
        <g>
          <Shadow w={14} />
          <line x1={34} y1={90} x2={34} y2={10} stroke={RESOURCE_COLOR.stone} strokeWidth={4} strokeLinecap="round" />
          <path d="M36 14 H74 V56 L55 46 L36 56 Z" fill={RESOURCE_COLOR.timber} />
          <rect x={36} y={24} width={38} height={6} fill={LIME} />
        </g>
      );
    case 'garden':
      return (
        <g>
          <Shadow w={38} cy={86} />
          <rect x={12} y={48} width={76} height={36} rx={8} className="base-soil" stroke={RESOURCE_COLOR.timber} strokeWidth={2} />
          {[
            [26, 60, RESOURCE_COLOR.iron],
            [42, 70, LIME],
            [56, 58, RESOURCE_COLOR.crystal],
            [72, 70, RESOURCE_COLOR.iron],
            [34, 76, RESOURCE_COLOR.crystal],
            [64, 76, LIME]
          ].map(([x, y, color]) => (
            <circle key={`${x}${y}`} cx={x as number} cy={y as number} r={4.5} fill={color as string} />
          ))}
        </g>
      );
    case 'fountain':
      return (
        <g>
          <Shadow w={36} cy={84} />
          <ellipse cx={50} cy={66} rx={36} ry={18} className="base-body-2" stroke={RESOURCE_COLOR.stone} strokeWidth={2.5} />
          <Light lit={lit}>
            <ellipse cx={50} cy={66} rx={27} ry={11} fill={RESOURCE_COLOR.crystal} opacity={0.6} />
          </Light>
          <rect x={46} y={36} width={8} height={30} className="base-body" stroke={RESOURCE_COLOR.stone} strokeWidth={2} />
          <path d="M50 36 C 40 20, 30 30, 28 44 M50 36 C 60 20, 70 30, 72 44" fill="none" stroke={RESOURCE_COLOR.crystal} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

export function TrophyArt({ trophyId, verified }: { trophyId: string; verified?: boolean }) {
  const def = getTrophyDef(trophyId);
  if (!def) return null;
  const c = TIER_COLOR[def.tier];
  return (
    <g>
      <Shadow w={24} cy={90} />
      <rect x={30} y={74} width={40} height={14} rx={2} className="base-body-2" stroke={c} strokeWidth={2} />
      {def.shape === 'cup' && (
        <g fill={c}>
          <path d="M32 22 H68 V32 A18 18 0 0 1 32 32 Z" />
          <path d="M32 26 H24 A8 8 0 0 0 32 40" fill="none" stroke={c} strokeWidth={3} />
          <path d="M68 26 H76 A8 8 0 0 1 68 40" fill="none" stroke={c} strokeWidth={3} />
          <rect x={46} y={50} width={8} height={14} />
          <rect x={38} y={63} width={24} height={8} rx={2} />
        </g>
      )}
      {def.shape === 'monument' && (
        <g>
          <path d="M40 74 L43 26 L50 12 L57 26 L60 74 Z" fill={c} opacity={0.9} />
          <path d="M50 12 L57 26 L60 74 L50 74 Z" fill="#000" opacity={0.18} />
        </g>
      )}
      {def.shape === 'medal' && (
        <g>
          <path d="M38 14 L50 40 L44 42 L32 16 Z" fill={RESOURCE_COLOR.crystal} />
          <path d="M62 14 L50 40 L56 42 L68 16 Z" fill={RESOURCE_COLOR.iron} />
          <circle cx={50} cy={52} r={16} fill={c} />
          <circle cx={50} cy={52} r={9} fill="none" stroke="#000" strokeOpacity={0.25} strokeWidth={3} />
          <rect x={48} y={66} width={4} height={8} fill={c} />
        </g>
      )}
      {def.shape === 'statue' && (
        <g fill={c}>
          <rect x={22} y={10} width={56} height={5} rx={2} />
          <path d="M34 15 L42 34 M66 15 L58 34" stroke={c} strokeWidth={5} strokeLinecap="round" />
          <circle cx={50} cy={32} r={7} />
          <path d="M41 36 H59 L56 58 H44 Z" />
          <path d="M45 58 L43 74 M55 58 L57 74" stroke={c} strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      {verified && (
        <g>
          <circle cx={80} cy={20} r={10} fill={RESOURCE_COLOR.crystal} />
          <path d="M75 20 L79 24 L86 16" fill="none" stroke="#06131a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

/** Artwork for any placed item, drawn in a 100×100 box (200×200 for HQ). */
export function ItemArt({ item, lit, verified }: { item: PlacedItem; lit: boolean; verified?: boolean }) {
  if (item.itemId.startsWith(TROPHY_ITEM_PREFIX)) {
    return <TrophyArt trophyId={item.itemId.slice(TROPHY_ITEM_PREFIX.length)} verified={verified} />;
  }
  const level = Math.max(item.level, 1);
  const props = { level, lit };
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
    default:
      return <Decor id={item.itemId} lit={lit} />;
  }
}

/** Standalone preview used in the build menu and info sheet. */
export function ItemPreview({ itemId, level = 1, trophyId, verified, size = 56 }: {
  itemId?: string;
  level?: number;
  trophyId?: string;
  verified?: boolean;
  size?: number;
}) {
  const id = trophyId ? `${TROPHY_ITEM_PREFIX}${trophyId}` : itemId ?? '';
  const box = itemSize(id) * T;
  return (
    <svg viewBox={`0 0 ${box} ${box}`} width={size} height={size} aria-hidden="true" className="base-preview">
      <ItemArt item={{ uid: 'preview', itemId: id, x: 0, y: 0, level }} lit verified={verified} />
    </svg>
  );
}

function accentFor(itemId: string): string {
  if (itemId === 'hq') return RESOURCE_COLOR.crystal;
  if (itemId === 'watchtower') return RESOURCE_COLOR.stone;
  if (itemId === 'lodge') return RESOURCE_COLOR.timber;
  if (itemId === 'forge') return RESOURCE_COLOR.iron;
  return RESOURCE_COLOR.crystal;
}

type BoardProps = {
  state: GameState;
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
  const construction = state.construction;

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
        const building = construction?.uid === item.uid;
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
            className={`base-item ${selected ? 'is-selected' : ''} ${placing ? 'is-inert' : ''}`}
            role={placing ? undefined : 'button'}
            tabIndex={placing ? -1 : 0}
            aria-label={labelForItem(item)}
            onClick={placing ? undefined : () => onItem(item.uid)}
            onKeyDown={placing ? undefined : (e) => onKeyActivate(e, () => onItem(item.uid))}>
            <rect width={size * T} height={size * T} fill="transparent" />
            {selected && (
              <rect x={3} y={3} width={size * T - 6} height={size * T - 6} rx={12} className="base-selection" />
            )}
            {building && item.level === 0 ? (
              <rect x={14} y={30} width={size * T - 28} height={size * T - 40} rx={4} className="base-foundation" />
            ) : (
              <ItemArt item={item} lit={lit} verified={verified} />
            )}
            {def?.kind === 'structure' && !building && (
              <LevelPips level={item.level} color={accentFor(item.itemId)} cx={(size * T) / 2} y={size * T - 4} />
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
