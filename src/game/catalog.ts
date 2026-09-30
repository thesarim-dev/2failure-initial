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

export type ResourceId = 'stone' | 'timber' | 'iron' | 'crystal';
export const RESOURCE_IDS: ResourceId[] = ['stone', 'timber', 'iron', 'crystal'];

export type Resources = Record<ResourceId, number>;
export type Cost = Partial<Resources>;

/** Where a set's resource comes from. */
export type TrainingPattern = 'push' | 'pull' | 'legs' | 'core' | 'recovery';

export const PATTERN_RESOURCE: Record<Exclude<TrainingPattern, 'recovery'>, ResourceId> = {
  push: 'stone',
  pull: 'timber',
  legs: 'iron',
  core: 'crystal'
};

export const EMPTY_RESOURCES: Resources = { stone: 0, timber: 0, iron: 0, crystal: 0 };

/** Enough to place a first building and a few decorations right away. */
export const STARTING_RESOURCES: Resources = { stone: 25, timber: 25, iron: 25, crystal: 15 };

// ---------------------------------------------------------------------------
// Plot and headquarters
// ---------------------------------------------------------------------------

export const GRID_SIZE = 10;
export const MAX_HQ_LEVEL = 3;

/** Side length of the buildable square for each HQ level, centred on the plot. */
const BUILDABLE_SIDE_BY_HQ: Record<number, number> = { 1: 6, 2: 8, 3: 10 };

export function buildableBounds(hqLevel: number): { min: number; max: number } {
  const side = BUILDABLE_SIDE_BY_HQ[Math.min(Math.max(hqLevel, 1), MAX_HQ_LEVEL)];
  const min = (GRID_SIZE - side) / 2;
  return { min, max: min + side - 1 };
}

export function isTileBuildable(x: number, y: number, hqLevel: number): boolean {
  const { min, max } = buildableBounds(hqLevel);
  return x >= min && x <= max && y >= min && y <= max;
}

/** HQ sits in the middle of the plot and is always there. */
export const HQ_POSITION = { x: 4, y: 4 };

/**
 * On-target weeks needed before each HQ level (index = level). Base level
 * reflects a habit, not one heavy weekend.
 */
export const HQ_WEEKS_REQUIRED: Record<number, number> = { 1: 0, 2: 2, 3: 6 };

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

export type DecorDef = {
  kind: 'decor';
  id: string;
  size: 1;
  unlockHq: number;
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
      { cost: { stone: 40, timber: 40, iron: 40, crystal: 20 }, sets: 3 },
      { cost: { stone: 90, timber: 90, iron: 90, crystal: 50 }, sets: 5 }
    ]
  },
  {
    kind: 'structure',
    id: 'watchtower',
    size: 1,
    unlockHq: 1,
    maxCount: (hq) => hq,
    levels: [
      { cost: { stone: 15, timber: 10 }, sets: 1 },
      { cost: { stone: 35, timber: 20, crystal: 10 }, sets: 2 },
      { cost: { stone: 60, timber: 40, crystal: 20 }, sets: 3 }
    ]
  },
  {
    kind: 'structure',
    id: 'lodge',
    size: 1,
    unlockHq: 1,
    maxCount: (hq) => hq,
    levels: [
      { cost: { timber: 15, stone: 10 }, sets: 1 },
      { cost: { timber: 35, stone: 20, iron: 10 }, sets: 2 },
      { cost: { timber: 60, stone: 40, iron: 20 }, sets: 3 }
    ]
  },
  {
    kind: 'structure',
    id: 'forge',
    size: 1,
    unlockHq: 1,
    maxCount: () => 1,
    levels: [
      { cost: { iron: 15, stone: 10 }, sets: 1 },
      { cost: { iron: 35, stone: 20, timber: 10 }, sets: 2 },
      { cost: { iron: 60, stone: 40, timber: 20 }, sets: 3 }
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
      { cost: { stone: 10, timber: 10, iron: 10, crystal: 5 }, sets: 2 },
      { cost: { stone: 30, timber: 30, iron: 30, crystal: 15 }, sets: 3 },
      { cost: { stone: 60, timber: 60, iron: 60, crystal: 30 }, sets: 4 }
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
      { cost: { crystal: 45, stone: 30, timber: 15 }, sets: 3 },
      { cost: { crystal: 70, stone: 50, timber: 30 }, sets: 4 }
    ]
  }
];

export const DECOR: DecorDef[] = [
  { kind: 'decor', id: 'path', size: 1, unlockHq: 1, cost: { stone: 2 } },
  { kind: 'decor', id: 'wall', size: 1, unlockHq: 1, cost: { stone: 4 } },
  { kind: 'decor', id: 'pine', size: 1, unlockHq: 1, cost: { timber: 3, crystal: 1 } },
  { kind: 'decor', id: 'lamp', size: 1, unlockHq: 1, cost: { iron: 3, crystal: 2 } },
  { kind: 'decor', id: 'banner', size: 1, unlockHq: 1, cost: { timber: 3, iron: 2 } },
  { kind: 'decor', id: 'garden', size: 1, unlockHq: 1, cost: { crystal: 4 } },
  { kind: 'decor', id: 'fountain', size: 1, unlockHq: 2, cost: { stone: 12, crystal: 10 } }
];

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
