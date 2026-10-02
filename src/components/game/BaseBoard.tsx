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
import { BaseCritters } from './Critters';
import { GroundDetail, GroundEdges } from './GroundDetail';
import { ISO_ITEMS, IsoItemArt, IsoScaffold, P as isoP } from './IsoArt';

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

/** Low models get a tighter preview frame so they don't look tiny. */
const LOW_ITEMS = new Set(['garden', 'wall']);

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
  if (ISO_ITEMS.has(id)) {
    const s2 = itemSize(id) === 2;
    return (
      <svg
        viewBox={s2 ? '-112 -84 224 190' : LOW_ITEMS.has(id) ? '-54 -24 108 84' : '-56 -84 112 140'}
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
  const SLAB = 46;
  const topY = a * 0.5 - 95; // room for tall buildings at the back
  const bottomY = b * 0.5 + SLAB + 28;
  const viewW = Math.max(span * 1.1, (bottomY - topY) / aspect);
  const viewH = viewW * aspect;
  const centerY = (topY + bottomY) / 2;

  // --- Camera: pinch / wheel to zoom, drag to pan ---------------------------
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const [cam, setCam] = useState({ zoom: 1, cx: 0, cy: centerY });
  const camRef = useRef(cam);
  camRef.current = cam;
  useEffect(() => setCam({ zoom: 1, cx: 0, cy: centerY }), [land, centerY]);

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
      ground.push(
        <rect key={`c${x},${y}`} x={x * T} y={y * T} width={T} height={T} fill="transparent"
          onClick={inert ? undefined : () => onTile(x, y)} />
      );
    }
  }

  // Everything upright, sorted back to front so nearer things overlap.
  type Sprite = { key: string; depth: number; node: ReactNode };
  const sprites: Sprite[] = [];
  const groundItems: ReactNode[] = [];
  for (const item of state.placed) {
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
    if (ISO_ITEMS.has(item.itemId)) {
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
            className={`base-item group ${selectedUid === item.uid ? 'is-selected' : ''} ${inert ? 'is-inert' : ''}`}
            role={inert ? undefined : 'button'}
            tabIndex={inert ? -1 : 0}
            aria-label={labelForItem(item)}
            pointerEvents={inert ? 'none' : undefined}
            onClick={inert ? undefined : () => onItem(item.uid)}
            onKeyDown={inert ? undefined : (e) => onKeyActivate(e, () => onItem(item.uid))}>
            <polygon points={foot} fill="transparent" />
            <g className="base-item-art transition-transform duration-200 ease-out group-hover:-translate-y-1">
              {construction && item.level === 0 ? null : (
                <g className="base-pop">
                  <IsoItemArt item={item} ox={ox} oy={oy} lit={lit} plan={plan} />
                </g>
              )}
            </g>
            {construction && (
              <IsoScaffold ox={ox} oy={oy} size={size} setsRemaining={construction.setsRemaining} height={item.itemId === 'wall' || item.itemId === 'garden' ? 34 : undefined} />
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
            {!(building && item.level === 0) && (
              <g className="base-item-art transition-transform duration-200 ease-out group-hover:-translate-y-1">
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
            <IsoScaffold ox={item.x * T} oy={item.y * T} size={size} setsRemaining={construction.setsRemaining} height={44} />
          )}
        </g>
      )
    });
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

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) moved.current = false;
    beginGesture();
    if (pointers.current.size === 1 && painting) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      lastPainted.current = null;
      paintAt(event.clientX, event.clientY);
    }
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
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
    if (painting) {
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
    pointers.current.delete(event.pointerId);
    lastPainted.current = null;
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
        <pattern id="base-scaffold-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="16" className="base-scaffold-line" strokeWidth="3" />
        </pattern>
      </defs>
      <ArtDefs />

      {/* The block of land: soft shadow, then its dirt sides. */}
      {(() => {
        const [lx, ly] = project([a, b]);
        const [bx, by] = project([b, b]);
        const [rx, ry] = project([b, a]);
        const strata = [0.35, 0.65];
        return (
          <g pointerEvents="visiblePainted">
            <ellipse pointerEvents="none" cx={bx} cy={by + SLAB + 6} rx={span * 0.55} ry={span * 0.09} fill="url(#base-slab-shadow)" />
            <polygon points={`${lx},${ly} ${bx},${by} ${bx},${by + SLAB} ${lx},${ly + SLAB}`} fill="url(#base-slab-left)" />
            <polygon points={`${bx},${by} ${rx},${ry} ${rx},${ry + SLAB} ${bx},${by + SLAB}`} fill="url(#base-slab-right)" />
            {strata.map((t) => (
              <g key={t} stroke="#2a1a0e" strokeOpacity={0.35} strokeWidth={1.2} fill="none">
                <line x1={lx} y1={ly + SLAB * t} x2={bx} y2={by + SLAB * t} />
                <line x1={bx} y1={by + SLAB * t} x2={rx} y2={ry + SLAB * t} />
              </g>
            ))}
            {/* A grassy lip where the turf hangs over the dirt. */}
            <polygon points={`${lx},${ly} ${bx},${by} ${rx},${ry} ${rx},${ry + 7} ${bx},${by + 7} ${lx},${ly + 7}`} fill="#2f6a39" />
            <line x1={bx} y1={by} x2={bx} y2={by + SLAB} stroke="#000" strokeOpacity={0.25} strokeWidth={1.5} />
          </g>
        );
      })()}

      {/* The ground, in world units, tilted into diamonds. */}
      <g ref={groundRef} transform={ISO} pointerEvents="visiblePainted">
        {ground}
        <GroundEdges state={state} />
        <rect x={a} y={a} width={span} height={span} fill="url(#base-land-light)" pointerEvents="none" />
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

      {/* Upright grass, flowers, pebbles and reeds give the ground dimension. */}
      <GroundDetail state={state} project={project} />

      <BaseCritters state={state} animate={animate} project={project} />

      <g pointerEvents="visiblePainted">{sprites.map((sprite) => sprite.node)}</g>


      <g className="base-fireflies" pointerEvents="none">{fireflies}</g>

    </svg>
  );
}
