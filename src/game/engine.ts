import {
  EMPTY_RESOURCES,
  GRID_SIZE,
  HQ_POSITION,
  PATTERN_RESOURCE,
  RESOURCE_IDS,
  STARTING_RESOURCES,
  TROPHY_ITEM_PREFIX,
  canAfford,
  getItemDef,
  getTrophyDef,
  isTileBuildable,
  type Cost,
  type ResourceId,
  type Resources,
  type StructureDef,
  type TrainingPattern
} from './catalog';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type PlacedItem = {
  uid: string;
  /** Catalogue id, or `trophy:<trophyId>` for a placed trophy. */
  itemId: string;
  x: number;
  y: number;
  /** Finished level. 0 means the first level is still being built. */
  level: number;
};

export type Construction = {
  uid: string;
  targetLevel: number;
  setsRemaining: number;
  setsTotal: number;
};

export type EarnedTrophy = {
  earnedAt: string;
  /** The number behind the trophy (reps, streak days, total sets). */
  value?: number;
  /** Reps were counted by the AI camera. */
  verified?: boolean;
};

export type GameStats = {
  totalSets: number;
  /** Local date of the last counted set, YYYY-MM-DD. */
  day: string | null;
  setsToday: number;
  /** ISO-ish week key of `weekPatterns`. */
  week: string | null;
  weekPatterns: TrainingPattern[];
};

export type GameState = {
  version: 1;
  resources: Resources;
  placed: PlacedItem[];
  construction: Construction | null;
  trophies: Record<string, EarnedTrophy>;
  stats: GameStats;
  /** New things the player hasn't looked at yet (drives the tab badge). */
  unseen: string[];
  nextUid: number;
  /** The welcome card on the base screen has been dismissed. */
  introSeen?: boolean;
};

export function createInitialState(): GameState {
  return {
    version: 1,
    resources: { ...STARTING_RESOURCES },
    placed: [{ uid: 'u1', itemId: 'hq', x: HQ_POSITION.x, y: HQ_POSITION.y, level: 1 }],
    construction: null,
    trophies: {},
    stats: { totalSets: 0, day: null, setsToday: 0, week: null, weekPatterns: [] },
    unseen: [],
    nextUid: 2
  };
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Monday-based week key: the local date of that week's Monday. */
export function localWeekKey(date: Date): string {
  const monday = new Date(date);
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return localDayKey(monday);
}

// ---------------------------------------------------------------------------
// Earning
// ---------------------------------------------------------------------------

/** Sets shorter than this don't earn anything (stops tap-farming). */
export const MIN_SET_SECONDS = 10;
/** Sets per day that earn the full amount. */
export const FULL_RATE_SETS = 12;
/** After this many sets in a day, sets stop earning. Rest matters. */
export const DAILY_SET_LIMIT = 20;

const TIER_AMOUNT = { BASE: 4, PRO: 6, ELITE: 8 } as const;

export type SetTier = keyof typeof TIER_AMOUNT;

export type SetEvent = {
  exerciseId: string;
  pattern: TrainingPattern;
  tier: SetTier;
  durationSeconds: number;
  reps?: number;
  /** Reps were counted by the AI camera. */
  verified?: boolean;
  /** The exercise uses a loaded backpack. */
  loaded?: boolean;
  now?: Date;
};

export type EarnRate = 'full' | 'half' | 'limit' | 'tooShort';

export type SetReward = {
  earned: Resources;
  rate: EarnRate;
  newTrophies: string[];
  /** Construction progress made by this set, if any. */
  construction?: { itemId: string; targetLevel: number; setsRemaining: number };
};

function rateForSet(setNumberToday: number, durationSeconds: number): EarnRate {
  if (durationSeconds < MIN_SET_SECONDS) return 'tooShort';
  if (setNumberToday > DAILY_SET_LIMIT) return 'limit';
  if (setNumberToday > FULL_RATE_SETS) return 'half';
  return 'full';
}

export function earnedForSet(pattern: TrainingPattern, tier: SetTier, rate: EarnRate): Resources {
  const earned = { ...EMPTY_RESOURCES };
  if (rate === 'tooShort' || rate === 'limit') return earned;
  const factor = rate === 'half' ? 0.5 : 1;
  if (pattern === 'recovery') {
    // Stretching earns a little of everything: rest days count.
    for (const id of RESOURCE_IDS) earned[id] = Math.ceil(1 * factor);
    return earned;
  }
  earned[PATTERN_RESOURCE[pattern]] = Math.ceil(TIER_AMOUNT[tier] * factor);
  return earned;
}

// ---------------------------------------------------------------------------
// Trophies
// ---------------------------------------------------------------------------

const PULL_UP_IDS = new Set(['pull-ups', 'chin-ups', 'backpack-pull-ups']);

function award(
  state: GameState,
  id: string,
  now: Date,
  detail: Omit<EarnedTrophy, 'earnedAt'> = {}
): boolean {
  if (state.trophies[id] || !getTrophyDef(id)) return false;
  state.trophies[id] = { earnedAt: now.toISOString(), ...detail };
  state.unseen.push(`trophy:${id}`);
  return true;
}

function awardSetTrophies(state: GameState, event: SetEvent, now: Date): string[] {
  const earned: string[] = [];
  const give = (id: string, detail?: Omit<EarnedTrophy, 'earnedAt'>) => {
    if (award(state, id, now, detail)) earned.push(id);
  };
  const { totalSets } = state.stats;
  const reps = event.reps ?? 0;

  if (totalSets >= 1) give('first-set', { value: 1 });
  if (totalSets >= 50) give('sets-50', { value: 50 });
  if (totalSets >= 250) give('sets-250', { value: 250 });

  if (event.exerciseId === 'pushups') {
    if (reps >= 30) give('pushups-30', { value: reps, verified: event.verified });
    if (reps >= 50) give('pushups-50', { value: reps, verified: event.verified });
  }
  if (PULL_UP_IDS.has(event.exerciseId) && reps >= 1) {
    give('first-pull-up', { value: reps, verified: event.verified });
  }
  if (event.exerciseId === 'pistol-squats' && reps >= 1) {
    give('first-pistol', { value: reps, verified: event.verified });
  }
  if (event.loaded) give('first-loaded');
  if (event.tier === 'ELITE') give('first-elite');

  const patterns = new Set(state.stats.weekPatterns);
  if (['push', 'pull', 'legs', 'core'].every((p) => patterns.has(p as TrainingPattern))) {
    give('balanced-week');
  }
  return earned;
}

const STREAK_TROPHIES: Array<[number, string]> = [
  [3, 'streak-3'],
  [7, 'streak-7'],
  [30, 'streak-30'],
  [100, 'streak-100']
];

/** Streaks are tracked by the app, so they're checked whenever the streak changes. */
export function applyStreak(
  prev: GameState,
  streak: number,
  now: Date = new Date()
): { state: GameState; newTrophies: string[] } {
  const pending = STREAK_TROPHIES.filter(([days, id]) => streak >= days && !prev.trophies[id]);
  if (!pending.length) return { state: prev, newTrophies: [] };
  const state = structuredClone(prev);
  const newTrophies: string[] = [];
  for (const [days, id] of pending) {
    if (award(state, id, now, { value: days })) newTrophies.push(id);
  }
  return { state, newTrophies };
}

// ---------------------------------------------------------------------------
// Recording a set
// ---------------------------------------------------------------------------

export function applySet(prev: GameState, event: SetEvent): { state: GameState; reward: SetReward } {
  const now = event.now ?? new Date();
  const state = structuredClone(prev);
  const today = localDayKey(now);
  const week = localWeekKey(now);

  if (state.stats.day !== today) {
    state.stats.day = today;
    state.stats.setsToday = 0;
  }
  if (state.stats.week !== week) {
    state.stats.week = week;
    state.stats.weekPatterns = [];
  }

  const rate = rateForSet(state.stats.setsToday + 1, event.durationSeconds);
  const reward: SetReward = { earned: { ...EMPTY_RESOURCES }, rate, newTrophies: [] };
  if (rate === 'tooShort') return { state: prev, reward };

  state.stats.setsToday += 1;
  state.stats.totalSets += 1;
  if (!state.stats.weekPatterns.includes(event.pattern)) {
    state.stats.weekPatterns.push(event.pattern);
  }

  reward.earned = earnedForSet(event.pattern, event.tier, rate);
  for (const id of RESOURCE_IDS) state.resources[id] += reward.earned[id];

  // Construction advances with every set that still earns something.
  if (state.construction && rate !== 'limit') {
    const job = state.construction;
    job.setsRemaining = Math.max(0, job.setsRemaining - 1);
    const item = state.placed.find((p) => p.uid === job.uid);
    if (item) {
      reward.construction = {
        itemId: item.itemId,
        targetLevel: job.targetLevel,
        setsRemaining: job.setsRemaining
      };
      if (job.setsRemaining === 0) {
        item.level = job.targetLevel;
        state.construction = null;
        state.unseen.push(`built:${item.uid}`);
      }
    } else {
      state.construction = null;
    }
  }

  reward.newTrophies = awardSetTrophies(state, event, now);
  return { state, reward };
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

export function hqLevel(state: GameState): number {
  return state.placed.find((p) => p.itemId === 'hq')?.level ?? 1;
}

export function itemSize(itemId: string): 1 | 2 {
  if (itemId.startsWith(TROPHY_ITEM_PREFIX)) return 1;
  return getItemDef(itemId)?.size ?? 1;
}

function tilesOf(x: number, y: number, size: number): Array<[number, number]> {
  const tiles: Array<[number, number]> = [];
  for (let dx = 0; dx < size; dx++) for (let dy = 0; dy < size; dy++) tiles.push([x + dx, y + dy]);
  return tiles;
}

/** Map of "x,y" → uid for every occupied tile. */
export function occupancy(state: GameState): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of state.placed) {
    for (const [tx, ty] of tilesOf(item.x, item.y, itemSize(item.itemId))) {
      map.set(`${tx},${ty}`, item.uid);
    }
  }
  return map;
}

export function canPlaceAt(
  state: GameState,
  itemId: string,
  x: number,
  y: number,
  ignoreUid?: string
): boolean {
  const size = itemSize(itemId);
  const occupied = occupancy(state);
  const level = hqLevel(state);
  return tilesOf(x, y, size).every(([tx, ty]) => {
    if (tx < 0 || ty < 0 || tx >= GRID_SIZE || ty >= GRID_SIZE) return false;
    if (!isTileBuildable(tx, ty, level)) return false;
    const owner = occupied.get(`${tx},${ty}`);
    return !owner || owner === ignoreUid;
  });
}

export function countPlaced(state: GameState, itemId: string): number {
  return state.placed.filter((p) => p.itemId === itemId).length;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type ActionError =
  | 'locked'
  | 'maxCount'
  | 'builderBusy'
  | 'cantAfford'
  | 'blocked'
  | 'maxLevel'
  | 'needsHq'
  | 'notEarned'
  | 'alreadyPlaced'
  | 'notRemovable';

export type ActionResult = { ok: true; state: GameState } | { ok: false; error: ActionError };

function pay(state: GameState, cost: Cost) {
  for (const id of RESOURCE_IDS) state.resources[id] -= cost[id] ?? 0;
}

/** Why an item can't be placed right now, or null if it can. */
export function placeBlocker(state: GameState, itemId: string): ActionError | null {
  const def = getItemDef(itemId);
  if (!def) return 'locked';
  const level = hqLevel(state);
  if (level < def.unlockHq) return 'locked';
  if (def.kind === 'structure') {
    if (countPlaced(state, itemId) >= def.maxCount(level)) return 'maxCount';
    if (state.construction) return 'builderBusy';
    if (!canAfford(state.resources, def.levels[0].cost)) return 'cantAfford';
    return null;
  }
  if (!canAfford(state.resources, def.cost)) return 'cantAfford';
  return null;
}

export function placeItem(prev: GameState, itemId: string, x: number, y: number): ActionResult {
  const blocker = placeBlocker(prev, itemId);
  if (blocker) return { ok: false, error: blocker };
  if (!canPlaceAt(prev, itemId, x, y)) return { ok: false, error: 'blocked' };
  const def = getItemDef(itemId)!;
  const state = structuredClone(prev);
  const uid = `u${state.nextUid++}`;

  if (def.kind === 'structure') {
    const first = def.levels[0];
    pay(state, first.cost);
    state.placed.push({ uid, itemId, x, y, level: first.sets === 0 ? 1 : 0 });
    if (first.sets > 0) {
      state.construction = { uid, targetLevel: 1, setsRemaining: first.sets, setsTotal: first.sets };
    }
  } else {
    pay(state, def.cost);
    state.placed.push({ uid, itemId, x, y, level: 1 });
  }
  return { ok: true, state };
}

export function placeTrophy(prev: GameState, trophyId: string, x: number, y: number): ActionResult {
  if (!prev.trophies[trophyId]) return { ok: false, error: 'notEarned' };
  const itemId = `${TROPHY_ITEM_PREFIX}${trophyId}`;
  if (prev.placed.some((p) => p.itemId === itemId)) return { ok: false, error: 'alreadyPlaced' };
  if (!canPlaceAt(prev, itemId, x, y)) return { ok: false, error: 'blocked' };
  const state = structuredClone(prev);
  state.placed.push({ uid: `u${state.nextUid++}`, itemId, x, y, level: 1 });
  return { ok: true, state };
}

/** Why a structure can't be upgraded right now, or null if it can. */
export function upgradeBlocker(state: GameState, uid: string): ActionError | null {
  const item = state.placed.find((p) => p.uid === uid);
  const def = item && getItemDef(item.itemId);
  if (!item || !def || def.kind !== 'structure') return 'locked';
  if (item.level >= def.levels.length) return 'maxLevel';
  if (state.construction) return 'builderBusy';
  // Other buildings can't outgrow headquarters.
  if (def.id !== 'hq' && item.level >= hqLevel(state)) return 'needsHq';
  if (!canAfford(state.resources, def.levels[item.level].cost)) return 'cantAfford';
  return null;
}

export function upgradeItem(prev: GameState, uid: string): ActionResult {
  const blocker = upgradeBlocker(prev, uid);
  if (blocker) return { ok: false, error: blocker };
  const state = structuredClone(prev);
  const item = state.placed.find((p) => p.uid === uid)!;
  const def = getItemDef(item.itemId) as StructureDef;
  const next = def.levels[item.level];
  pay(state, next.cost);
  state.construction = {
    uid,
    targetLevel: item.level + 1,
    setsRemaining: next.sets,
    setsTotal: next.sets
  };
  return { ok: true, state };
}

export function moveItem(prev: GameState, uid: string, x: number, y: number): ActionResult {
  const item = prev.placed.find((p) => p.uid === uid);
  if (!item || item.itemId === 'hq') return { ok: false, error: 'notRemovable' };
  if (!canPlaceAt(prev, item.itemId, x, y, uid)) return { ok: false, error: 'blocked' };
  const state = structuredClone(prev);
  const moved = state.placed.find((p) => p.uid === uid)!;
  moved.x = x;
  moved.y = y;
  return { ok: true, state };
}

/** Decor is refunded in full; trophies go back to the shelf. Buildings stay. */
export function removeItem(prev: GameState, uid: string): ActionResult {
  const item = prev.placed.find((p) => p.uid === uid);
  if (!item) return { ok: false, error: 'notRemovable' };
  const isTrophy = item.itemId.startsWith(TROPHY_ITEM_PREFIX);
  const def = getItemDef(item.itemId);
  if (!isTrophy && def?.kind !== 'decor') return { ok: false, error: 'notRemovable' };
  const state = structuredClone(prev);
  state.placed = state.placed.filter((p) => p.uid !== uid);
  if (def?.kind === 'decor') {
    for (const id of RESOURCE_IDS) state.resources[id] += def.cost[id] ?? 0;
  }
  return { ok: true, state };
}

/** A base goes quiet (lights dim) on days without a set. Nothing is lost. */
export function isQuietToday(state: GameState, now: Date = new Date()): boolean {
  return state.stats.day !== localDayKey(now) || state.stats.setsToday === 0;
}

export function resourcesOf(reward: SetReward): Array<[ResourceId, number]> {
  return RESOURCE_IDS.filter((id) => reward.earned[id] > 0).map((id) => [id, reward.earned[id]]);
}
