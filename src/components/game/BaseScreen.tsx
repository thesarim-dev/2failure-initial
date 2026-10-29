import { ResourceIcon } from './ResourceIcon';
import { MATERIAL_PER_SET } from '../../game/goals';
import { GoalsCard } from './GoalsCard';
import { computeGoals, type Goal } from '../../game/goals';
import { itemSize,
  hqLevel
} from '../../game/engine';
import { startAmbient, stopAmbient } from '../../lib/ambient';
import { createPortal } from 'react-dom';
import { CoinsBadge } from '../CoinsBadge';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Brush,
  Check,
  Coins,
  Expand,
  Hammer,
  HardHat,
  Lock,
  Move as MoveIcon,
  Palette,
  ShieldCheck,
  X,
  BoxSelect,
  PaintBucket,
  Paintbrush,
  RotateCw,
  Users
} from 'lucide-react';
import { getVariantById } from '../moves';
import { localizeVariant } from '../../i18n/localize';
import { useLanguage } from '../../context/LanguageContext';
import { fx } from '../../lib/feedback';
import {
  BASE_LEVEL_TITLES,
  CUSTOMIZE,
  DECOR,
  DECOR_GROUPS,
  TERRAIN,
  type DecorGroup,
  type TerrainId,
  DECOR_BUILD_SETS,
  GRID_SIZE,
  LAND_SIDES,
  PALETTE,
  PALETTE_IDS,
  buildersForLevel,
  customizeKey,
  type Customization,
  HQ_WEEKS_REQUIRED,
  MAX_HQ_LEVEL,
  RESOURCE_IDS,
  STRUCTURES,
  TROPHIES,
  TROPHY_ITEM_PREFIX,
  getItemDef,
  type Cost,
  type ResourceId,
  type Resources,
  EDGE_COST,
  EDGE_KINDS,
  isTileBuildable,
  seasonState,
  type EdgeKind
} from '../../game/catalog';
import {
  WEEKLY_BONUS_AMOUNT,
  baseLevel,
  busyBuilders,
  terrainUnlocked,
  canPlaceAt,
  jobFor,
  nextLandCost,
  totalBuilders,
  trophyBlocker,
  upgradeCoinCost,
  currentWeeklyStreak,
  forgeRate,
  isQuietToday,
  placeBlocker,
  questSlots,
  sessionBonusAmount,
  shieldCapacity,
  structureLevel,
  trainingDaysThisWeek,
  upgradeBlocker,
  type ActionError,
  type PlacedItem,
  type Quest,
  type TodayPlan
} from '../../game/engine';
import type { BaseGame } from '../../game/useBaseGame';
import { BaseBoard, ItemPreview } from './BaseBoard';

type Draft = { kind: 'item'; itemId: string } | { kind: 'trophy'; trophyId: string };

type Mode =
  | { kind: 'idle' }
  | { kind: 'place'; itemId: string; custom: Customization; spot?: Spot }
  | { kind: 'placeTrophy'; trophyId: string; custom: Customization; spot?: Spot }
  | { kind: 'move'; uid: string; spot?: Spot };
/** A picked (not yet confirmed) spot for the building being placed or moved. */
type Spot = { x: number; y: number };

type SheetState = null | 'build' | 'land' | { uid: string } | { draft: Draft };

/** Swatch colours for the terrain picker. */
const TERRAIN_SWATCH: Record<TerrainId, string> = {
  grass: '#2f6a42',
  meadow: '#3d7a46',
  dirt: '#6b4a2e',
  path: '#b9a68a',
  sand: '#c9a86a',
  plaza: '#7f8a99',
  water: '#1f6f9c',
  snow: '#dfe8f1'
};

/** What reaching a base level unlocks: decorations and ground types. */

// The material icons live in ./ResourceIcon (shared with the home HUD).
export { ResourceIcon } from './ResourceIcon';

function CostList({ cost, resources }: { cost: Cost; resources: Resources }) {
  const { t } = useLanguage();
  const parts = RESOURCE_IDS.filter((id) => (cost[id] ?? 0) > 0);
  return (
    <span className="base-cost">
      {parts.map((id) => {
        const short = resources[id] < (cost[id] ?? 0);
        return (
          <span key={id} className={`base-cost-chip ${short ? 'is-short' : ''}`}>
            <ResourceIcon id={id} size={14} />
            <span className="tabular-nums">{cost[id]}</span>
            <span className="sr-only">{t.game.resources[id]}</span>
          </span>
        );
      })}
    </span>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useLanguage();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Rendered at the top of the page (a portal), so it's always centred on the
  // screen and never trapped inside an animating or scrolled container.
  return createPortal(
    <div className="base-sheet-root">
      <div className="base-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="base-sheet cyber-panel normal-case" role="dialog" aria-modal="true" aria-label={title}>
        <div className="base-sheet-head">
          <h2 className="base-sheet-title">{title}</h2>
          <button ref={closeRef} type="button" className="base-icon-btn" onClick={onClose} aria-label={t.game.close}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="base-sheet-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function useExerciseName() {
  const { t } = useLanguage();
  return (id?: string) => {
    const variant = id ? getVariantById(id) : undefined;
    return variant ? localizeVariant(variant, t.moves).name : id ?? '';
  };
}

export function useQuestText() {
  const { t } = useLanguage();
  const nameOf = useExerciseName();
  return (quest: Quest) => {
    const q = t.game.quests;
    switch (quest.kind) {
      case 'finishExercise':
        return q.finishExercise(nameOf(quest.exerciseId), quest.target);
      case 'inRange':
        return q.inRange(nameOf(quest.exerciseId), quest.min ?? 0, quest.max ?? 0);
      case 'patternSets':
        return q.patternSets(quest.target, t.game.patterns[quest.pattern ?? 'push']);
      case 'stretch':
        return q.stretch(quest.target);
    }
  };
}

function TodayPanel({ game, plan }: { game: BaseGame; plan: TodayPlan | null }) {
  const { t } = useLanguage();
  const g = t.game;
  const { state } = game;
  const questText = useQuestText();
  const planned = plan?.exercises.reduce((n, e) => n + e.target, 0) ?? 0;
  const done = plan?.exercises.reduce((n, e) => n + Math.min(e.done, e.target), 0) ?? 0;
  const sessionDone = !!plan && state.stats.sessionDay === plan.day;
  const weekDone = trainingDaysThisWeek(state);
  const weekTarget = plan?.weeklyTarget ?? 0;
  const weekHit = weekTarget > 0 && weekDone >= weekTarget;
  const weeklyStreak = currentWeeklyStreak(state);
  const quests = plan && state.quests?.day === plan.day ? state.quests.list : [];

  return (
    <section className="base-today cyber-panel normal-case" aria-label={g.today.title}>
      <div className="base-today-head">
        <h2 className="base-today-title">{g.today.title}</h2>
      </div>

      {plan?.isRestDay ? (
        <p className="base-today-line">{g.today.rest}</p>
      ) : (
        planned > 0 && (
          <>
            <p className="base-today-line">{g.today.training(done, planned)}</p>
            <div className="base-progress" role="progressbar" aria-valuemin={0} aria-valuemax={planned} aria-valuenow={done}>
              <span style={{ width: `${Math.round((done / planned) * 100)}%` }} />
            </div>
            <p className="base-today-sub">
              {sessionDone ? g.today.sessionDone : g.today.sessionBonus(sessionBonusAmount(state, false))}
            </p>
          </>
        )
      )}

      {weekTarget > 0 && (
        <p className="base-today-line">
          {g.today.week(Math.min(weekDone, weekTarget), weekTarget)}
          <span className="base-today-sub">
            {' · '}
            {weekHit ? g.today.weeklyDone : g.today.weeklyBonus(WEEKLY_BONUS_AMOUNT)}
          </span>
          {weeklyStreak > 0 && <span className="base-today-streak">{g.today.weeklyStreak(weeklyStreak)}</span>}
        </p>
      )}

      <div className="base-quests">
        <h3 className="base-quests-title">{g.quests.title}</h3>
        {quests.length ? (
          <ul className="base-quest-list">
            {quests.map((quest) => (
              <li key={quest.id} className={`base-quest ${quest.done ? 'is-done' : ''}`}>
                <span className="base-quest-check" aria-hidden="true">
                  {quest.done && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="base-quest-text">
                  {questText(quest)}
                  {quest.done ? (
                    <span className="sr-only"> · {g.quests.done}</span>
                  ) : (
                    quest.target > 1 && (
                      <span className="base-quest-progress tabular-nums">
                        {' '}
                        {Math.min(quest.progress, quest.target)}/{quest.target}
                      </span>
                    )
                  )}
                </span>
                <CostList cost={quest.reward} resources={{ stone: 1e9, timber: 1e9, crystal: 1e9 }} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="base-today-sub">{g.quests.none}</p>
        )}
        {questSlots(state) < 4 && !plan?.isRestDay && <p className="base-today-sub">{g.quests.moreSlots}</p>}
      </div>
    </section>
  );
}

/** Style chips and colour swatches, with a live preview. */
function CustomizePanel({
  itemId,
  trophyId,
  level = 1,
  value,
  onChange
}: {
  itemId?: string;
  trophyId?: string;
  level?: number;
  value: Customization;
  onChange: (next: Customization) => void;
}) {
  const { t } = useLanguage();
  const g = t.game;
  const options = CUSTOMIZE[customizeKey(trophyId ? `${TROPHY_ITEM_PREFIX}${trophyId}` : itemId ?? '')] ?? {};
  return (
    <div className="base-customize">
      <div className="base-customize-preview">
        <ItemPreview itemId={itemId} trophyId={trophyId} level={level} style={value.style} color={value.color} size={112} />
      </div>
      {options.styles && (
        <div className="base-customize-group" role="radiogroup" aria-label={g.customize.style}>
          <span className="base-customize-label">{g.customize.style}</span>
          <div className="base-chip-row">
            {options.styles.map((style) => (
              <button
                key={style}
                type="button"
                role="radio"
                aria-checked={(value.style ?? options.styles?.[0]) === style}
                className={`base-chip ${(value.style ?? options.styles?.[0]) === style ? 'is-active' : ''}`}
                onClick={() => onChange({ ...value, style })}>
                {g.styleNames[style] ?? style}
              </button>
            ))}
          </div>
        </div>
      )}
      {options.colors && (
        <div className="base-customize-group" role="radiogroup" aria-label={g.customize.color}>
          <span className="base-customize-label">{g.customize.color}</span>
          <div className="base-swatch-row">
            <button
              type="button"
              role="radio"
              aria-checked={!value.color}
              aria-label={g.customize.auto}
              title={g.customize.auto}
              className={`base-swatch base-swatch--auto ${!value.color ? 'is-active' : ''}`}
              onClick={() => onChange({ ...value, color: undefined })}
            />
            {PALETTE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={value.color === id}
                aria-label={g.colorNames[id]}
                title={g.colorNames[id]}
                className={`base-swatch ${value.color === id ? 'is-active' : ''}`}
                style={{ background: PALETTE[id] }}
                onClick={() => onChange({ ...value, color: id })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function hasCustomization(itemId: string): boolean {
  const options = CUSTOMIZE[customizeKey(itemId)];
  return !!(options?.styles?.length || options?.colors);
}

export function BaseScreen({
  game,
  coins,
  onSpendCoins,
  onOpenFriends
}: {
  game: BaseGame;
  /** The workout currency, used for land and upgrades. */
  coins: number;
  onSpendCoins: (amount: number) => void;
  /** Friends: visit bases, cheer, the squad challenge. */
  onOpenFriends?: () => void;
}) {
  const { t, language } = useLanguage();
  const g = t.game;
  const { state } = game;
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [sheet, setSheet] = useState<SheetState>(null);
  const [buildTab, setBuildTab] = useState<'structures' | 'decor' | 'trophies'>('structures');
  const [draftCustom, setDraftCustom] = useState<Customization>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [paintWith, setPaintWith] = useState<TerrainId | null>(null);
  const [fenceKind, setFenceKind] = useState<EdgeKind | null>(null);
  const [paintTool, setPaintTool] = useState<'brush' | 'box' | 'fill'>('box');
  const [boxAnchor, setBoxAnchor] = useState<[number, number] | null>(null);
  const [paintHover, setPaintHover] = useState<[number, number] | null>(null);
  const lastPaintSound = useRef(0);
  const [decorGroup, setDecorGroup] = useState<DecorGroup | 'all'>('all');
  const levelInfo = baseLevel(state);
  const lastLevel = useRef(levelInfo.level);

  // Celebrate base level ups.
  useEffect(() => {
    if (levelInfo.level > lastLevel.current) {
      fx.levelUp();
      setNotice(g.baseLevel.levelUp(g.baseLevel.titles[levelInfo.title]));
    }
    lastLevel.current = levelInfo.level;
  }, [levelInfo.level, levelInfo.title, g.baseLevel]);
  const lit = !isQuietToday(state);
  const earnedCount = Object.keys(state.trophies).length;

  useEffect(() => {
    game.markSeen();
    // Only on open: anything new is now on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(id);
  }, [notice]);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(language, { dateStyle: 'medium' }),
    [language]
  );

  const nameOf = (itemId: string) => {
    if (itemId.startsWith(TROPHY_ITEM_PREFIX)) {
      return g.trophyNames[itemId.slice(TROPHY_ITEM_PREFIX.length)]?.name ?? '';
    }
    return g.items[itemId]?.name ?? itemId;
  };

  const errorText = (error: ActionError, itemId?: string) => {
    const def = itemId ? getItemDef(itemId) : undefined;
    if (error === 'outOfSeason' && def?.kind === 'decor' && def.season) return g.season.back(def.season, seasonState(def.season).days);
    // The HQ's next level: exactly how many more weeks on plan it needs.
    if (error === 'needsWeeks') {
      const needed = (HQ_WEEKS_REQUIRED[hqLevel(state) + 1] ?? 0) - state.stats.weeksOnTarget;
      if (needed > 0) return g.errors.needsWeeksN(needed);
    }
    if (error === 'locked' && def) return g.errors.unlockAt(def.unlockHq);
    if (error === 'needsBaseLevel' && def?.kind === 'decor' && def.unlockBase) {
      return `${g.baseLevel.level(def.unlockBase)} · ${g.baseLevel.titles[BASE_LEVEL_TITLES[def.unlockBase - 1]]}`;
    }
    if (error === 'blocked' && def?.kind === 'decor' && def.onWater) return g.errors.water;
    // Not enough materials: name the biggest shortfall and how many sets earn it.
    if (error === 'cantAfford' && def) {
      const cost = ('levels' in def ? def.levels[0]?.cost : (def as { cost?: Cost }).cost) ?? {};
      let worst: { id: ResourceId; missing: number } | null = null;
      for (const id of RESOURCE_IDS) {
        const missing = (cost[id] ?? 0) - (state.resources[id] ?? 0);
        if (missing > 0 && (!worst || missing > worst.missing)) worst = { id, missing };
      }
      if (worst) return g.needMore(worst.missing, g.resources[worst.id], Math.ceil(worst.missing / MATERIAL_PER_SET), worst.id);
    }
    return g.errors[error];
  };

  const modeItemId =
    mode.kind === 'place'
      ? mode.itemId
      : mode.kind === 'placeTrophy'
        ? `${TROPHY_ITEM_PREFIX}${mode.trophyId}`
        : mode.kind === 'move'
          ? state.placed.find((p) => p.uid === mode.uid)?.itemId ?? null
          : null;

  // ---- Placement preview: the picked spot's footprint and a see-through building ----
  const spot = mode.kind !== 'idle' ? mode.spot ?? null : null;
  const footprint = useMemo(() => {
    if (!spot || !modeItemId) return null;
    const n = itemSize(modeItemId);
    const set = new Set<string>();
    for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) set.add(`${spot.x + dx},${spot.y + dy}`);
    return set;
  }, [spot, modeItemId]);
  const movingItem = mode.kind === 'move' ? state.placed.find((p) => p.uid === mode.uid) : undefined;
  const ghost =
    spot && modeItemId
      ? {
          itemId: modeItemId,
          x: spot.x,
          y: spot.y,
          custom: mode.kind === 'place' || mode.kind === 'placeTrophy' ? mode.custom : undefined,
          level: movingItem?.level ?? 1,
          replaceUid: movingItem?.uid
        }
      : null;

  const validTiles = useMemo(() => {
    if (fenceKind) {
      // Show every tile so the edges between them are easy to see.
      const all = new Set<string>();
      for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) if (isTileBuildable(x, y, state.landLevel)) all.add(`${x},${y}`);
      return all;
    }
    if (!modeItemId) return null;
    const ignore = mode.kind === 'move' ? mode.uid : undefined;
    const set = new Set<string>();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlaceAt(state, modeItemId, x, y, ignore)) set.add(`${x},${y}`);
      }
    }
    return set;
  }, [mode, modeItemId, state, fenceKind]);

  const handleTile = (x: number, y: number) => {
    if (mode.kind === 'idle') {
      setSheet(null);
      return;
    }
    // Tapping a tile picks a spot and shows a see-through preview there; nothing
    // is built (or paid) until Place here is tapped. Tap another tile to try it there.
    if (validTiles && !validTiles.has(`${x},${y}`)) {
      fx.error();
      return;
    }
    fx.tick();
    setMode({ ...mode, spot: { x, y } });
  };
  /** One tap from a goal to the thing that completes it. */
  const handleGoal = (goal: Goal) => {
    fx.tap();
    if (goal.kind === 'upgrade') {
      setSheet({ uid: goal.uid });
    } else if (goal.kind === 'build') {
      if (goal.ready) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        choose({ kind: 'item', itemId: goal.itemId });
      } else {
        setBuildTab('structures');
        setSheet('build');
      }
    } else if (goal.kind === 'level') {
      setBuildTab('decor');
      setSheet('build');
    } else if (goal.kind === 'land') {
      setSheet('land');
    }
  };

  /** Dragging the ghost: move the picked spot wherever it fits. */
  const dragGhost = (x: number, y: number) => {
    if (mode.kind === 'idle' || !modeItemId) return;
    if (mode.spot && mode.spot.x === x && mode.spot.y === y) return;
    const ignore = mode.kind === 'move' ? mode.uid : undefined;
    if (!canPlaceAt(state, modeItemId, x, y, ignore)) return;
    setMode({ ...mode, spot: { x, y } });
  };

  /** Rotate what's being placed (or moved) before confirming. */
  const rotateDraft = () => {
    fx.tap();
    if (mode.kind === 'place' || mode.kind === 'placeTrophy') {
      setMode({ ...mode, custom: { ...mode.custom, flip: !mode.custom.flip } });
    } else if (mode.kind === 'move') {
      game.flip(mode.uid);
    }
  };

  const confirmSpot = () => {
    if (mode.kind === 'idle' || !mode.spot) return;
    const { x, y } = mode.spot;
    const result =
      mode.kind === 'place'
        ? game.place(mode.itemId, x, y, mode.custom)
        : mode.kind === 'placeTrophy'
          ? game.placeTrophy(mode.trophyId, x, y, mode.custom)
          : game.move(mode.uid, x, y);
    if (!result.ok) {
      fx.error();
      setNotice(errorText(result.error, modeItemId ?? undefined));
      return;
    }
    fx.place();
    setMode({ kind: 'idle' });
  };

  /** Pick something in the build menu: customize first if it has options. */
  const choose = (draft: Draft) => {
    const itemId = draft.kind === 'item' ? draft.itemId : `${TROPHY_ITEM_PREFIX}${draft.trophyId}`;
    setDraftCustom({});
    // Paths are painted like terrain; walls run along the edges between tiles.
    if (itemId === 'path') {
      setSheet(null);
      setFenceKind(null);
      setPaintWith('path');
      return;
    }
    if (itemId === 'wall') {
      setSheet(null);
      setPaintWith(null);
      setFenceKind('wall');
      return;
    }
    if (hasCustomization(itemId)) {
      setSheet({ draft });
      return;
    }
    setSheet(null);
    setMode(draft.kind === 'item' ? { kind: 'place', itemId: draft.itemId, custom: {} } : { kind: 'placeTrophy', trophyId: draft.trophyId, custom: {} });
  };

  const selected = sheet && typeof sheet === 'object' && 'uid' in sheet ? state.placed.find((p) => p.uid === sheet.uid) : undefined;
  const draft = sheet && typeof sheet === 'object' && 'draft' in sheet ? sheet.draft : null;
  const busy = busyBuilders(state);
  const total = totalBuilders(state);
  const jobsText = state.constructions
    .map((job) => {
      const item = state.placed.find((p) => p.uid === job.uid);
      return item ? `${nameOf(item.itemId)}: ${g.setsLeft(job.setsRemaining)}` : null;
    })
    .filter(Boolean)
    .join(' · ');
  const landSide = LAND_SIDES[state.landLevel];
  const landCost = nextLandCost(state);
  const goals = useMemo(() => computeGoals(state, coins), [state, coins]);

  // ---- Paint tools: box (two corners) and fill (a connected patch) ----
  const terrainAt = (x: number, y: number) => state.terrain?.[`${x},${y}`] ?? 'grass';
  const boxTiles = (a: [number, number], b: [number, number]) => {
    const out: Array<[number, number]> = [];
    for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
      for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) if (isTileBuildable(x, y, state.landLevel)) out.push([x, y]);
    return out;
  };
  const fillTiles = (start: [number, number]) => {
    const target = terrainAt(start[0], start[1]);
    const seen = new Set([`${start[0]},${start[1]}`]);
    const out: Array<[number, number]> = [];
    const queue: Array<[number, number]> = [start];
    while (queue.length && out.length < 600) {
      const [x, y] = queue.shift()!;
      out.push([x, y]);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as Array<[number, number]>) {
        const k = `${nx},${ny}`;
        if (seen.has(k) || !isTileBuildable(nx, ny, state.landLevel) || terrainAt(nx, ny) !== target) continue;
        seen.add(k);
        queue.push([nx, ny]);
      }
    }
    return out;
  };
  const paintPreview = useMemo(() => {
    if (!paintWith || paintTool === 'brush') return null;
    const tiles = paintTool === 'box' ? (boxAnchor ? boxTiles(boxAnchor, paintHover ?? boxAnchor) : []) : paintHover ? fillTiles(paintHover) : [];
    return new Set(tiles.map(([x, y]) => `${x},${y}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintWith, paintTool, boxAnchor, paintHover, state.terrain, state.landLevel]);
  const onPaintTap = (tile: [number, number]) => {
    if (!paintWith) return;
    if (paintTool === 'box' && !boxAnchor) {
      setBoxAnchor(tile);
      fx.tick();
      return;
    }
    const tiles = paintTool === 'box' ? boxTiles(boxAnchor!, tile) : fillTiles(tile);
    setBoxAnchor(null);
    const result = game.paint(tiles, paintWith);
    if (result.ok) fx.place();
  };
  useEffect(() => {
    setBoxAnchor(null);
    setPaintHover(null);
  }, [paintWith, paintTool]);

  // Ambient soundscape while the Base is open: a breeze and birdsong, plus
  // water and fire when the base has them. Paused in the background.
  const hasWater = Object.values(state.terrain ?? {}).includes('water');
  const hasFire = state.placed.some((p) => ['campfire', 'torch', 'forge'].includes(p.itemId) && p.level > 0);
  useEffect(() => {
    startAmbient({ water: hasWater, fire: hasFire });
    const onVisibility = () => (document.hidden ? stopAmbient() : startAmbient({ water: hasWater, fire: hasFire }));
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopAmbient();
    };
  }, [hasWater, hasFire]);
  const levelProgress =
    levelInfo.next === null ? 1 : Math.min(1, (levelInfo.score - levelInfo.floor) / Math.max(1, levelInfo.next - levelInfo.floor));

  const labelForItem = (item: PlacedItem) => {
    const def = getItemDef(item.itemId);
    const name = nameOf(item.itemId);
    return def?.kind === 'structure' ? `${name}, ${g.level(Math.max(item.level, 1))}` : name;
  };

  return (
    <div className="base-screen">
      <header className="base-header">
        <h1 className="base-title">{state.baseName ?? g.title}</h1>
        <div className="base-header-chips">
          {onOpenFriends && (
            <button type="button" className="base-friends-btn" onClick={onOpenFriends} aria-label={t.social.open}>
              <Users size={16} strokeWidth={2.6} aria-hidden="true" />
              {t.social.open}
            </button>
          )}
          {/* Same coins badge as the Train tab. */}
          <CoinsBadge coins={coins} />
        </div>
      </header>

      <div className="base-resources" role="list">
        {RESOURCE_IDS.map((id) => (
          <div key={id} role="listitem" className="base-resource" title={g.resourceSource[id]}>
            <ResourceIcon id={id} size={24} />
            <span className="base-resource-count tabular-nums">{state.resources[id]}</span>
            <span className="base-resource-label">{g.resources[id]}</span>
          </div>
        ))}
      </div>

      {!state.introSeen && (
        <section className="base-intro-strip normal-case">
          <p>{g.intro.body}</p>
          <button type="button" className="base-intro-ok" onClick={game.dismissIntro}>
            {g.intro.ok}
          </button>
        </section>
      )}



      {mode.kind !== 'idle' && modeItemId && (
        <div className="base-mode-bar" role="status">
          <span>
            {spot ? g.placeConfirm : mode.kind === 'move' ? g.moveHint(nameOf(modeItemId)) : g.placeHint(nameOf(modeItemId))}
          </span>
          <div className="base-mode-actions">
            <button type="button" className="base-ghost-btn" onClick={() => setMode({ kind: 'idle' })}>
              {g.cancel}
            </button>
            {spot && (
              <button type="button" className="base-ghost-btn base-rotate-btn" onClick={rotateDraft} aria-label={g.flip}>
                <RotateCw size={16} strokeWidth={2.6} aria-hidden="true" />
                {g.flip}
              </button>
            )}
            {spot && (
              <button type="button" className="base-primary-btn base-confirm-btn" data-quest="confirm-place" onClick={confirmSpot}>
                <Check size={16} strokeWidth={3} aria-hidden="true" />
                {mode.kind === 'move' ? g.moveHere : g.placeHere}
              </button>
            )}
          </div>
        </div>
      )}

      {paintWith && (
        <div className="base-paint-bar" role="toolbar" aria-label={g.paint.title}>
          <div className="base-paint-tools" role="radiogroup" aria-label={g.paint.title}>
            {(['box', 'fill', 'brush'] as const).map((tool) => {
              const Icon = tool === 'box' ? BoxSelect : tool === 'fill' ? PaintBucket : Paintbrush;
              return (
                <button key={tool} type="button" role="radio" aria-checked={paintTool === tool} className={`base-paint-tool ${paintTool === tool ? 'is-active' : ''}`} onClick={() => setPaintTool(tool)}>
                  <Icon size={16} strokeWidth={2.4} aria-hidden="true" />
                  {g.tools[tool]}
                </button>
              );
            })}
          </div>
          <div className="base-paint-head">
            <span>{paintTool === 'box' ? (boxAnchor ? g.tools.boxSecond : g.tools.boxHint) : paintTool === 'fill' ? g.tools.fillHint : g.tools.brushHint}</span>
            <button type="button" className="base-ghost-btn" onClick={() => setPaintWith(null)}>
              {g.paint.done}
            </button>
          </div>
          <div className="base-paint-swatches" role="radiogroup" aria-label={g.paint.title}>
            {TERRAIN.map(({ id, unlockBase }) => {
              const open = terrainUnlocked(state, id);
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={paintWith === id}
                  disabled={!open}
                  className={`base-paint-swatch ${paintWith === id ? 'is-active' : ''}`}
                  onClick={() => setPaintWith(id)}>
                  <span className="base-paint-chip" style={{ background: TERRAIN_SWATCH[id] }}>
                    {!open && <Lock size={12} strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className="base-paint-label">{open ? g.terrainNames[id] : g.paint.locked(unlockBase)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fenceKind && (
        <div className="base-paint-bar" role="toolbar" aria-label={g.fences.title}>
          <div className="base-paint-head">
            <span>{g.fences.hint}</span>
            <button type="button" className="base-ghost-btn" onClick={() => setFenceKind(null)}>
              {g.fences.done}
            </button>
          </div>
          <div className="base-paint-swatches" role="radiogroup" aria-label={g.fences.title}>
            {EDGE_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={fenceKind === kind}
                className={`base-paint-swatch ${fenceKind === kind ? 'is-active' : ''}`}
                onClick={() => setFenceKind(kind)}>
                <span className={`base-fence-chip is-${kind}`} aria-hidden="true" />
                <span className="base-paint-label">{g.fences.kinds[kind]}</span>
                <CostList cost={EDGE_COST[kind]} resources={state.resources} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="base-board-wrap" dir="ltr">
        <BaseBoard
          state={state}
          plan={game.plan}
          lit={lit}
          selectedUid={selected?.uid ?? null}
          validTiles={validTiles}
          labelForItem={labelForItem}
          tileLabel={(x, y) => `${modeItemId ? nameOf(modeItemId) : ''} ${x + 1},${y + 1}`}
          onTile={handleTile}
          onItem={(uid) => setSheet({ uid })}
          onItemLongPress={(uid) => {
            const item = state.placed.find((p) => p.uid === uid);
            if (!item) return;
            fx.tap();
            setSheet(null);
            setMode({ kind: 'move', uid, spot: { x: item.x, y: item.y } });
          }}
          painting={paintWith !== null}
          paintTool={paintTool}
          onPaintTap={onPaintTap}
          onPaintHover={setPaintHover}
          previewTiles={paintPreview ?? footprint}
          previewTone={paintPreview ? 'paint' : 'place'}
          anchorTile={boxAnchor ? `${boxAnchor[0]},${boxAnchor[1]}` : null}
          ghost={ghost}
          onGhostDrag={dragGhost}
          fencing={fenceKind !== null}
          onEdge={(edgeKey, strokeMode) => {
            if (!fenceKind) return;
            const result = game.setEdge(edgeKey, strokeMode === 'add' ? fenceKind : null);
            if (result.ok) fx.tick();
            else if (result.error === 'cantAfford') setNotice(errorText(result.error));
          }}
          onPaint={(tile) => {
            if (!paintWith) return;
            const result = game.paint([tile], paintWith);
            // A light tick per painted tile, throttled so drags don't buzz.
            const now = performance.now();
            if (result.ok && now - lastPaintSound.current > 90) {
              lastPaintSound.current = now;
              fx.tick();
            }
          }}
          svgId="base-map-svg"
        />
        {notice && (
          <p className="base-notice" role="status">
            {notice}
          </p>
        )}

        {/* Game-style controls floating on the map */}
        <div className="map-level" aria-label={`${g.baseLevel.level(levelInfo.level)} · ${g.baseLevel.titles[levelInfo.title]}`}>
          <span
            className="map-level-ring"
            style={{
              background: `conic-gradient(#f7c948 ${levelProgress * 360}deg, rgba(255,255,255,0.18) 0deg)`
            }}>
            <span className="map-level-num">{levelInfo.level}</span>
          </span>
          <span className="map-level-title">{g.baseLevel.titles[levelInfo.title]}</span>
        </div>
        <button
          type="button"
          className={`map-builders ${busy > 0 ? 'is-busy' : ''}`}
          aria-label={`${g.builders.chip(total - busy, total)}${jobsText ? ` · ${jobsText}` : ''}`}
          onClick={() => {
            if (jobsText) setNotice(jobsText);
          }}>
          <HardHat size={16} strokeWidth={2.6} aria-hidden="true" />
          <span className="tabular-nums">
            {total - busy}/{total}
          </span>
        </button>
        {mode.kind === 'idle' && !paintWith && !fenceKind && (
          <div className="map-dock">
            <button type="button" className="map-round-btn" onClick={() => setSheet('land')} aria-label={g.land.button}>
              <Expand size={20} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <button type="button" className="map-build-btn" onClick={() => setSheet('build')}>
              <Hammer size={20} strokeWidth={2.6} aria-hidden="true" />
              {g.build}
            </button>
            <button type="button" className="map-round-btn" onClick={() => setPaintWith('dirt')} aria-label={g.paint.button}>
              <Brush size={20} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {mode.kind === 'idle' && !paintWith && !fenceKind && (
        <GoalsCard
          goals={goals}
          coins={coins}
          totalBuilders={total}
          nameOf={nameOf}
          titleOf={(title) => g.baseLevel.titles[title as keyof typeof g.baseLevel.titles] ?? title}
          onAction={handleGoal}
        />
      )}

      <TodayPanel game={game} plan={game.plan} />

      {sheet === 'build' && (
        <Sheet title={g.build} onClose={() => setSheet(null)}>
          <div className="base-tabs" role="tablist">
            {(['structures', 'decor', 'trophies'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={buildTab === tab}
                className={`base-tab ${buildTab === tab ? 'is-active' : ''}`}
                onClick={() => setBuildTab(tab)}>
                {g.buildTabs[tab]}
                {tab === 'trophies' && <span className="base-tab-count"> {earnedCount}/{TROPHIES.length}</span>}
              </button>
            ))}
          </div>
          <p className="base-sheet-intro">{g.builders.status(busy, total)}</p>
          {buildTab === 'decor' && (
            <div className="base-chip-row" role="radiogroup" aria-label={g.buildTabs.decor}>
              {(['all', ...DECOR_GROUPS] as const).map((group) => (
                <button
                  key={group}
                  type="button"
                  role="radio"
                  aria-checked={decorGroup === group}
                  className={`base-chip ${decorGroup === group ? 'is-active' : ''}`}
                  onClick={() => setDecorGroup(group)}>
                  {group === 'all' ? '★' : g.decorGroups[group]}
                </button>
              ))}
            </div>
          )}
          {buildTab !== 'trophies' ? (
            <ul className="base-catalog">
              {(buildTab === 'structures'
                ? STRUCTURES.filter((s) => s.id !== 'hq')
                : DECOR.filter((d) => decorGroup === 'all' || d.group === decorGroup)
              ).map((def) => {
                const blocker = placeBlocker(state, def.id);
                const cost = def.kind === 'structure' ? def.levels[0].cost : def.cost;
                const sets = def.kind === 'structure' ? def.levels[0].sets : DECOR_BUILD_SETS;
                return (
                  <li key={def.id}>
                    <button
                      type="button"
                      className="base-catalog-item"
                      data-item={def.id}
                      disabled={blocker !== null}
                      onClick={() => choose({ kind: 'item', itemId: def.id })}>
                      <ItemPreview itemId={def.id} />
                      <span className="base-catalog-text">
                        <span className="base-catalog-name">{g.items[def.id]?.name}</span>
                        <span className="base-catalog-desc">{g.items[def.id]?.description}</span>
                        <span className="base-catalog-meta">
                          {state.firstBuildFree && def.kind === 'structure' && blocker === null ? (
                            <span className="base-free-badge">{t.hub.quest.free}</span>
                          ) : (
                            <CostList cost={cost} resources={state.resources} />
                          )}
                          <span className="base-catalog-sets">
                            {g.setsToBuild(sets)} · {g.builders.needs(1)}
                          </span>
                        </span>
                        {!blocker && def.kind === 'decor' && def.season && (
                          <span className="base-catalog-season">{g.season.left(def.season, seasonState(def.season).days)}</span>
                        )}
                        {blocker && <span className="base-catalog-blocker">{errorText(blocker, def.id)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <>
              <p className="base-sheet-intro">{g.trophyShelf.intro}</p>
              <ul className="base-trophy-grid">
                {TROPHIES.map((def) => {
                  const earned = state.trophies[def.id];
                  const copy = g.trophyNames[def.id];
                  const blocker = trophyBlocker(state, def.id);
                  const placed = blocker === 'alreadyPlaced';
                  return (
                    <li key={def.id} className={`base-trophy ${earned ? 'is-earned' : 'is-locked'}`}>
                      <ItemPreview trophyId={def.id} verified={earned?.verified} size={64} />
                      <span className="base-trophy-name">{copy?.name}</span>
                      {earned ? (
                        <>
                          <span className="base-trophy-proof">{copy?.proof(earned.value ?? 0)}</span>
                          <span className="base-trophy-date">
                            {g.trophyShelf.earnedOn(dateFormat.format(new Date(earned.earnedAt)))}
                          </span>
                          {earned.verified && (
                            <span className="base-trophy-verified">
                              <ShieldCheck size={13} strokeWidth={2.5} aria-hidden="true" />
                              {g.trophyShelf.verified}
                            </span>
                          )}
                          {placed ? (
                            <span className="base-trophy-placed">{g.trophyShelf.onBase}</span>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="base-small-btn"
                                disabled={blocker !== null}
                                onClick={() => choose({ kind: 'trophy', trophyId: def.id })}>
                                {g.trophyShelf.place}
                              </button>
                              {blocker && <span className="base-catalog-blocker">{errorText(blocker)}</span>}
                            </>
                          )}
                        </>
                      ) : (
                        <span className="base-trophy-how">{copy?.how}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Sheet>
      )}

      {draft && (
        <Sheet
          title={draft.kind === 'item' ? nameOf(draft.itemId) : g.trophyNames[draft.trophyId]?.name ?? ''}
          onClose={() => setSheet('build')}>
          <CustomizePanel
            itemId={draft.kind === 'item' ? draft.itemId : undefined}
            trophyId={draft.kind === 'trophy' ? draft.trophyId : undefined}
            value={draftCustom}
            onChange={setDraftCustom}
          />
          <button
            type="button"
            className="base-primary-btn"
            data-quest="choose-spot"
            onClick={() => {
              setSheet(null);
              setMode(
                draft.kind === 'item'
                  ? { kind: 'place', itemId: draft.itemId, custom: draftCustom }
                  : { kind: 'placeTrophy', trophyId: draft.trophyId, custom: draftCustom }
              );
            }}>
            {g.customize.place}
          </button>
        </Sheet>
      )}

      {sheet === 'land' && (
        <Sheet title={g.land.title} onClose={() => setSheet(null)}>
          <p className="base-today-line">{g.land.current(landSide)}</p>
          {landCost === null ? (
            <p className="base-item-sub">{g.land.max}</p>
          ) : (
            <div className="base-upgrade">
              <p className="base-today-line">{g.land.next(LAND_SIDES[state.landLevel + 1])}</p>
              <p className="base-today-sub">{g.land.why}</p>
              <p className="base-land-cost">
                <Coins size={16} strokeWidth={2.5} aria-hidden="true" />
                {g.land.cost(landCost)} · {g.land.balance(coins)}
              </p>
              <button
                type="button"
                className="base-primary-btn"
                disabled={coins < landCost}
                onClick={() => {
                  const result = game.expandLand(coins);
                  if (!result.ok) {
                    fx.error();
                    setNotice(errorText(result.error));
                    return;
                  }
                  fx.levelUp();
                  if (result.coinCost) onSpendCoins(result.coinCost);
                  setSheet(null);
                }}>
                {g.land.buy(landCost)}
              </button>
              {coins < landCost && <p className="base-catalog-blocker">{g.errors.needsCoins}</p>}
            </div>
          )}
        </Sheet>
      )}

      {selected && (
        <ItemSheet
          item={selected}
          game={game}
          coins={coins}
          onSpendCoins={onSpendCoins}
          nameOf={nameOf}
          errorText={errorText}
          dateFormat={dateFormat}
          onClose={() => setSheet(null)}
          onMove={() => {
            setSheet(null);
            setMode({ kind: 'move', uid: selected.uid });
          }}
          onNotice={setNotice}
        />
      )}
    </div>
  );
}

function ItemSheet({
  item,
  game,
  coins,
  onSpendCoins,
  nameOf,
  errorText,
  dateFormat,
  onClose,
  onMove,
  onNotice
}: {
  item: PlacedItem;
  game: BaseGame;
  coins: number;
  onSpendCoins: (amount: number) => void;
  nameOf: (itemId: string) => string;
  errorText: (error: ActionError, itemId?: string) => string;
  dateFormat: Intl.DateTimeFormat;
  onClose: () => void;
  onMove: () => void;
  onNotice: (text: string) => void;
}) {
  const { t } = useLanguage();
  const g = t.game;
  const { state } = game;
  const def = getItemDef(item.itemId);
  const isTrophy = item.itemId.startsWith(TROPHY_ITEM_PREFIX);
  const trophyId = isTrophy ? item.itemId.slice(TROPHY_ITEM_PREFIX.length) : null;
  const earned = trophyId ? state.trophies[trophyId] : undefined;
  const building = jobFor(state, item.uid) ?? null;
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState<Customization>({ style: item.style, color: item.color as Customization['color'] });
  const canCustomize = hasCustomization(item.itemId);

  const remove = () => {
    const result = game.remove(item.uid);
    if (!result.ok) onNotice(errorText(result.error));
    onClose();
  };

  return (
    <Sheet title={nameOf(item.itemId)} onClose={onClose}>
      {editing ? (
        <>
          <CustomizePanel
            itemId={trophyId ? undefined : item.itemId}
            trophyId={trophyId ?? undefined}
            level={Math.max(item.level, 1)}
            value={custom}
            onChange={setCustom}
          />
          <button
            type="button"
            className="base-primary-btn"
            onClick={() => {
              game.customize(item.uid, custom);
              fx.confirm();
              setEditing(false);
            }}>
            {g.customize.save}
          </button>
        </>
      ) : (
        <div className="base-item-head">
          {trophyId ? (
            <ItemPreview trophyId={trophyId} verified={earned?.verified} size={72} style={item.style} color={item.color} />
          ) : (
            <ItemPreview itemId={item.itemId} level={Math.max(item.level, 1)} size={72} style={item.style} color={item.color} />
          )}
          <div className="base-item-text">
            {(def?.kind === 'structure' || building) && (
              <p className="base-item-level">
                {building ? g.setsLeft(building.setsRemaining) : g.level(item.level)}
              </p>
            )}
            {trophyId && earned ? (
              <>
                <p>{g.trophyNames[trophyId]?.proof(earned.value ?? 0)}</p>
                <p className="base-item-sub">{g.trophyShelf.earnedOn(dateFormat.format(new Date(earned.earnedAt)))}</p>
                {earned.verified && (
                  <p className="base-trophy-verified">
                    <ShieldCheck size={14} strokeWidth={2.5} aria-hidden="true" />
                    {g.trophyShelf.verified}
                  </p>
                )}
              </>
            ) : (
              <p>{g.items[item.itemId]?.description}</p>
            )}
          </div>
        </div>
      )}

      {!editing && def?.kind === 'structure' && item.level > 0 && (
        <BuildingRole item={item} game={game} onNotice={onNotice} />
      )}

      {!editing && def?.kind === 'structure' && !building && (
        <div className="base-upgrade">
          {item.level >= def.levels.length ? (
            <p className="base-item-sub">{g.maxLevel}</p>
          ) : (
            (() => {
              const target = item.level + 1;
              const blocker = upgradeBlocker(state, item.uid, coins);
              const next = def.levels[item.level];
              const coinCost = upgradeCoinCost(def.id, target);
              return (
                <>
                  <div className="base-catalog-meta">
                    <CostList cost={next.cost} resources={state.resources} />
                    {coinCost > 0 && (
                      <span className={`base-cost-chip ${coins < coinCost ? 'is-short' : ''}`}>
                        <Coins size={13} strokeWidth={2.5} aria-hidden="true" />
                        <span className="tabular-nums">{coinCost}</span>
                        <span className="sr-only">{g.coins(coinCost)}</span>
                      </span>
                    )}
                  </div>
                  <p className="base-catalog-sets">
                    {g.setsToBuild(next.sets)} · {g.builders.needs(buildersForLevel(target))}
                  </p>
                  <button
                    type="button"
                    className="base-primary-btn"
                    disabled={blocker !== null}
                    onClick={() => {
                      const result = game.upgrade(item.uid, coins);
                      if (!result.ok) {
                        fx.error();
                        onNotice(errorText(result.error));
                      } else {
                        fx.place();
                        if (result.coinCost) onSpendCoins(result.coinCost);
                      }
                      onClose();
                    }}>
                    {g.upgradeTo(target)}
                  </button>
                  {blocker && <p className="base-catalog-blocker">{errorText(blocker)}</p>}
                </>
              );
            })()
          )}
        </div>
      )}

      {!editing && (
        <div className="base-item-actions">
          {canCustomize && (
            <button type="button" className="base-secondary-btn" onClick={() => setEditing(true)}>
              <Palette size={16} strokeWidth={2.5} aria-hidden="true" />
              {g.customize.edit}
            </button>
          )}
          <button
            type="button"
            className="base-secondary-btn"
            onClick={() => {
              fx.tap();
              game.flip(item.uid);
            }}>
            <RotateCw size={16} strokeWidth={2.5} aria-hidden="true" />
            {g.flip}
          </button>
          {item.itemId !== 'hq' && (
            <button type="button" className="base-secondary-btn" onClick={onMove}>
              <MoveIcon size={16} strokeWidth={2.5} aria-hidden="true" />
              {g.move}
            </button>
          )}
          {def?.kind === 'decor' && (
            <button type="button" className="base-secondary-btn" onClick={remove}>
              {g.remove} · {g.refund}
            </button>
          )}
          {isTrophy && (
            <button type="button" className="base-secondary-btn" onClick={remove}>
              {g.putAway}
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

function BuildingRole({
  item,
  game,
  onNotice
}: {
  item: PlacedItem;
  game: BaseGame;
  onNotice: (text: string) => void;
}) {
  const { t } = useLanguage();
  const g = t.game;
  const { state, plan } = game;
  const nameOf = useExerciseName();
  const [from, setFrom] = useState<ResourceId>('stone');
  const [to, setTo] = useState<ResourceId>('timber');

  switch (item.itemId) {
    case 'hq': {
      const next = item.level + 1;
      return (
        <p className="base-role">
          {item.level >= MAX_HQ_LEVEL
            ? g.roles.hqMax
            : g.roles.hq(state.stats.weeksOnTarget, HQ_WEEKS_REQUIRED[next] ?? 0, next)}
        </p>
      );
    }
    case 'watchtower':
      return <p className="base-role">{g.roles.watchtower(questSlots(state))}</p>;
    case 'lodge':
      return <p className="base-role">{g.roles.lodge(state.shields, shieldCapacity(state), totalBuilders(state))}</p>;
    case 'spring':
      return <p className="base-role">{g.roles.spring(structureLevel(state, 'spring'))}</p>;
    case 'yard':
      return (
        <div className="base-role">
          <p>{g.roles.yard(sessionBonusAmount(state, false))}</p>
          {plan?.isRestDay ? (
            <p className="base-item-sub">{g.yard.restDay}</p>
          ) : (
            <>
              <h3 className="base-quests-title">{g.yard.stationsTitle}</h3>
              <ul className="base-station-list">
                {(plan?.exercises ?? []).map((e) => (
                  <li key={e.id} className={e.done >= e.target ? 'is-done' : ''}>
                    <span>{nameOf(e.id)}</span>
                    <span className="tabular-nums">
                      {Math.min(e.done, e.target)}/{e.target}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    case 'forge': {
      const rate = forgeRate(state) ?? 3;
      const out = 5;
      const pick = (value: ResourceId, onChange: (r: ResourceId) => void, label: string) => (
        <div className="base-forge-pick" role="radiogroup" aria-label={label}>
          <span className="base-forge-label">{label}</span>
          {RESOURCE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={value === id}
              aria-label={g.resources[id]}
              className={`base-forge-option ${value === id ? 'is-active' : ''}`}
              onClick={() => onChange(id)}>
              <ResourceIcon id={id} size={18} />
            </button>
          ))}
        </div>
      );
      return (
        <div className="base-role">
          <p>{g.roles.forge(rate)}</p>
          {pick(from, setFrom, g.forge.from)}
          {pick(to, setTo, g.forge.to)}
          <button
            type="button"
            className="base-primary-btn"
            disabled={from === to || state.resources[from] < rate * out}
            onClick={() => {
              const result = game.trade(from, to);
              if (!result.ok) {
                fx.error();
                onNotice(g.errors[result.error]);
              } else {
                fx.coin();
              }
            }}>
            <ResourceIcon id={from} size={16} />
            {g.forge.trade(rate * out, out)}
            <ResourceIcon id={to} size={16} />
          </button>
        </div>
      );
    }
    default:
      return null;
  }
}
