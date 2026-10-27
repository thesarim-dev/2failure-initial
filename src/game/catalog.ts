/**
 * Base game catalogue. Everything here is data: what resources exist, what
 * can be built, what it costs, and which trophies can be earned.
 *
 * Design rules:
 * - Each movement pattern earns its own resource, so a base only grows if
 *   training is balanced.
 * - Buildings finish by completing sets, never by waiting.
 * - Trophies can only be earned, never bought.
 */

/** Building materials. Coins (the workout currency) are separate. */
export type ResourceId = 'stone' | 'timber' | 'crystal';
export const RESOURCE_IDS: ResourceId[] = ['stone', 'timber', 'crystal'];

export type Resources = Record<ResourceId, number>;
export type Cost = Partial<Resources>;

/** Where a set's resource comes from. */
export type TrainingPattern = 'push' | 'pull' | 'legs' | 'core' | 'recovery';

/** Upper body (push and pull) earns stone, lower body timber, core crystal. */
export const PATTERN_RESOURCE: Record<Exclude<TrainingPattern, 'recovery'>, ResourceId> = {
  push: 'stone',
  pull: 'stone',
  legs: 'timber',
  core: 'crystal'
};

export const EMPTY_RESOURCES: Resources = { stone: 0, timber: 0, crystal: 0 };

/** Enough to place a first building and a few decorations right away. */
export const STARTING_RESOURCES: Resources = { stone: 40, timber: 40, crystal: 25 };

// ---------------------------------------------------------------------------
// Plot and headquarters
// ---------------------------------------------------------------------------

export const GRID_SIZE = 20;
/**
 * Progression: the HQ goes to level 10 (one level per consistent week), other
 * buildings to level 6 (never above the HQ). Costs follow what training
 * actually earns (about 1 stone : 1 timber : 2+ crystal a week), so no
 * material piles up while another runs dry. Tuned with
 * scripts/progression-sim.ts.
 */
export const MAX_HQ_LEVEL = 10;
export const MAX_STRUCTURE_LEVEL = 6;

/**
 * Land is bought with coins (the workout currency) and is deliberately
 * expensive. Index = land level; side = buildable square, centred on the plot.
 */
export const LAND_SIDES = [10, 12, 14, 16, 18, 20] as const;
export const LAND_COIN_COST = [0, 500, 1200, 2500, 4000, 6000] as const;
export const MAX_LAND_LEVEL = LAND_SIDES.length - 1;

export function buildableBounds(landLevel: number): { min: number; max: number } {
  const side = LAND_SIDES[Math.min(Math.max(landLevel, 0), MAX_LAND_LEVEL)];
  const min = (GRID_SIZE - side) / 2;
  return { min, max: min + side - 1 };
}

export function isTileBuildable(x: number, y: number, landLevel: number): boolean {
  const { min, max } = buildableBounds(landLevel);
  return x >= min && x <= max && y >= min && y <= max;
}

/** HQ sits in the middle of the plot and is always there. */
export const HQ_POSITION = { x: 9, y: 9 };

/** Coins for upgrading a building to each level (index = target level). */
export const UPGRADE_COIN_COST: Record<number, number> = { 2: 100, 3: 150, 4: 200, 5: 260, 6: 320 };
export const HQ_UPGRADE_COIN_COST: Record<number, number> = { 2: 100, 3: 200, 4: 300, 5: 400, 6: 500, 7: 600, 8: 700, 9: 800, 10: 900 };

/** Builders needed at once for a job: 1 for levels 1–2, 2 for 3–4, 3 above; decor and trophies need 1. */
export function buildersForLevel(targetLevel: number): number {
  return targetLevel <= 2 ? 1 : targetLevel <= 4 ? 2 : 3;
}

/** Decor and trophies take one set to put up. */
export const DECOR_BUILD_SETS = 1;

// ---------------------------------------------------------------------------
// Customization
// ---------------------------------------------------------------------------

/** Accent colours the player can pick for buildings, lights, flags and pedestals. */
export const PALETTE = {
  cyan: '#37d8ff',
  lime: '#c8f032',
  magenta: '#ff5fd2',
  amber: '#f2a541',
  violet: '#a78bfa',
  red: '#ff5a5a',
  white: '#e8edf2'
} as const;
export type PaletteId = keyof typeof PALETTE;
export const PALETTE_IDS = Object.keys(PALETTE) as PaletteId[];

export type Customization = { style?: string; color?: PaletteId; /** Rotated (mirrored) to face the other way. */ flip?: boolean };

/** Add-ons any building can wear (drawn over its front wall). */
const STRUCTURE_DECORATIONS = ['plain', 'banners', 'plated', 'glow'];

/** What each item lets the player change. `colors: true` shows the palette. */
export const CUSTOMIZE: Record<string, { styles?: string[]; colors?: boolean }> = {
  hq: { styles: STRUCTURE_DECORATIONS, colors: true },
  watchtower: { styles: STRUCTURE_DECORATIONS, colors: true },
  lodge: { styles: STRUCTURE_DECORATIONS, colors: true },
  forge: { styles: STRUCTURE_DECORATIONS, colors: true },
  spring: { styles: STRUCTURE_DECORATIONS, colors: true },
  yard: { styles: STRUCTURE_DECORATIONS, colors: true },
  path: { styles: ['stone', 'wood', 'tiles'] },
  wall: { styles: ['stone', 'hedge', 'fence'] },
  pine: { styles: ['pine', 'oak', 'palm', 'cherry'] },
  banner: { styles: ['plain', 'stripe', 'chevron'], colors: true },
  garden: { styles: ['wildflowers', 'tulips', 'roses', 'lavender'], colors: true },
  fountain: { styles: ['classic', 'tiered', 'jet'] },
  flowers: { colors: true },
  campfire: {},
  picnic: { colors: true },
  gazebo: { colors: true },
  torch: {},
  lanterns: { colors: true },
  arch: { colors: true },
  statue: { styles: ['flex', 'runner'] },
  plyobox: { colors: true },
  pullupbar: { colors: true },
  dipbars: { colors: true },
  punchbag: { colors: true },
  lilypad: {},
  bridge: {},
  pumpkins: {},
  birdhouse: { colors: true },
  coop: { colors: true },
  beehive: {},
  well: {},
  barn: { colors: true },
  windmill: { colors: true },
  tent: { colors: true },
  parasol: { colors: true },
  snowman: { colors: true },
  trophy: { styles: ['stone', 'marble', 'neon'], colors: true }
};

export function customizeKey(itemId: string): string {
  return itemId.startsWith('trophy:') ? 'trophy' : itemId;
}

/**
 * On-target weeks needed before each HQ level (index = level). Base level
 * reflects a habit, not one heavy weekend.
 */
// HQ 2 is open from the start (after a Lodge adds the second builder);
// HQ 3 asks for two weeks on target, so it rewards a real habit.
/** Weeks on target needed for each HQ level: one more each week you hit your plan. */
export const HQ_WEEKS_REQUIRED: Record<number, number> = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8 };

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export type ItemKind = 'structure' | 'decor' | 'trophy';

export type StructureLevel = {
  cost: Cost;
  /** Completed sets needed to finish this level. */
  sets: number;
};

export type StructureDef = {
  kind: 'structure';
  id: string;
  size: 1 | 2;
  /** HQ level needed before the first one can be placed. */
  unlockHq: number;
  /** How many can exist at each HQ level (index = HQ level). */
  maxCount: (hqLevel: number) => number;
  levels: StructureLevel[];
};

export type DecorGroup = 'nature' | 'farm' | 'comfort' | 'fun' | 'lights' | 'training' | 'paths' | 'water' | 'seasonal';
export type Season = 'autumn' | 'winter';
export const DECOR_GROUPS: DecorGroup[] = ['nature', 'farm', 'comfort', 'fun', 'lights', 'training', 'paths', 'water'];

export type DecorDef = {
  kind: 'decor';
  id: string;
  size: 1;
  unlockHq: number;
  /** Base level needed (prestige), on top of `unlockHq`. */
  unlockBase?: number;
  group: DecorGroup;
  /** Water decor (lily pads, bridges) goes on water; everything else on land. */
  onWater?: boolean;
  cost: Cost;
  /** Only buildable in this season (placed ones stay as keepsakes). */
  season?: Season;
};

export type ItemDef = StructureDef | DecorDef;

/** A level's cost from its total size and a building's material mix. */
function levelsFor(totals: readonly number[], mix: { stone: number; timber: number; crystal: number }, sets: (level: number) => number): StructureLevel[] {
  return totals.map((total, i) => ({
    cost:
      total === 0
        ? {}
        : {
            stone: Math.round(total * mix.stone),
            timber: Math.round(total * mix.timber),
            crystal: Math.round(total * mix.crystal)
          },
    sets: total === 0 ? 0 : sets(i + 1)
  }));
}
/** Total materials per level (index 0 = level 1). */
const HQ_TOTALS = [0, 50, 65, 80, 95, 110, 125, 140, 155, 170] as const;
const BUILDING_TOTALS = [16, 25, 34, 44, 55, 66] as const;

export const STRUCTURES: StructureDef[] = [
  {
    kind: 'structure',
    id: 'hq',
    size: 2,
    unlockHq: 1,
    maxCount: () => 1,
    levels: levelsFor(HQ_TOTALS, { stone: 0.2, timber: 0.2, crystal: 0.6 }, (l) => l + 1)
  },
  {
    kind: 'structure',
    id: 'watchtower',
    size: 1,
    unlockHq: 1,
    maxCount: (hq) => Math.min(hq, 4),
    levels: levelsFor(BUILDING_TOTALS, { stone: 0.3, timber: 0.2, crystal: 0.5 }, (l) => l)
  },
  {
    kind: 'structure',
    id: 'lodge',
    size: 1,
    unlockHq: 1,
    // One Lodge per base: each of its levels adds a builder.
    maxCount: () => 1,
    levels: levelsFor(BUILDING_TOTALS, { stone: 0.2, timber: 0.3, crystal: 0.5 }, (l) => l)
  },
  {
    kind: 'structure',
    id: 'forge',
    size: 1,
    unlockHq: 1,
    maxCount: () => 1,
    levels: levelsFor(BUILDING_TOTALS, { stone: 0.25, timber: 0.25, crystal: 0.5 }, (l) => l)
  },
  {
    // Shows today's workout as stations; its level raises the session bonus.
    kind: 'structure',
    id: 'yard',
    size: 2,
    unlockHq: 1,
    maxCount: () => 1,
    levels: levelsFor(BUILDING_TOTALS.map((t) => Math.round(t * 1.2)), { stone: 0.22, timber: 0.28, crystal: 0.5 }, (l) => l + 1)
  },
  {
    kind: 'structure',
    id: 'spring',
    size: 1,
    unlockHq: 2,
    maxCount: () => 1,
    levels: levelsFor(BUILDING_TOTALS.map((t) => Math.round(t * 1.1)), { stone: 0.2, timber: 0.2, crystal: 0.6 }, (l) => l + 1)
  }
];


export const DECOR: DecorDef[] = [
  // Paths & walls
  { kind: 'decor', id: 'wall', size: 1, unlockHq: 1, group: 'paths', cost: { stone: 4 } },
  { kind: 'decor', id: 'arch', size: 1, unlockHq: 1, unlockBase: 4, group: 'paths', cost: { timber: 6, crystal: 4 } },
  // Nature
  { kind: 'decor', id: 'pine', size: 1, unlockHq: 1, group: 'nature', cost: { timber: 3, crystal: 1 } },
  { kind: 'decor', id: 'flowers', size: 1, unlockHq: 1, group: 'nature', cost: { crystal: 2 } },
  { kind: 'decor', id: 'garden', size: 1, unlockHq: 1, group: 'nature', cost: { crystal: 4 } },
  { kind: 'decor', id: 'statue', size: 1, unlockHq: 1, unlockBase: 5, group: 'nature', cost: { stone: 14, crystal: 6 } },
  // Comfort
  { kind: 'decor', id: 'banner', size: 1, unlockHq: 1, group: 'comfort', cost: { timber: 3, stone: 2 } },
  { kind: 'decor', id: 'campfire', size: 1, unlockHq: 1, unlockBase: 2, group: 'comfort', cost: { timber: 4, stone: 2 } },
  { kind: 'decor', id: 'picnic', size: 1, unlockHq: 1, unlockBase: 2, group: 'comfort', cost: { timber: 6 } },
  { kind: 'decor', id: 'fountain', size: 1, unlockHq: 1, unlockBase: 3, group: 'comfort', cost: { stone: 12, crystal: 10 } },
  { kind: 'decor', id: 'gazebo', size: 1, unlockHq: 1, unlockBase: 4, group: 'comfort', cost: { timber: 10, stone: 6, crystal: 4 } },
  // Lights
  { kind: 'decor', id: 'torch', size: 1, unlockHq: 1, group: 'lights', cost: { timber: 2, stone: 1 } },
  { kind: 'decor', id: 'lanterns', size: 1, unlockHq: 1, unlockBase: 2, group: 'lights', cost: { stone: 3, crystal: 3 } },
  // Training park
  { kind: 'decor', id: 'plyobox', size: 1, unlockHq: 1, group: 'training', cost: { timber: 4 } },
  { kind: 'decor', id: 'pullupbar', size: 1, unlockHq: 1, unlockBase: 2, group: 'training', cost: { stone: 8 } },
  { kind: 'decor', id: 'dipbars', size: 1, unlockHq: 1, unlockBase: 3, group: 'training', cost: { stone: 6 } },
  { kind: 'decor', id: 'punchbag', size: 1, unlockHq: 1, unlockBase: 3, group: 'training', cost: { stone: 4, timber: 2 } },
  // Farm (barns and coops bring animals that wander around the base)
  { kind: 'decor', id: 'pumpkins', size: 1, unlockHq: 1, group: 'seasonal', season: 'autumn', cost: { timber: 1, crystal: 1 } },
  { kind: 'decor', id: 'birdhouse', size: 1, unlockHq: 1, group: 'farm', cost: { timber: 2 } },
  { kind: 'decor', id: 'coop', size: 1, unlockHq: 1, unlockBase: 2, group: 'farm', cost: { timber: 6, stone: 2 } },
  { kind: 'decor', id: 'beehive', size: 1, unlockHq: 1, unlockBase: 2, group: 'farm', cost: { timber: 3, crystal: 2 } },
  { kind: 'decor', id: 'well', size: 1, unlockHq: 1, unlockBase: 2, group: 'farm', cost: { stone: 6, timber: 2 } },
  { kind: 'decor', id: 'barn', size: 1, unlockHq: 1, unlockBase: 3, group: 'farm', cost: { timber: 12, stone: 4 } },
  { kind: 'decor', id: 'windmill', size: 1, unlockHq: 1, unlockBase: 4, group: 'farm', cost: { timber: 10, stone: 6 } },
  // Fun
  { kind: 'decor', id: 'tent', size: 1, unlockHq: 1, unlockBase: 2, group: 'fun', cost: { timber: 4, crystal: 2 } },
  { kind: 'decor', id: 'parasol', size: 1, unlockHq: 1, unlockBase: 2, group: 'fun', cost: { timber: 2, crystal: 2 } },
  { kind: 'decor', id: 'snowman', size: 1, unlockHq: 1, group: 'seasonal', season: 'winter', cost: { crystal: 3 } },
  // Water
  { kind: 'decor', id: 'lilypad', size: 1, unlockHq: 1, unlockBase: 3, group: 'water', onWater: true, cost: { crystal: 2 } },
  { kind: 'decor', id: 'bridge', size: 1, unlockHq: 1, unlockBase: 3, group: 'water', onWater: true, cost: { timber: 6 } }
];

// ---------------------------------------------------------------------------
// Terrain (free to paint, unlocked by base level)
// ---------------------------------------------------------------------------

export type TerrainId = 'grass' | 'meadow' | 'dirt' | 'path' | 'sand' | 'plaza' | 'water' | 'snow';
export const TERRAIN: Array<{ id: TerrainId; unlockBase: number }> = [
  { id: 'grass', unlockBase: 1 },
  { id: 'dirt', unlockBase: 1 },
  { id: 'path', unlockBase: 1 },
  { id: 'meadow', unlockBase: 2 },
  { id: 'sand', unlockBase: 2 },
  { id: 'plaza', unlockBase: 3 },
  { id: 'water', unlockBase: 3 },
  { id: 'snow', unlockBase: 6 }
];

// ---------------------------------------------------------------------------
// Base level (prestige): the long-term goal
// ---------------------------------------------------------------------------

/** Score needed for each base level (index 0 = level 1). */
export const BASE_LEVEL_SCORES = [0, 40, 100, 180, 300, 450, 650, 900, 1200] as const;
export const BASE_LEVEL_TITLES = [
  'campsite',
  'outpost',
  'hamlet',
  'village',
  'town',
  'stronghold',
  'citadel',
  'capital',
  'legend'
] as const;
export type BaseTitle = (typeof BASE_LEVEL_TITLES)[number];

/** Points per finished building level, by level reached. HQ counts double. */
export const SCORE_BUILDING_LEVEL = [0, 10, 25, 45, 70, 100, 135, 175, 220, 270, 325] as const;
export const SCORE_PER_DECOR = 2;
export const SCORE_PER_TROPHY_EARNED = 4;
export const SCORE_PER_TROPHY_PLACED = 6;
export const SCORE_PER_LAND_LEVEL = 15;

const ITEMS_BY_ID = new Map<string, ItemDef>(
  [...STRUCTURES, ...DECOR].map((item) => [item.id, item])
);

export function getItemDef(id: string): ItemDef | undefined {
  return ITEMS_BY_ID.get(id);
}

// ---------------------------------------------------------------------------
// Trophies
// ---------------------------------------------------------------------------

export type TrophyTier = 'bronze' | 'silver' | 'gold';

export type TrophyDef = {
  id: string;
  tier: TrophyTier;
  /** Visual family, so related trophies look related. */
  shape: 'cup' | 'monument' | 'medal' | 'statue';
};

export const TROPHIES: TrophyDef[] = [
  { id: 'first-set', tier: 'bronze', shape: 'medal' },
  { id: 'sets-50', tier: 'silver', shape: 'cup' },
  { id: 'sets-250', tier: 'gold', shape: 'cup' },
  { id: 'streak-3', tier: 'bronze', shape: 'monument' },
  { id: 'streak-7', tier: 'silver', shape: 'monument' },
  { id: 'streak-30', tier: 'gold', shape: 'monument' },
  { id: 'streak-100', tier: 'gold', shape: 'monument' },
  { id: 'pushups-30', tier: 'silver', shape: 'cup' },
  { id: 'pushups-50', tier: 'gold', shape: 'cup' },
  { id: 'first-pull-up', tier: 'silver', shape: 'statue' },
  { id: 'first-pistol', tier: 'gold', shape: 'statue' },
  { id: 'first-loaded', tier: 'bronze', shape: 'medal' },
  { id: 'first-elite', tier: 'silver', shape: 'medal' },
  { id: 'balanced-week', tier: 'silver', shape: 'medal' },
  { id: 'first-session', tier: 'bronze', shape: 'cup' },
  { id: 'first-week', tier: 'bronze', shape: 'monument' },
  { id: 'weeks-4', tier: 'silver', shape: 'monument' },
  { id: 'weeks-12', tier: 'gold', shape: 'monument' }
];

const TROPHIES_BY_ID = new Map(TROPHIES.map((trophy) => [trophy.id, trophy]));

export function getTrophyDef(id: string): TrophyDef | undefined {
  return TROPHIES_BY_ID.get(id);
}

/** Placed trophies use this prefix in the layout so they share one grid. */
export const TROPHY_ITEM_PREFIX = 'trophy:';

export function sumCost(costs: Cost[]): Resources {
  const total = { ...EMPTY_RESOURCES };
  for (const cost of costs) {
    for (const id of RESOURCE_IDS) total[id] += cost[id] ?? 0;
  }
  return total;
}

export function canAfford(resources: Resources, cost: Cost): boolean {
  return RESOURCE_IDS.every((id) => resources[id] >= (cost[id] ?? 0));
}

// ---------------------------------------------------------------------------
// Edges: thin fences, walls and hedges that run along the lines between
// tiles instead of filling a square. Key: `n:x,y` (top edge of tile x,y) or
// `w:x,y` (left edge of tile x,y).
// ---------------------------------------------------------------------------
export type EdgeKind = 'fence' | 'wall' | 'hedge';
export const EDGE_KINDS: EdgeKind[] = ['fence', 'wall', 'hedge'];
export const EDGE_COST: Record<EdgeKind, Cost> = {
  fence: { timber: 2 },
  wall: { stone: 3 },
  hedge: { timber: 1, crystal: 1 }
};

/**
 * Decorations retired from the catalog (they added little: plain filler or
 * duplicates). Bases that still have them get them removed with a full refund.
 */
export const RETIRED_DECOR: Record<string, Cost> = {
  rock: { stone: 2 },
  bush: { timber: 2, crystal: 1 },
  bench: { timber: 4, stone: 1 },
  lamp: { stone: 3, crystal: 2 },
  hay: { timber: 2 },
  barrels: { timber: 3 },
  signpost: { timber: 2 },
  sandcastle: { stone: 3 }
};

/**
 * Seasonal decorations: autumn is September–November, winter is
 * December–February. Returns whether it's open now and how many days are left
 * (or how long until it comes back).
 */
const SEASON_MONTHS: Record<Season, number[]> = { autumn: [8, 9, 10], winter: [11, 0, 1] };
export function seasonState(season: Season, now: Date = new Date()): { open: boolean; days: number } {
  const months = SEASON_MONTHS[season];
  const day = 86400000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (months.includes(now.getMonth())) {
    // Days until the first day after the season's last month.
    const last = months[months.length - 1];
    const endYear = last < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
    const end = new Date(endYear, last + 1, 1);
    return { open: true, days: Math.round((end.getTime() - today.getTime()) / day) };
  }
  const first = months[0];
  const startYear = first < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
  const start = new Date(startYear, first, 1);
  return { open: false, days: Math.round((start.getTime() - today.getTime()) / day) };
}
