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
export const MAX_HQ_LEVEL = 3;
export const MAX_STRUCTURE_LEVEL = 3;

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
export const UPGRADE_COIN_COST: Record<number, number> = { 2: 250, 3: 700 };
export const HQ_UPGRADE_COIN_COST: Record<number, number> = { 2: 300, 3: 1200 };

/** Builders needed at once for a job: level N needs N; decor and trophies need 1. */
export function buildersForLevel(targetLevel: number): number {
  return Math.max(1, targetLevel);
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

export type Customization = { style?: string; color?: PaletteId };

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
  lamp: { styles: ['classic', 'lantern', 'neon'], colors: true },
  banner: { styles: ['plain', 'stripe', 'chevron'], colors: true },
  garden: { styles: ['wildflowers', 'tulips', 'roses', 'lavender'], colors: true },
  fountain: { styles: ['classic', 'tiered', 'jet'] },
  bush: { styles: ['round', 'flowering'] },
  rock: { styles: ['boulder', 'mossy'] },
  flowers: { colors: true },
  bench: { colors: true },
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
  hay: {},
  barrels: {},
  pumpkins: {},
  birdhouse: { colors: true },
  coop: { colors: true },
  beehive: {},
  well: {},
  barn: { colors: true },
  windmill: { colors: true },
  signpost: {},
  tent: { colors: true },
  parasol: { colors: true },
  sandcastle: {},
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
export const HQ_WEEKS_REQUIRED: Record<number, number> = { 1: 0, 2: 0, 3: 2 };

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

export type DecorGroup = 'nature' | 'farm' | 'comfort' | 'fun' | 'lights' | 'training' | 'paths' | 'water';
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
};

export type ItemDef = StructureDef | DecorDef;

export const STRUCTURES: StructureDef[] = [
  {
    kind: 'structure',
    id: 'hq',
    size: 2,
    unlockHq: 1,
    maxCount: () => 1,
    levels: [
      { cost: {}, sets: 0 },
      { cost: { stone: 30, timber: 22, crystal: 12 }, sets: 3 },
      { cost: { stone: 80, timber: 65, crystal: 40 }, sets: 5 }
    ]
  },
  {
    kind: 'structure',
    id: 'watchtower',
    size: 1,
    unlockHq: 1,
    maxCount: (hq) => hq,
    levels: [
      { cost: { stone: 20, timber: 5 }, sets: 1 },
      { cost: { stone: 28, timber: 6, crystal: 6 }, sets: 2 },
      { cost: { stone: 50, timber: 12, crystal: 12 }, sets: 3 }
    ]
  },
  {
    kind: 'structure',
    id: 'lodge',
    size: 1,
    unlockHq: 1,
    // One Lodge per base: each of its levels adds a builder.
    maxCount: () => 1,
    levels: [
      { cost: { timber: 20, stone: 5 }, sets: 1 },
      { cost: { timber: 28, stone: 6, crystal: 6 }, sets: 2 },
      { cost: { timber: 50, stone: 12, crystal: 12 }, sets: 3 }
    ]
  },
  {
    kind: 'structure',
    id: 'forge',
    size: 1,
    unlockHq: 1,
    maxCount: () => 1,
    levels: [
      { cost: { stone: 15, timber: 10 }, sets: 1 },
      { cost: { stone: 22, timber: 12, crystal: 6 }, sets: 2 },
      { cost: { stone: 36, timber: 24, crystal: 12 }, sets: 3 }
    ]
  },
  {
    // Shows today's workout as stations; its level raises the session bonus.
    kind: 'structure',
    id: 'yard',
    size: 2,
    unlockHq: 1,
    maxCount: () => 1,
    levels: [
      { cost: { stone: 13, timber: 13, crystal: 9 }, sets: 2 },
      { cost: { stone: 24, timber: 24, crystal: 15 }, sets: 3 },
      { cost: { stone: 48, timber: 48, crystal: 30 }, sets: 4 }
    ]
  },
  {
    kind: 'structure',
    id: 'spring',
    size: 1,
    unlockHq: 2,
    maxCount: () => 1,
    levels: [
      { cost: { crystal: 25, stone: 15 }, sets: 2 },
      { cost: { crystal: 28, stone: 18, timber: 9 }, sets: 3 },
      { cost: { crystal: 42, stone: 30, timber: 18 }, sets: 4 }
    ]
  }
];

export const DECOR: DecorDef[] = [
  // Paths & walls
  { kind: 'decor', id: 'path', size: 1, unlockHq: 1, group: 'paths', cost: { stone: 2 } },
  { kind: 'decor', id: 'wall', size: 1, unlockHq: 1, group: 'paths', cost: { stone: 4 } },
  { kind: 'decor', id: 'arch', size: 1, unlockHq: 1, unlockBase: 4, group: 'paths', cost: { timber: 6, crystal: 4 } },
  // Nature
  { kind: 'decor', id: 'pine', size: 1, unlockHq: 1, group: 'nature', cost: { timber: 3, crystal: 1 } },
  { kind: 'decor', id: 'bush', size: 1, unlockHq: 1, group: 'nature', cost: { timber: 2, crystal: 1 } },
  { kind: 'decor', id: 'rock', size: 1, unlockHq: 1, group: 'nature', cost: { stone: 2 } },
  { kind: 'decor', id: 'flowers', size: 1, unlockHq: 1, group: 'nature', cost: { crystal: 2 } },
  { kind: 'decor', id: 'garden', size: 1, unlockHq: 1, group: 'nature', cost: { crystal: 4 } },
  { kind: 'decor', id: 'statue', size: 1, unlockHq: 1, unlockBase: 5, group: 'nature', cost: { stone: 14, crystal: 6 } },
  // Comfort
  { kind: 'decor', id: 'bench', size: 1, unlockHq: 1, group: 'comfort', cost: { timber: 4, stone: 1 } },
  { kind: 'decor', id: 'banner', size: 1, unlockHq: 1, group: 'comfort', cost: { timber: 3, stone: 2 } },
  { kind: 'decor', id: 'campfire', size: 1, unlockHq: 1, unlockBase: 2, group: 'comfort', cost: { timber: 4, stone: 2 } },
  { kind: 'decor', id: 'picnic', size: 1, unlockHq: 1, unlockBase: 2, group: 'comfort', cost: { timber: 6 } },
  { kind: 'decor', id: 'fountain', size: 1, unlockHq: 1, unlockBase: 3, group: 'comfort', cost: { stone: 12, crystal: 10 } },
  { kind: 'decor', id: 'gazebo', size: 1, unlockHq: 1, unlockBase: 4, group: 'comfort', cost: { timber: 10, stone: 6, crystal: 4 } },
  // Lights
  { kind: 'decor', id: 'lamp', size: 1, unlockHq: 1, group: 'lights', cost: { stone: 3, crystal: 2 } },
  { kind: 'decor', id: 'torch', size: 1, unlockHq: 1, group: 'lights', cost: { timber: 2, stone: 1 } },
  { kind: 'decor', id: 'lanterns', size: 1, unlockHq: 1, unlockBase: 2, group: 'lights', cost: { stone: 3, crystal: 3 } },
  // Training park
  { kind: 'decor', id: 'plyobox', size: 1, unlockHq: 1, group: 'training', cost: { timber: 4 } },
  { kind: 'decor', id: 'pullupbar', size: 1, unlockHq: 1, unlockBase: 2, group: 'training', cost: { stone: 8 } },
  { kind: 'decor', id: 'dipbars', size: 1, unlockHq: 1, unlockBase: 3, group: 'training', cost: { stone: 6 } },
  { kind: 'decor', id: 'punchbag', size: 1, unlockHq: 1, unlockBase: 3, group: 'training', cost: { stone: 4, timber: 2 } },
  // Farm (barns and coops bring animals that wander around the base)
  { kind: 'decor', id: 'hay', size: 1, unlockHq: 1, group: 'farm', cost: { timber: 2 } },
  { kind: 'decor', id: 'barrels', size: 1, unlockHq: 1, group: 'farm', cost: { timber: 3 } },
  { kind: 'decor', id: 'pumpkins', size: 1, unlockHq: 1, group: 'farm', cost: { timber: 1, crystal: 1 } },
  { kind: 'decor', id: 'birdhouse', size: 1, unlockHq: 1, group: 'farm', cost: { timber: 2 } },
  { kind: 'decor', id: 'coop', size: 1, unlockHq: 1, unlockBase: 2, group: 'farm', cost: { timber: 6, stone: 2 } },
  { kind: 'decor', id: 'beehive', size: 1, unlockHq: 1, unlockBase: 2, group: 'farm', cost: { timber: 3, crystal: 2 } },
  { kind: 'decor', id: 'well', size: 1, unlockHq: 1, unlockBase: 2, group: 'farm', cost: { stone: 6, timber: 2 } },
  { kind: 'decor', id: 'barn', size: 1, unlockHq: 1, unlockBase: 3, group: 'farm', cost: { timber: 12, stone: 4 } },
  { kind: 'decor', id: 'windmill', size: 1, unlockHq: 1, unlockBase: 4, group: 'farm', cost: { timber: 10, stone: 6 } },
  // Fun
  { kind: 'decor', id: 'signpost', size: 1, unlockHq: 1, group: 'fun', cost: { timber: 2 } },
  { kind: 'decor', id: 'tent', size: 1, unlockHq: 1, unlockBase: 2, group: 'fun', cost: { timber: 4, crystal: 2 } },
  { kind: 'decor', id: 'parasol', size: 1, unlockHq: 1, unlockBase: 2, group: 'fun', cost: { timber: 2, crystal: 2 } },
  { kind: 'decor', id: 'sandcastle', size: 1, unlockHq: 1, unlockBase: 3, group: 'fun', cost: { stone: 3 } },
  { kind: 'decor', id: 'snowman', size: 1, unlockHq: 1, unlockBase: 6, group: 'fun', cost: { crystal: 3 } },
  // Water
  { kind: 'decor', id: 'lilypad', size: 1, unlockHq: 1, unlockBase: 3, group: 'water', onWater: true, cost: { crystal: 2 } },
  { kind: 'decor', id: 'bridge', size: 1, unlockHq: 1, unlockBase: 3, group: 'water', onWater: true, cost: { timber: 6 } }
];

// ---------------------------------------------------------------------------
// Terrain (free to paint, unlocked by base level)
// ---------------------------------------------------------------------------

export type TerrainId = 'grass' | 'meadow' | 'dirt' | 'sand' | 'plaza' | 'water' | 'snow';
export const TERRAIN: Array<{ id: TerrainId; unlockBase: number }> = [
  { id: 'grass', unlockBase: 1 },
  { id: 'dirt', unlockBase: 1 },
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
export const SCORE_BUILDING_LEVEL = [0, 10, 25, 50] as const;
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
