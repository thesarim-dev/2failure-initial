import type { Customization } from '../../game/catalog';
import { fx } from '../../lib/feedback';
import type { KeyboardEvent, ReactNode } from 'react';
import {
  TROPHY_ITEM_PREFIX,
  buildableBounds,
  getItemDef,
  isTileBuildable
} from '../../game/catalog';
import { itemSize, type GameState, type PlacedItem, type TodayPlan } from '../../game/engine';
import { ArtDefs, ItemArt, TerrainTile, THEME_SHADES, themeFor } from './BaseArt';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BaseCritters, BaseLife } from './Critters';
import { GroundDetail, GroundEdges } from './GroundDetail';
import { SlabSides } from './SlabSides';
import { bakeGround } from './groundBake';
import { IsoEdge, IsoEdgePost, IsoItemArt, IsoScaffold, P as isoP, isIsoItem, type Links } from './IsoArt';

/** Items that join up with neighbours of the same kind; oriented ones only when facing the same way. */
const JOINS = new Set(['arch', 'flowers', 'garden', 'lanterns', 'bridge']);
const ORIENTED = new Set(['arch', 'garden', 'lanterns', 'bridge']);

export { ItemArt, TrophyArt } from './BaseArt';

const T = 100; // tile size in board units

/** Small dots under a building showing its level. */
function LevelPips({ level, color, cx = 50, y = 97 }: { level: number; color: string; cx?: number; y?: number }) {
  if (level < 1) return null;
  // From level 4, a gold crest with the number (pips would sprawl).
  if (level >= 4) {
    return (
      <g className="level-crest" aria-hidden="true">
        <path
          d={`M${cx - 11} ${y - 8} h22 v8 q0 7 -11 10 q-11 -3 -11 -10 z`}
          fill="#f7c948"
          stroke="#7a4e00"
          strokeWidth={1.4}
        />
        <path d={`M${cx - 8} ${y - 6} h16 v3`} fill="none" stroke="#fff6c8" strokeWidth={1} strokeLinecap="round" opacity={0.8} />
        <text x={cx} y={y + 3} textAnchor="middle" fontSize={10} fontWeight={900} fill="#3a2400" fontFamily="'Archivo Black', 'Space Grotesk', sans-serif">
          {level}
        </text>
      </g>
    );
  }
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

/** Low models get a tighter preview frame so they don't look tiny. */
const LOW_ITEMS = new Set(['garden', 'wall', 'flowers', 'bridge', 'lilypad', 'picnic', 'plyobox', 'coop', 'tent', 'fountain']);
/** Isometric decorations: a tighter frame than buildings so they fill their thumbnail. */
const TALL_DECOR = new Set(['arch', 'banner', 'windmill', 'pullupbar', 'dipbars', 'punchbag', 'lanterns', 'parasol', 'statue', 'well']);

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
  if (isIsoItem(id)) {
    const s2 = itemSize(id) === 2;
    return (
      <svg
        viewBox={s2 ? '-112 -84 224 190' : LOW_ITEMS.has(id) ? '-54 -24 108 84' : id === 'windmill' ? '-50 -84 100 128' : TALL_DECOR.has(id) ? '-46 -64 92 112' : id.startsWith(TROPHY_ITEM_PREFIX) ? '-54 -80 108 124' : '-56 -84 112 140'}
        width={size}
        height={size}
        aria-hidden="true"
        className="base-preview">
        <ArtDefs />
        <IsoItemArt item={{ uid: 'preview', itemId: id, x: 0, y: 0, level, style, color }} ox={0} oy={0} lit />
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${box} ${box}`} width={size} height={size} aria-hidden="true" className="base-preview">
      <ArtDefs />
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
  /** Press and hold an item to pick it up and drag it to a new spot. */
  onItemLongPress?: (uid: string) => void;
  tileLabel: (x: number, y: number) => string;
  /** Paint mode: drag across tiles to paint terrain. */
  /** Fence mode: taps pick the nearest tile edge. */
  fencing?: boolean;
  /** A drawing stroke: 'add' if it started on an empty edge, 'remove' if on a filled one. */
  onEdge?: (edgeKey: string, mode: 'add' | 'remove') => void;
  painting?: boolean;
  /** Paint tool: brush (drag), box (two corners) or fill (connected patch). */
  paintTool?: 'brush' | 'box' | 'fill';
  /** Box / fill: a tap on a tile (taps only; drags pan the map). */
  onPaintTap?: (tile: [number, number]) => void;
  /** Box / fill: the tile under the pointer, for a live preview. */
  onPaintHover?: (tile: [number, number] | null) => void;
  /** Tiles to highlight as a preview (what a paint will cover, or a building's footprint). */
  previewTiles?: Set<string> | null;
  previewTone?: 'paint' | 'place' | 'blocked';
  /** The first corner of a box, marked until the second tap. */
  anchorTile?: string | null;
  /** A see-through building previewed at a spot before it's confirmed. */
  ghost?: { itemId: string; x: number; y: number; level?: number; custom?: Customization; replaceUid?: string } | null;
  /** Drag the ghost: called with the top-left tile it would move to. */
  onGhostDrag?: (x: number, y: number) => void;
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


/** What the map last showed (module-level, so it survives leaving the Base tab). */
const lastSeen: { uids: Set<string> | null; levels: Map<string, number> } = { uids: null, levels: new Map() };

export function BaseBoard({
  state,
  plan,
  lit,
  selectedUid,
  validTiles,
  labelForItem,
  onTile,
  onItem,
  onItemLongPress,
  tileLabel,
  fencing = false,
  onEdge,
  painting = false,
  paintTool = 'brush',
  onPaintTap,
  onPaintHover,
  previewTiles = null,
  previewTone = 'paint',
  anchorTile = null,
  ghost = null,
  onGhostDrag,
  onPaint,
  svgId
}: BoardProps) {
  // Remember what you've already seen on the map (across visits to the tab),
  // so a build that finished while you trained chimes when you come back.
  useEffect(() => {
    const seenUids = { current: lastSeen.uids };
    const seenLevels = { current: lastSeen.levels };
    const prev = seenUids.current;
    if (prev) {
      const changes: Record<string, 'placed' | 'built'> = {};
      for (const p of state.placed) {
        if (!prev.has(p.uid)) changes[p.uid] = 'placed';
        else if ((seenLevels.current.get(p.uid) ?? p.level) < p.level) changes[p.uid] = 'built';
      }
      const keys = Object.keys(changes);
      if (keys.some((k) => changes[k] === 'built')) window.setTimeout(() => fx.built(), 400);
    }
    lastSeen.uids = new Set(state.placed.map((p) => p.uid));
    lastSeen.levels = new Map(state.placed.map((p) => [p.uid, p.level]));
  }, [state.placed]);

  // Land is bought with coins, separately from HQ level.
  const land = state.landLevel;
  // The fence tool shows the tile grid as a guide, but it isn't placing a building.
  const placing = validTiles !== null && !fencing;
  const inert = placing || painting;
  const jobs = new Map(state.constructions.map((job) => [job.uid, job]));
  const { min, max } = buildableBounds(land);
  const a = min * T;
  const b = (max + 1) * T;

  // Fit your land to the map's actual shape: nearly full width on phones,
  // full height on wide screens. The countryside fills the rest.
  const span = b - a;
  const svgRef = useRef<SVGSVGElement>(null);
  const [aspect, setAspect] = useState(0.8);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setAspect(height / width);
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  // The land is a floating block: diamond top, dirt sides, a shadow below.
  const SLAB = 92;
  const topY = a * 0.5 - 95; // room for tall buildings at the back
  const bottomY = b * 0.5 + SLAB + 28;
  const viewW = Math.max(span * 1.1, (bottomY - topY) / aspect);
  const viewH = viewW * aspect;
  const centerY = (topY + bottomY) / 2;

  // --- Camera: pinch / wheel to zoom, drag to pan ---------------------------
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  // Open a little zoomed in so buildings are a comfortable size (pinch out, or Fit, to see it all).
  const START_ZOOM = 1.4;
  const [cam, setCam] = useState({ zoom: START_ZOOM, cx: 0, cy: centerY });
  const camRef = useRef(cam);
  camRef.current = cam;
  useEffect(() => setCam({ zoom: START_ZOOM, cx: 0, cy: centerY }), [land, centerY]);

  const clampCam = useCallback(
    (next: { zoom: number; cx: number; cy: number }) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.zoom));
      const w = viewW / zoom;
      const h = viewH / zoom;
      const clampAxis = (c: number, centre: number, full: number, part: number) =>
        part >= full ? centre : Math.min(centre + (full - part) / 2, Math.max(centre - (full - part) / 2, c));
      return { zoom, cx: clampAxis(next.cx, 0, viewW, w), cy: clampAxis(next.cy, centerY, viewH, h) };
    },
    [viewW, viewH, centerY]
  );
  const w = viewW / cam.zoom;
  const h = viewH / cam.zoom;
  const viewBox = `${cam.cx - w / 2} ${cam.cy - h / 2} ${w} ${h}`;

  const animate = useMemo(
    () => typeof window === 'undefined' || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Ground tiles: only the land you own. It grows as you expand.
  const ground: ReactNode[] = [];
  for (let y = min; y <= max; y++) {
    for (let x = min; x <= max; x++) {
      ground.push(<TerrainTile key={`t${x},${y}`} x={x} y={y} terrain={state.terrain?.[`${x},${y}`] ?? 'grass'} />);
    }
  }

  // Everything upright, sorted back to front so nearer things overlap.
  type Sprite = { key: string; depth: number; node: ReactNode };

  const sprites: Sprite[] = [];
  const groundItems: ReactNode[] = [];
  const placedForRender = ghost
    ? [
        ...state.placed.filter((p) => p.uid !== ghost.replaceUid),
        // Moving: the same building (same look) at the new spot. Placing: the chosen style and colour.
        ({
          ...(state.placed.find((p) => p.uid === ghost.replaceUid) ?? { itemId: ghost.itemId, level: Math.max(1, ghost.level ?? 1) }),
          ...(ghost.custom?.style ? { style: ghost.custom.style } : {}),
          ...(ghost.custom?.color ? { color: ghost.custom.color } : {}),
          ...(ghost.custom?.flip !== undefined ? { flip: ghost.custom.flip } : {}),
          uid: '__ghost',
          x: ghost.x,
          y: ghost.y
        }) as (typeof state.placed)[number]
      ]
    : state.placed;
  // Items that join up with neighbours of the same kind (pergolas, long beds, gym floors…).
  const linksFor = (() => {
    const group = (id: string) => (id === 'pullupbar' || id === 'dipbars' || id === 'punchbag' || id === 'plyobox' ? 'gym' : JOINS.has(id) ? id : null);
    const at = new Map<string, PlacedItem>();
    for (const p of placedForRender) if (group(p.itemId)) at.set(`${p.x},${p.y}`, p);
    const map = new Map<string, Links>();
    for (const p of placedForRender) {
      const g = group(p.itemId);
      if (!g) continue;
      // In the item's own frame: a rotated (mirrored) item's x runs along the world's y.
      const joins = (dx: number, dy: number, from: PlacedItem = p) => {
        const [wx, wy] = from.flip ? [dy, dx] : [dx, dy];
        const n = at.get(`${from.x + wx},${from.y + wy}`);
        return !!n && group(n.itemId) === g && (!ORIENTED.has(g) || !!n.flip === !!from.flip) ? n : null;
      };
      const links: Links = { px: !!joins(1, 0), mx: !!joins(-1, 0), py: !!joins(0, 1), my: !!joins(0, -1) };
      if (g === 'lanterns') {
        let index = 0;
        for (let cur: PlacedItem | null = p; cur && (cur = joins(-1, 0, cur)); ) index++;
        let after = 0;
        for (let cur: PlacedItem | null = p; cur && (cur = joins(1, 0, cur)); ) after++;
        links.run = { index, length: index + 1 + after };
      }
      map.set(p.uid, links);
    }
    return map;
  })();
  for (const item of placedForRender) {
    const size = itemSize(item.itemId);
    // Paths are paving: laid flat into the ground layer.
    if (item.itemId === 'path') {
      const pathJob = jobs.get(item.uid);
      if (pathJob) {
        sprites.push({
          key: `${item.uid}-scaffold`,
          depth: item.x + item.y + 1,
          node: (
            <g key={`${item.uid}-scaffold`} pointerEvents="none">
              <IsoScaffold ox={item.x * T} oy={item.y * T} size={1} setsRemaining={pathJob.setsRemaining} height={18} />
            </g>
          )
        });
      }
      groundItems.push(
        <g
          key={item.uid}
          transform={`translate(${item.x * T} ${item.y * T})`}
          className="base-item"
          role={inert ? undefined : 'button'}
          tabIndex={inert ? -1 : 0}
          aria-label={labelForItem(item)}
          pointerEvents={inert ? 'none' : undefined}
          onClick={inert ? undefined : () => onItem(item.uid)}
          onKeyDown={inert ? undefined : (e) => onKeyActivate(e, () => onItem(item.uid))}>
          <g opacity={pathJob ? 0.4 : 1}>
            <ItemArt item={item} lit={lit} />
          </g>
        </g>
      );
      continue;
    }
    if (isIsoItem(item.itemId)) {
      const construction = jobs.get(item.uid);
      const def = getItemDef(item.itemId);
      const ox = item.x * T;
      const oy = item.y * T;
      const [px, py] = isoP(ox + size * T, oy + size * T);
      const foot = [isoP(ox, oy), isoP(ox + size * T, oy), isoP(ox + size * T, oy + size * T), isoP(ox, oy + size * T)]
        .map(([x, y]) => `${x},${y}`)
        .join(' ');
      sprites.push({
        key: item.uid,
        depth: item.x + item.y + size,
        node: (
          <g
            key={item.uid}
            data-uid={item.uid}
            className={`base-item group ${selectedUid === item.uid ? 'is-selected' : ''} ${inert ? 'is-inert' : ''}`}
            role={inert ? undefined : 'button'}
            tabIndex={inert ? -1 : 0}
            aria-label={labelForItem(item)}
            pointerEvents={inert ? 'none' : undefined}
            onClick={inert ? undefined : () => onItem(item.uid)}
            onKeyDown={inert ? undefined : (e) => onKeyActivate(e, () => onItem(item.uid))}>
            <polygon points={foot} fill="transparent" />
            <g className={`base-item-art transition-transform duration-200 ease-out group-hover:-translate-y-1`}>
              {construction && item.level === 0 ? (
                // Being built: a see-through blueprint of the building it will be.
                <g className="base-blueprint">
                  <g transform={item.flip ? `translate(${2 * isoP(ox + (size * T) / 2, oy + (size * T) / 2)[0]} 0) scale(-1 1)` : undefined}>
                    <IsoItemArt item={{ ...item, level: construction.targetLevel }} ox={ox} oy={oy} lit={false} plan={plan} links={linksFor.get(item.uid)} />
                  </g>
                </g>
              ) : (
                <g className="base-pop">
                  {/* Rotated: mirrored around the footprint's centre, so it faces the other way. */}
                  <g transform={item.flip ? `translate(${2 * isoP(ox + (size * T) / 2, oy + (size * T) / 2)[0]} 0) scale(-1 1)` : undefined}>
                    <IsoItemArt
                      item={item}
                      ox={ox}
                      oy={oy}
                      lit={lit}
                      plan={plan}
                      verified={item.itemId.startsWith(TROPHY_ITEM_PREFIX) ? state.trophies[item.itemId.slice(TROPHY_ITEM_PREFIX.length)]?.verified : undefined}
                      links={linksFor.get(item.uid)}
                    />
                  </g>
                </g>
              )}
            </g>
            {construction && (
              <IsoScaffold
                ox={ox}
                oy={oy}
                size={size}
                setsRemaining={construction.setsRemaining}
                progress={1 - construction.setsRemaining / Math.max(1, construction.setsTotal)}
                height={item.itemId === 'wall' || item.itemId === 'garden' ? 34 : item.itemId.startsWith(TROPHY_ITEM_PREFIX) ? 48 : undefined}
              />
            )}
            {def?.kind === 'structure' && !construction && (
              <g transform={`translate(${px - (size * T) / 2} ${py - size * T + 10})`}>
                <LevelPips level={item.level} color={accentFor(item.itemId, item.color)} cx={(size * T) / 2} y={size * T - 4} />
              </g>
            )}
          </g>
        )
      });
      continue;
    }
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
          data-uid={item.uid}
          className={`base-item group ${selected ? 'is-selected' : ''} ${inert ? 'is-inert' : ''}`}
          role={inert ? undefined : 'button'}
          tabIndex={inert ? -1 : 0}
          aria-label={labelForItem(item)}
          pointerEvents={inert ? 'none' : undefined}
          onClick={inert ? undefined : () => onItem(item.uid)}
          onKeyDown={inert ? undefined : (e) => onKeyActivate(e, () => onItem(item.uid))}>
          {/* Tap target: the tile itself. */}
          <polygon
            points={[project([item.x * T, item.y * T]), project([(item.x + size) * T, item.y * T]), project([(item.x + size) * T, (item.y + size) * T]), project([item.x * T, (item.y + size) * T])]
              .map(([x, y]) => `${x},${y}`)
              .join(' ')}
            fill="transparent"
          />
          {/* The figure stands on the centre of its tile. */}
          <g transform={`translate(${cx - box / 2} ${cy - box * 0.9})`}>
            <rect x={box * 0.12} y={box * 0.1} width={box * 0.76} height={box * 0.82} fill="transparent" />
            {building && item.level === 0 && (
              <g className="base-blueprint">
                <g transform={item.flip ? `translate(${box} 0) scale(-1 1)` : undefined}>
                  <ItemArt item={{ ...item, level: Math.max(1, construction?.targetLevel ?? 1) }} lit={false} verified={verified} plan={plan} />
                </g>
              </g>
            )}
            {!(building && item.level === 0) && (
              <g className={`base-item-art transition-transform duration-200 ease-out group-hover:-translate-y-1`}>
                <g className="base-pop">
                  <g transform={item.flip ? `translate(${box} 0) scale(-1 1)` : undefined}>
                    <ItemArt item={item} lit={lit} verified={verified} plan={plan} />
                  </g>
                </g>
              </g>
            )}
            {def?.kind === 'structure' && !building && (
              <LevelPips level={item.level} color={accentFor(item.itemId, item.color)} cx={box / 2} y={box - 4} />
            )}
          </g>
          {/* While it's being built: scaffolding on the exact footprint. */}
          {building && construction && (
            <IsoScaffold
              ox={item.x * T}
              oy={item.y * T}
              size={size}
              setsRemaining={construction.setsRemaining}
              progress={1 - construction.setsRemaining / Math.max(1, construction.setsTotal)}
              height={44}
            />
          )}
        </g>
      )
    });
  }
  // Fences, walls and hedges along tile edges sit between the two tiles' depths.
  // Each piece knows whether its run continues, so joins are seamless.
  const edges = state.edges ?? {};
  const vertexEdges = new Map<string, Array<{ dir: 'h' | 'v'; kind: string }>>();
  const touch = (vx: number, vy: number, dir: 'h' | 'v', kind: string) => {
    const k = `${vx},${vy}`;
    if (!vertexEdges.has(k)) vertexEdges.set(k, []);
    vertexEdges.get(k)!.push({ dir, kind });
  };
  for (const [edgeKey, kind] of Object.entries(edges)) {
    const m = /^([nw]):(-?\d+),(-?\d+)$/.exec(edgeKey);
    if (!m) continue;
    const ex = Number(m[2]);
    const ey = Number(m[3]);
    const along = m[1] === 'n';
    const prevKey = along ? `n:${ex - 1},${ey}` : `w:${ex},${ey - 1}`;
    const nextKey = along ? `n:${ex + 1},${ey}` : `w:${ex},${ey + 1}`;
    if (along) {
      touch(ex, ey, 'h', kind);
      touch(ex + 1, ey, 'h', kind);
    } else {
      touch(ex, ey, 'v', kind);
      touch(ex, ey + 1, 'v', kind);
    }
    sprites.push({
      key: `edge-${edgeKey}`,
      depth: ex + ey + 0.5,
      node: (
        <g key={`edge-${edgeKey}`}>
          <IsoEdge edgeKey={edgeKey} kind={kind} prev={edges[prevKey] === kind} next={edges[nextKey] === kind} />
        </g>
      )
    });
  }
  // Posts: fences get one at every joint; walls get a pier where they turn, meet or end.
  for (const [k, list] of vertexEdges) {
    const [vx, vy] = k.split(',').map(Number);
    const fence = list.some((e) => e.kind === 'fence');
    const walls = list.filter((e) => e.kind === 'wall');
    const straightWall = walls.length === 2 && list.length === 2 && walls[0].dir === walls[1].dir;
    const kind = walls.length && !straightWall ? 'wall' : fence ? 'fence' : null;
    if (!kind) continue;
    sprites.push({
      key: `post-${k}`,
      depth: vx + vy + 0.55,
      node: (
        <g key={`post-${k}`}>
          <IsoEdgePost vx={vx} vy={vy} kind={kind} />
        </g>
      )
    });
  }
  // The previewed building is see-through and can't be tapped.
  for (let i = 0; i < sprites.length; i++) {
    if (sprites[i].key.startsWith('__ghost')) {
      sprites[i] = { ...sprites[i], node: <g key={sprites[i].key} className="base-ghost" pointerEvents="none">{sprites[i].node}</g> };
    }
  }
  sprites.sort((p, q) => p.depth - q.depth);

  const selected = state.placed.find((p) => p.uid === selectedUid);

  const groundRef = useRef<SVGGElement>(null);
  const lastPainted = useRef<string | null>(null);

  /** Screen point → SVG units (the current, zoomed view). */
  const toSvg = (clientX: number, clientY: number): [number, number] | null => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return [p.x, p.y];
  };
  /** Screen point → ground tile, or null outside your land. */
  const tileAt = (clientX: number, clientY: number): [number, number] | null => {
    const ctm = groundRef.current?.getScreenCTM();
    if (!ctm) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    const x = Math.floor(point.x / T);
    const y = Math.floor(point.y / T);
    return isTileBuildable(x, y, land) ? [x, y] : null;
  };
  const fenceStroke = useRef<{ mode: 'add' | 'remove'; last: string } | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  /** Screen point → the nearest edge between tiles (`n:x,y` or `w:x,y`). */
  const edgeAt = (clientX: number, clientY: number, stickTo?: string): string | null => {
    const ctm = groundRef.current?.getScreenCTM();
    if (!ctm) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    const fx = point.x / T;
    const fy = point.y / T;
    const nearX = Math.round(fx);
    const nearY = Math.round(fy);
    const dy = Math.abs(fy - nearY);
    const dx = Math.abs(fx - nearX);
    // Near a corner both lines are equally close: a stroke stays on its current
    // piece until it clearly heads off along one of the lines.
    if (stickTo && dx < 0.24 && dy < 0.24) return stickTo;
    return dy < dx ? `n:${Math.floor(fx)},${nearY}` : `w:${nearX},${Math.floor(fy)}`;
  };
  const paintAt = (clientX: number, clientY: number) => {
    const tile = tileAt(clientX, clientY);
    if (!tile || !onPaint) return;
    const key = `${tile[0]},${tile[1]}`;
    if (lastPainted.current === key) return;
    lastPainted.current = key;
    onPaint(tile);
  };
  /** Zoom by `factor`, keeping the SVG point under (clientX, clientY) still. */
  const zoomAt = (factor: number, clientX: number, clientY: number, from = camRef.current) => {
    const anchor = toSvg(clientX, clientY);
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, from.zoom * factor));
    if (!anchor) return clampCam({ ...from, zoom });
    const k = from.zoom / zoom;
    return clampCam({ zoom, cx: anchor[0] + (from.cx - anchor[0]) * k, cy: anchor[1] + (from.cy - anchor[1]) * k });
  };

  // Mouse wheel / trackpad zoom (needs a non-passive listener to stop page scroll).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0018));
      setCam(zoomAt(factor, event.clientX, event.clientY));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  });

  // Touch and mouse: one pointer pans (or paints), two pointers pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startX: number;
    startY: number;
    cam: { zoom: number; cx: number; cy: number };
    dist?: number;
    midX?: number;
    midY?: number;
  } | null>(null);
  const moved = useRef(false);

  const beginGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [p, q] = pts;
      gesture.current = {
        startX: (p.x + q.x) / 2,
        startY: (p.y + q.y) / 2,
        cam: camRef.current,
        dist: Math.hypot(p.x - q.x, p.y - q.y) || 1,
        midX: (p.x + q.x) / 2,
        midY: (p.y + q.y) / 2
      };
    } else if (pts.length === 1) {
      gesture.current = { startX: pts[0].x, startY: pts[0].y, cam: camRef.current };
    } else {
      gesture.current = null;
    }
  };

  const ghostDrag = useRef<{ dx: number; dy: number } | null>(null);
  // Long-press an item: pick it up (move mode) and keep dragging with the same finger.
  const longPress = useRef<{ timer: number; uid: string; x: number; y: number } | null>(null);
  const cancelLongPress = () => {
    if (longPress.current) window.clearTimeout(longPress.current.timer);
    longPress.current = null;
  };
  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) moved.current = false;
    beginGesture();
    // Press and hold an item to pick it up.
    if (pointers.current.size === 1 && !ghost && !inert && onItemLongPress) {
      const target = (event.target as Element).closest?.('[data-uid]');
      const uid = target?.getAttribute('data-uid');
      const item = uid ? state.placed.find((p) => p.uid === uid) : undefined;
      if (item && item.itemId !== 'hq') {
        const svg = event.currentTarget;
        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startY = event.clientY;
        cancelLongPress();
        longPress.current = {
          uid: item.uid,
          x: startX,
          y: startY,
          timer: window.setTimeout(() => {
            const tile = tileAt(startX, startY);
            longPress.current = null;
            if (!tile) return;
            svg.setPointerCapture?.(pointerId);
            ghostDrag.current = { dx: tile[0] - item.x, dy: tile[1] - item.y };
            moved.current = true; // don't also open its sheet
            navigator.vibrate?.(15);
            onItemLongPress(item.uid);
          }, 450)
        };
      }
    }
    // Pressing on the item being placed picks it up: drag it to a new spot.
    if (pointers.current.size === 1 && ghost && onGhostDrag) {
      const tile = tileAt(event.clientX, event.clientY);
      const n = itemSize(ghost.itemId);
      if (tile && tile[0] >= ghost.x && tile[0] < ghost.x + n && tile[1] >= ghost.y && tile[1] < ghost.y + n) {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        ghostDrag.current = { dx: tile[0] - ghost.x, dy: tile[1] - ghost.y };
        return;
      }
    }
    if (pointers.current.size === 1 && fencing) {
      // Start a fence stroke: erase if it starts on a piece, otherwise draw.
      const key = edgeAt(event.clientX, event.clientY);
      if (key) {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        const mode = state.edges?.[key] ? 'remove' : 'add';
        fenceStroke.current = { mode, last: key };
        setHoverEdge(key);
        onEdge?.(key, mode);
      }
      return;
    }
    if (pointers.current.size === 1 && painting && paintTool === 'brush') {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      lastPainted.current = null;
      paintAt(event.clientX, event.clientY);
    }
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    // Moving before the long-press fires means it's a pan, not a pick-up.
    const lp = longPress.current;
    if (lp && Math.hypot(event.clientX - lp.x, event.clientY - lp.y) > 8) cancelLongPress();
    const drag = ghostDrag.current;
    if (drag && pointers.current.size <= 1) {
      const tile = tileAt(event.clientX, event.clientY);
      if (tile) {
        moved.current = true;
        onGhostDrag?.(tile[0] - drag.dx, tile[1] - drag.dy);
      }
      return;
    }
    if (fencing && pointers.current.size <= 1) {
      // Preview the edge under the pointer, and keep drawing while pressed.
      const stroke = fenceStroke.current;
      const key = edgeAt(event.clientX, event.clientY, stroke?.last);
      setHoverEdge(key);
      if (stroke && key && key !== stroke.last && (event.buttons || event.pointerType !== 'mouse')) {
        stroke.last = key;
        moved.current = true;
        onEdge?.(key, stroke.mode);
      }
      if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      return;
    }
    // Box / fill: live preview of what a tap would paint (mouse hover or a finger resting).
    if (painting && paintTool !== 'brush' && pointers.current.size <= 1) onPaintHover?.(tileAt(event.clientX, event.clientY));
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (pts.length >= 2 && g.dist) {
      // Pinch: zoom around the fingers' midpoint and follow it as it moves.
      const [p, q] = pts;
      const dist = Math.hypot(p.x - q.x, p.y - q.y) || 1;
      const midX = (p.x + q.x) / 2;
      const midY = (p.y + q.y) / 2;
      moved.current = true;
      const zoomed = zoomAt(dist / g.dist, g.midX!, g.midY!, g.cam);
      const ctm = svgRef.current?.getScreenCTM();
      const unitsPerPx = ctm ? 1 / ctm.a : 1;
      const scale = g.cam.zoom / zoomed.zoom;
      setCam(
        clampCam({
          ...zoomed,
          cx: zoomed.cx - (midX - g.midX!) * unitsPerPx * scale,
          cy: zoomed.cy - (midY - g.midY!) * unitsPerPx * scale
        })
      );
      return;
    }
    if (painting && paintTool === 'brush') {
      if (event.buttons) paintAt(event.clientX, event.clientY);
      return;
    }
    if (!event.buttons && event.pointerType === 'mouse') return;
    const dx = event.clientX - g.startX;
    const dy = event.clientY - g.startY;
    if (!moved.current && Math.hypot(dx, dy) < 6) return;
    if (!moved.current) event.currentTarget.setPointerCapture?.(event.pointerId);
    moved.current = true;
    const ctm = svgRef.current?.getScreenCTM();
    const unitsPerPx = ctm ? (1 / ctm.a) * (g.cam.zoom / camRef.current.zoom) : 1;
    setCam(clampCam({ ...g.cam, cx: g.cam.cx - dx * unitsPerPx, cy: g.cam.cy - dy * unitsPerPx }));
  };

  const onPointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
    // Box / fill act on a tap (a press that didn't turn into a pan or pinch).
    if (painting && paintTool !== 'brush' && pointers.current.size === 1 && !moved.current && event.type === 'pointerup') {
      const tile = tileAt(event.clientX, event.clientY);
      if (tile) onPaintTap?.(tile);
    }
    pointers.current.delete(event.pointerId);
    cancelLongPress();
    ghostDrag.current = null;
    lastPainted.current = null;
    fenceStroke.current = null;
    if (event.pointerType !== 'mouse') setHoverEdge(null);
    beginGesture();
  };

  // A drag or pinch shouldn't also count as a tap on whatever is underneath.
  const onClickCapture = (event: React.MouseEvent) => {
    if (moved.current) {
      event.stopPropagation();
      event.preventDefault();
      moved.current = false;
    }
  };

  const fireflies = [0, 1, 2, 3, 4, 5].map((i) => {
    const [fx, fy] = project([a + 40 + ((i * 397) % Math.max(1, span - 80)), a + 40 + ((i * 613) % Math.max(1, span - 80))]);
    return <circle key={i} cx={fx} cy={fy - 30} r={3} className="base-firefly" style={{ animationDelay: `${i * 0.9}s` }} />;
  });

  // --- Cast shadows: light from the front-left, shadows fall back-right ----
  const shadowHeight = (itemId: string, level: number): number => {
    if (itemId === 'hq') return 120 + level * 20;
    if (itemId === 'watchtower') return 130 + level * 15;
    if (itemId === 'lodge' || itemId === 'forge') return 70 + level * 12;
    if (itemId.startsWith('trophy:')) return 70;
    if (['pine', 'windmill', 'barn', 'gazebo', 'arch', 'banner', 'torch'].includes(itemId)) return 70;
    if (['path', 'garden', 'flowers', 'grass', 'dirt', 'meadow', 'sand', 'plaza', 'water', 'snow', 'lilypad', 'bridge'].includes(itemId)) return 0;
    return 30;
  };
  const castShadows: ReactNode[] = [];
  for (const item of state.placed) {
    const h = item.level === 0 ? 20 : shadowHeight(item.itemId, item.level);
    if (h <= 0) continue;
    const size = itemSize(item.itemId);
    const inset = isIsoItem(item.itemId) ? 6 : size * 26;
    const x0 = item.x * T + inset;
    const y0 = item.y * T + inset;
    const x1 = (item.x + size) * T - inset;
    const y1 = (item.y + size) * T - inset;
    const dx = h * 0.28;
    const dy = -h * 0.9;
    const corners: Array<[number, number]> = [
      [x0, y0], [x1, y0], [x1, y1], [x0, y1],
      [x0 + dx, y0 + dy], [x1 + dx, y0 + dy], [x1 + dx, y1 + dy], [x0 + dx, y1 + dy]
    ].map(([wx, wy]) => project([wx, wy]));
    // Convex hull (monotone chain) of the footprint and its shifted copy.
    const sorted = [...corners].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: Array<[number, number]> = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper: Array<[number, number]> = [];
    for (const p of [...sorted].reverse()) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    castShadows.push(<polygon key={item.uid} points={hull.map((p) => p.join(',')).join(' ')} fill="#10200f" />);
  }

  // --- Static batching: the ground is baked into one image ------------------
  const [lx, ly] = project([a, b]);
  const [bx, by] = project([b, b]);
  const [rx, ry] = project([b, a]);
  const staticLayers = (
    <>
      <defs>
        <radialGradient id="base-land-light" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor="#fff6c8" stopOpacity="0.12" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </radialGradient>
        <linearGradient id="base-slab-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6040" />
          <stop offset="1" stopColor="#5a3c25" />
        </linearGradient>
        <linearGradient id="base-slab-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e4a2f" />
          <stop offset="1" stopColor="#3f2a19" />
        </linearGradient>
        <radialGradient id="base-slab-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ArtDefs />
      <g pointerEvents="none">
        <ellipse cx={bx} cy={by + SLAB + 6} rx={span * 0.55} ry={span * 0.09} fill="url(#base-slab-shadow)" />
        <polygon points={`${lx},${ly} ${bx},${by} ${bx},${by + SLAB} ${lx},${ly + SLAB}`} fill="url(#base-slab-left)" />
        <polygon points={`${bx},${by} ${rx},${ry} ${rx},${ry + SLAB} ${bx},${by + SLAB}`} fill="url(#base-slab-right)" />
        <SlabSides L={[lx, ly]} B={[bx, by]} R={[rx, ry]} depth={SLAB} span={span} />
        <line x1={bx} y1={by} x2={bx} y2={by + SLAB} stroke="#000" strokeOpacity={0.25} strokeWidth={1.5} />
      </g>
      <g transform={ISO} pointerEvents="none">
        {ground}
        {/* Gentle colour patches so the grass isn't one flat green. */}
        {Array.from({ length: (max - min + 1) * (max - min + 1) }, (_, i) => {
          const x = min + (i % (max - min + 1));
          const y = min + Math.floor(i / (max - min + 1));
          const terr = state.terrain?.[`${x},${y}`] ?? 'grass';
          if (terr !== 'grass' && terr !== 'meadow') return null;
          const n = Math.sin(x * 0.61 + y * 0.27) + Math.cos(x * 0.33 - y * 0.71) + Math.sin((x + y) * 0.19) * 0.6;
          if (Math.abs(n) < 0.7) return null;
          return (
            <rect
              key={`tint${x},${y}`}
              x={x * T}
              y={y * T}
              width={T}
              height={T}
              fill={n > 0 ? '#fff4b8' : '#06331a'}
              opacity={Math.min(0.13, (Math.abs(n) - 0.7) * 0.09)}
            />
          );
        })}
        <GroundEdges state={state} />
        <rect x={a} y={a} width={span} height={span} fill="url(#base-land-light)" />
      </g>
      <GroundDetail state={state} project={project} />
    </>
  );
  const staticRef = useRef<ReactNode>(staticLayers);
  staticRef.current = staticLayers;
  const bakeRect = useMemo(() => ({ x: -span / 2 - 14, y: topY, w: span + 28, h: bottomY - topY }), [span, topY, bottomY]);
  const occupancyKey = useMemo(
    () =>
      state.placed
        .map((p) => `${p.itemId}@${p.x},${p.y}`)
        .sort()
        .join('|'),
    [state.placed]
  );
  const bakeKey = `${land}|${JSON.stringify(state.terrain ?? {})}|${occupancyKey}`;
  const [baked, setBaked] = useState<{ url: string; rect: typeof bakeRect } | null>(null);
  const [bakeFailed, setBakeFailed] = useState(false);
  useEffect(() => {
    if (painting || bakeFailed) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const cssW = svgRef.current?.clientWidth || 400;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const px = (bakeRect.w / viewW) * cssW * dpr * 2.5;
      bakeGround(staticRef.current, bakeRect, px)
        .then((url) => {
          if (cancelled) return;
          setBaked({ url, rect: bakeRect });
        })
        .catch(() => {
          if (!cancelled) setBakeFailed(true);
        });
    }, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bakeKey, painting, bakeFailed, bakeRect]);
  const showLiveGround = painting || bakeFailed;
  const groundView = showLiveGround ? (
    staticLayers
  ) : baked && baked.rect === bakeRect ? (
    <image
      href={baked.url}
      x={baked.rect.x}
      y={baked.rect.y}
      width={baked.rect.w}
      height={baked.rect.h}
      preserveAspectRatio="none"
      pointerEvents="none"
      className="base-baked"
    />
  ) : (
    // Instant placeholder while the first bake finishes: plain land and sides.
    <g pointerEvents="none">
      <polygon points={`${lx},${ly} ${bx},${by} ${bx},${by + SLAB} ${lx},${ly + SLAB}`} fill="#7a5436" />
      <polygon points={`${bx},${by} ${rx},${ry} ${rx},${ry + SLAB} ${bx},${by + SLAB}`} fill="#5a3c25" />
      <g transform={ISO}>
        <rect x={a} y={a} width={span} height={span} fill="#4f8f3e" />
      </g>
    </g>
  );

  return (
    <svg
      ref={svgRef}
      id={svgId}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={onClickCapture}
      className={`base-board is-iso ${lit ? 'is-lit' : 'is-quiet'} ${placing ? 'is-placing' : ''} ${painting ? 'is-painting' : ''} ${cam.zoom > 1.02 ? 'is-zoomed' : ''}`}
      role="group">
      <defs>
        <filter id="base-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <radialGradient id="base-cloud-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0b1a10" stopOpacity="0.16" />
          <stop offset="0.7" stopColor="#0b1a10" stopOpacity="0.07" />
          <stop offset="1" stopColor="#0b1a10" stopOpacity="0" />
        </radialGradient>
        <pattern id="base-scaffold-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="16" className="base-scaffold-line" strokeWidth="3" />
        </pattern>
      </defs>
      <ArtDefs />

      {groundView}

      {/* The ground, in world units, tilted into diamonds. */}
      <g ref={groundRef} transform={ISO} pointerEvents="visiblePainted">
        {/* One tap target for the whole land (was one per tile). */}
        <rect
          x={a}
          y={a}
          width={span}
          height={span}
          fill="transparent"
          onClick={
            inert
              ? undefined
              : (e) => {
                  if (fencing) return; // fence strokes are handled on press / drag
                  const tile = tileAt(e.clientX, e.clientY);
                  if (tile) onTile(tile[0], tile[1]);
                }
          }
        />
        {groundItems}
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
                className={fencing ? 'base-valid-tile is-guide' : 'base-valid-tile'}
                vectorEffect="non-scaling-stroke"
                // In fence mode the tiles are only a guide; taps go to the nearest edge.
                pointerEvents={fencing ? 'none' : undefined}
                role={fencing ? undefined : 'button'}
                tabIndex={fencing ? -1 : 0}
                aria-label={fencing ? undefined : tileLabel(x, y)}
                onClick={fencing ? undefined : () => onTile(x, y)}
                onKeyDown={fencing ? undefined : (e) => onKeyActivate(e, () => onTile(x, y))}
              />
            );
          })}
      </g>

      <BaseCritters state={state} animate={animate} project={project} />

      {/* Cast shadows: one soft, blurred layer under everything that stands up. */}
      <g filter="url(#base-soft-shadow)" opacity={0.24} pointerEvents="none">
        {castShadows}
      </g>
      {/* In fence mode taps pass through buildings to the edge beneath them. */}
      <g pointerEvents={fencing ? 'none' : 'visiblePainted'}>{sprites.map((sprite) => sprite.node)}</g>
      <BaseLife state={state} animate={animate} />
      {(previewTiles?.size || anchorTile) && (
        <g pointerEvents="none" className={`base-tile-preview is-${previewTone}`}>
          {[...(previewTiles ?? [])].map((key) => {
            const [px, py] = key.split(',').map(Number);
            const pts = [project([px * T, py * T]), project([(px + 1) * T, py * T]), project([(px + 1) * T, (py + 1) * T]), project([px * T, (py + 1) * T])];
            return <polygon key={key} points={pts.map((q) => q.join(',')).join(' ')} className="base-preview-tile" />;
          })}
          {anchorTile &&
            (() => {
              const [ax, ay] = anchorTile.split(',').map(Number);
              const pts = [project([ax * T, ay * T]), project([(ax + 1) * T, ay * T]), project([(ax + 1) * T, (ay + 1) * T]), project([ax * T, (ay + 1) * T])];
              return <polygon points={pts.map((q) => q.join(',')).join(' ')} className="base-preview-anchor" />;
            })()}
        </g>
      )}
      {fencing && hoverEdge && (() => {
        const m = /^([nw]):(-?\d+),(-?\d+)$/.exec(hoverEdge);
        if (!m) return null;
        const ex = Number(m[2]) * T;
        const ey = Number(m[3]) * T;
        const [x1, y1] = project([ex, ey]);
        const [x2, y2] = m[1] === 'n' ? project([ex + T, ey]) : project([ex, ey + T]);
        const erase = !!state.edges?.[hoverEdge];
        const color = erase ? '#ff6b6b' : '#c8f032';
        return (
          <g pointerEvents="none" className="base-edge-preview">
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity={0.35} strokeWidth={9} strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeLinecap="round" />
            <circle cx={x1} cy={y1} r={3.4} fill="#fff" />
            <circle cx={x2} cy={y2} r={3.4} fill="#fff" />
          </g>
        );
      })()}
      {/* Cloud shadows drifting slowly over the land. */}
      <g pointerEvents="none" className="base-cloud-shadows">
        {[0, 1].map((k) => (
          <ellipse key={k} cx={0} cy={by * (0.35 + k * 0.3)} rx={span * 0.2} ry={span * 0.075} fill="url(#base-cloud-shadow)">
            <animateTransform
              attributeName="transform"
              type="translate"
              from={`${-span * 0.75} ${k * 30}`}
              to={`${span * 0.75} ${-60 + k * 30}`}
              dur={`${70 + k * 25}s`}
              begin={`${-k * 40}s`}
              repeatCount="indefinite"
            />
          </ellipse>
        ))}
      </g>


      <g className="base-fireflies" pointerEvents="none">{fireflies}</g>

    </svg>
  );
}
