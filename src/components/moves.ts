export type MovementPattern = 'push' | 'pull';

/**
 * Gear that exists almost anywhere: a park pull-up bar, park dip bars (or two
 * sturdy chairs), a bench/step/stair, and a backpack you can load with books
 * or water bottles. No gym equipment.
 */
export type AnywhereEquipment = 'bar' | 'dipBars' | 'bench' | 'backpack';
/** @deprecated Use AnywhereEquipment */
export type HomeGymEquipment = AnywhereEquipment;

export type LineupSlot = 'upper' | 'lower' | 'core' | 'recovery';

export type Move = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  muscleGroup: string;
  displayGroup: string;
  lineupSlot: LineupSlot;
  pattern?: MovementPattern;
  tier?: 'BASE' | 'PRO' | 'ELITE';
  color: string;
  glow: string;
};

export type Variant = {
  id: string;
  name: string;
  description: string;
  price: number;
  tier: 'BASE' | 'PRO' | 'ELITE';
  pattern?: MovementPattern;
  equipment?: readonly AnywhereEquipment[];
  /**
   * Top of the useful rep range. Past this, the set is mostly endurance work
   * and the app suggests a harder variation (or adding load).
   */
  repCeiling?: number;
  /** Same idea for timed holds, in seconds. */
  holdCeilingSeconds?: number;
  /** Harder variations to move to next, easiest first. */
  levelUp?: readonly string[];
};

export type MoveCategory = {
  id: LineupSlot;
  name: string;
  muscleGroup: string;
  color: string;
  glow: string;
  variants: Variant[];
  equipHint?: string;
};

export const LINEUP_EQUIP_COUNT = 2;

export const UPPER_STORE_CATEGORY: MoveCategory = {
  id: 'upper',
  name: 'Upper Body',
  muscleGroup: 'upper body',
  equipHint: 'Equip 1 Push + 1 Pull for balanced upper body work.',
  color:
    'bg-[#C8F032] text-black dark:bg-[#C8E838] dark:text-black',
  glow:
    'border-[#7AB800] shadow-[4px_4px_0_0_#7AB800,0_0_20px_rgba(200,240,50,0.45)] dark:border-[#C8E838] dark:shadow-[0_0_0_1px_#C8E838,0_0_18px_rgba(200,232,56,0.85),0_0_36px_rgba(200,232,56,0.5)]',
  variants: [
    // Push ladder (easiest → hardest)
    {
      id: 'incline-pushups',
      name: 'Incline Pushups',
      description: 'Hands on a bench, wall or step. The easiest way into pushups.',
      price: 0,
      tier: 'BASE',
      pattern: 'push',
      equipment: ['bench'],
      repCeiling: 20,
      levelUp: ['pushups']
    },
    {
      id: 'pushups',
      name: 'Pushups',
      description: 'Work up to 100 total reps across your sets on push day.',
      price: 0,
      tier: 'BASE',
      pattern: 'push',
      repCeiling: 20,
      levelUp: ['diamond-pushups', 'backpack-pushups']
    },
    {
      id: 'pike-pushups',
      name: 'Pike Pushups',
      description: 'Hips high, lower your head between your hands. Builds strong shoulders.',
      price: 150,
      tier: 'PRO',
      pattern: 'push',
      repCeiling: 15,
      levelUp: ['archer-pushups']
    },
    {
      id: 'diamond-pushups',
      name: 'Diamond Pushups',
      description: 'Hands together under your chest. Hits triceps and inner chest hard.',
      price: 200,
      tier: 'PRO',
      pattern: 'push',
      repCeiling: 15,
      levelUp: ['archer-pushups', 'backpack-pushups']
    },
    {
      id: 'dips',
      name: 'Dips',
      description: 'On park dip bars or two sturdy chairs. Lower until your shoulders pass your elbows.',
      price: 250,
      tier: 'PRO',
      pattern: 'push',
      equipment: ['dipBars'],
      repCeiling: 15,
      levelUp: ['backpack-pushups']
    },
    {
      id: 'backpack-pushups',
      name: 'Backpack Pushups',
      description: 'Pushups wearing a loaded backpack. Add books or water bottles as you get stronger.',
      price: 300,
      tier: 'PRO',
      pattern: 'push',
      equipment: ['backpack']
    },
    {
      id: 'archer-pushups',
      name: 'Archer Pushups',
      description: 'Wide hands, shift onto one arm while the other stays straight. Alternate sides.',
      price: 450,
      tier: 'ELITE',
      pattern: 'push',
      repCeiling: 10
    },
    // Pull ladder (easiest → hardest)
    {
      id: 'superman-pulls',
      name: 'Superman Pulls',
      description: 'Face down, lift your chest and pull your elbows to your hips.',
      price: 0,
      tier: 'BASE',
      pattern: 'pull',
      repCeiling: 20,
      levelUp: ['doorway-rows', 'inverted-rows']
    },
    {
      id: 'doorway-rows',
      name: 'Doorway Rows',
      description: 'Grip a sturdy door frame, lean back, and pull your chest to it.',
      price: 0,
      tier: 'BASE',
      pattern: 'pull',
      repCeiling: 20,
      levelUp: ['inverted-rows']
    },
    {
      id: 'inverted-floor-rows',
      name: 'Inverted Floor Rows',
      description: 'On your back, feet planted. Drive your elbows down to lift your upper back.',
      price: 50,
      tier: 'BASE',
      pattern: 'pull',
      repCeiling: 20,
      levelUp: ['inverted-rows']
    },
    {
      id: 'inverted-rows',
      name: 'Inverted Rows',
      description: 'Hang under a low park bar, body straight, and pull your chest to it. Walk your feet in to make it easier.',
      price: 150,
      tier: 'PRO',
      pattern: 'pull',
      equipment: ['bar'],
      repCeiling: 15,
      levelUp: ['negative-pull-ups', 'chin-ups']
    },
    {
      id: 'negative-pull-ups',
      name: 'Negative Pull-Ups',
      description: 'Jump to the top of the bar, then lower yourself slowly over 3–5 seconds. The fastest way to your first pull-up.',
      price: 200,
      tier: 'PRO',
      pattern: 'pull',
      equipment: ['bar'],
      repCeiling: 8,
      levelUp: ['chin-ups', 'pull-ups']
    },
    {
      id: 'chin-ups',
      name: 'Chin-Ups',
      description: 'Palms facing you, pull until your chin clears the bar. A little easier than pull-ups.',
      price: 250,
      tier: 'PRO',
      pattern: 'pull',
      equipment: ['bar'],
      repCeiling: 12,
      levelUp: ['pull-ups']
    },
    {
      id: 'pull-ups',
      name: 'Pull-Ups',
      description: 'Palms facing away, dead hang to chin over the bar. No kipping.',
      price: 350,
      tier: 'ELITE',
      pattern: 'pull',
      equipment: ['bar'],
      repCeiling: 12,
      levelUp: ['backpack-pull-ups']
    },
    {
      id: 'backpack-pull-ups',
      name: 'Backpack Pull-Ups',
      description: 'Pull-ups wearing a loaded backpack, straps tight. Start light and add a little each week.',
      price: 500,
      tier: 'ELITE',
      pattern: 'pull',
      equipment: ['bar', 'backpack']
    }
  ]
};

export const LOWER_STORE_CATEGORY: MoveCategory = {
  id: 'lower',
  name: 'Lower Body',
  muscleGroup: 'lower body',
  equipHint: 'Equip 2 lower body exercises for your daily lineup.',
  color:
    'bg-[#FF66EE] text-black dark:bg-[#FF66FF] dark:text-black',
  glow:
    'border-[#E040C8] shadow-[4px_4px_0_0_#E040C8,0_0_20px_rgba(255,102,238,0.45)] dark:border-[#FF66FF] dark:shadow-[0_0_0_1px_#FF66FF,0_0_18px_rgba(255,102,255,0.8),0_0_36px_rgba(255,102,255,0.45)]',
  variants: [
    {
      id: 'squats',
      name: 'Squats',
      description: 'Bodyweight air squats with a deep drop and steady pace.',
      price: 0,
      tier: 'BASE',
      repCeiling: 25,
      levelUp: ['bulgarian-splits', 'backpack-squats']
    },
    {
      id: 'lunges',
      name: 'Lunges',
      description: 'Step forward into a deep lunge, then return to standing.',
      price: 0,
      tier: 'BASE',
      repCeiling: 20,
      levelUp: ['step-ups', 'bulgarian-splits']
    },
    {
      id: 'glute-bridges',
      name: 'Glute Bridges',
      description: 'Drive hips up from the floor, squeeze glutes, and lower slowly.',
      price: 0,
      tier: 'BASE',
      repCeiling: 25,
      levelUp: ['single-leg-bridges']
    },
    {
      id: 'step-ups',
      name: 'Step-Ups',
      description: 'Step onto a park bench or stair and drive up through the front heel.',
      price: 100,
      tier: 'BASE',
      equipment: ['bench'],
      repCeiling: 20,
      levelUp: ['bulgarian-splits']
    },
    {
      id: 'single-leg-bridges',
      name: 'Single-Leg Bridges',
      description: 'Glute bridge on one leg, other knee pulled in. Switch sides each set.',
      price: 150,
      tier: 'PRO',
      repCeiling: 20
    },
    {
      id: 'jump-squats',
      name: 'Jump Squats',
      description: 'Squat down and jump as high as you can. Land soft.',
      price: 150,
      tier: 'PRO',
      repCeiling: 20,
      levelUp: ['bulgarian-splits']
    },
    {
      id: 'burpees',
      name: 'Burpees',
      description: 'Drop to the floor, kick back, and hop up in one crisp motion.',
      price: 150,
      tier: 'PRO',
      repCeiling: 25
    },
    {
      id: 'bulgarian-splits',
      name: 'Bulgarian Splits',
      description: 'Rear foot on a bench, squat as deep as you can with control.',
      price: 250,
      tier: 'PRO',
      equipment: ['bench'],
      repCeiling: 15,
      levelUp: ['pistol-squats', 'backpack-squats']
    },
    {
      id: 'backpack-squats',
      name: 'Backpack Squats',
      description: 'Squats wearing a loaded backpack (or hugging it to your chest).',
      price: 250,
      tier: 'PRO',
      equipment: ['backpack']
    },
    {
      id: 'pistol-squats',
      name: 'Pistol Squats',
      description: 'One-leg squat all the way down. Hold a pole or post until you own the balance.',
      price: 500,
      tier: 'ELITE',
      repCeiling: 10
    }
  ]
};

export const CORE_STORE_CATEGORY: MoveCategory = {
  id: 'core',
  name: 'Core',
  muscleGroup: 'core',
  equipHint: 'Equip 2 core exercises for your daily lineup.',
  color:
    'bg-[#38E8E8] text-black dark:bg-[#4DFFFF] dark:text-black',
  glow:
    'border-[#18C0C0] shadow-[4px_4px_0_0_#18C0C0,0_0_20px_rgba(56,232,232,0.45)] dark:border-[#4DFFFF] dark:shadow-[0_0_0_1px_#4DFFFF,0_0_18px_rgba(77,255,255,0.8),0_0_36px_rgba(77,255,255,0.45)]',
  variants: [
    {
      id: 'planks',
      name: 'Planks',
      description: 'Hold 60–90 seconds with glutes and core braced tight.',
      price: 0,
      tier: 'BASE',
      holdCeilingSeconds: 90,
      levelUp: ['hollow-body', 'side-planks']
    },
    {
      id: 'crunches',
      name: 'Crunches',
      description: 'Curl up like a little sit-up.',
      price: 0,
      tier: 'BASE',
      repCeiling: 25,
      levelUp: ['leg-raises']
    },
    {
      id: 'side-planks',
      name: 'Side Planks',
      description: 'Hold a strong plank on your side. Both sides count as one set.',
      price: 100,
      tier: 'PRO',
      holdCeilingSeconds: 60
    },
    {
      id: 'leg-raises',
      name: 'Leg Raises',
      description: 'On your back, raise straight legs slowly and lower with control.',
      price: 150,
      tier: 'PRO',
      repCeiling: 20,
      levelUp: ['hanging-knee-raises']
    },
    {
      id: 'hollow-body',
      name: 'Hollow Body Hold',
      description: 'Hold a tight banana-shaped hollow body position.',
      price: 200,
      tier: 'PRO',
      holdCeilingSeconds: 60,
      levelUp: ['l-sit']
    },
    {
      id: 'hanging-knee-raises',
      name: 'Hanging Knee Raises',
      description: 'Hang from a park bar and pull your knees to your chest without swinging.',
      price: 250,
      tier: 'PRO',
      equipment: ['bar'],
      repCeiling: 15,
      levelUp: ['hanging-leg-raises']
    },
    {
      id: 'l-sit',
      name: 'L-Sit',
      description: 'On dip bars or the floor, legs locked out and hips lifted. Max hold.',
      price: 350,
      tier: 'ELITE',
      equipment: ['dipBars'],
      holdCeilingSeconds: 30
    },
    {
      id: 'hanging-leg-raises',
      name: 'Hanging Leg Raises',
      description: 'Hang from a bar and lift straight legs to hip height or higher.',
      price: 450,
      tier: 'ELITE',
      equipment: ['bar'],
      repCeiling: 12
    }
  ]
};

export const RECOVERY_STORE_CATEGORY: MoveCategory = {
  id: 'recovery',
  name: 'Recovery',
  muscleGroup: 'recovery',
  equipHint: 'Deep stretching on rest days — no lifting.',
  color:
    'bg-[#C8B0FF] text-black dark:bg-[#C4B8FF] dark:text-black',
  glow:
    'border-[#9070E0] shadow-[4px_4px_0_0_#9070E0,0_0_20px_rgba(200,176,255,0.45)] dark:border-[#C4B8FF] dark:shadow-[0_0_0_1px_#C4B8FF,0_0_18px_rgba(196,184,255,0.8),0_0_36px_rgba(196,184,255,0.45)]',
  variants: [
    {
      id: 'cobra-stretch',
      name: 'Cobra Stretch',
      description: 'Hold 45 seconds to open the chest and abdominal wall.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'childs-pose',
      name: "Child's Pose",
      description: 'Hold 60 seconds to decompress the lower back and shoulders.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'couch-stretch',
      name: 'Couch Stretch',
      description: 'Hold 60 seconds per side to open hips and quads.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'seated-hamstring-stretch',
      name: 'Seated Hamstring Stretch',
      description: 'Hold 45 seconds per leg for hamstring length and squat depth.',
      price: 0,
      tier: 'BASE'
    }
  ]
};

export const STORE_CATEGORIES: MoveCategory[] = [
  UPPER_STORE_CATEGORY,
  LOWER_STORE_CATEGORY,
  CORE_STORE_CATEGORY
];

/** @deprecated Use LINEUP_EQUIP_COUNT */
export const CORE_EQUIP_COUNT = LINEUP_EQUIP_COUNT;

export const DEFAULT_EQUIPPED_UPPER = ['pushups', 'superman-pulls'] as const;
export const DEFAULT_EQUIPPED_LOWER = ['squats', 'lunges'] as const;
export const DEFAULT_EQUIPPED_CORE = ['planks', 'crunches'] as const;

export const DEFAULT_LINEUP = {
  upper: [...DEFAULT_EQUIPPED_UPPER],
  lower: [...DEFAULT_EQUIPPED_LOWER],
  core: [...DEFAULT_EQUIPPED_CORE]
} as const;

const ALL_VARIANTS = [
  ...STORE_CATEGORIES.flatMap((cat) => cat.variants),
  ...RECOVERY_STORE_CATEGORY.variants
];

export function getVariantById(id: string): Variant | undefined {
  return ALL_VARIANTS.find((variant) => variant.id === id);
}

export function isUpperExerciseId(id: string): boolean {
  return UPPER_STORE_CATEGORY.variants.some((variant) => variant.id === id);
}

export function isLowerExerciseId(id: string): boolean {
  return LOWER_STORE_CATEGORY.variants.some((variant) => variant.id === id);
}

export function isCoreExerciseId(id: string): boolean {
  return CORE_STORE_CATEGORY.variants.some((variant) => variant.id === id);
}

export function isRecoveryExerciseId(id: string): boolean {
  return RECOVERY_STORE_CATEGORY.variants.some((variant) => variant.id === id);
}

export function getLineupSlot(id: string): LineupSlot | null {
  if (isUpperExerciseId(id)) return 'upper';
  if (isLowerExerciseId(id)) return 'lower';
  if (isCoreExerciseId(id)) return 'core';
  if (isRecoveryExerciseId(id)) return 'recovery';
  return null;
}

export function getUpperDisplayGroup(pattern: MovementPattern): string {
  return pattern === 'push' ? 'upperbody push' : 'upperbody pull';
}

function getLineupDisplayGroup(
  slot: LineupSlot,
  pattern?: MovementPattern
): string {
  if (slot === 'upper' && pattern) return getUpperDisplayGroup(pattern);
  if (slot === 'lower') return 'lowerbody';
  if (slot === 'recovery') return 'stretching';
  return 'core';
}

export function getVariantPattern(id: string): MovementPattern | null {
  return getVariantById(id)?.pattern ?? null;
}

export function hasBalancedUpperSelection(ids: string[]): boolean {
  const patterns = ids
    .map(getVariantPattern)
    .filter((pattern): pattern is MovementPattern => pattern !== null);
  return (
    patterns.length === LINEUP_EQUIP_COUNT &&
    patterns.includes('push') &&
    patterns.includes('pull')
  );
}

export function canEquipUpperExercise(
  equipped: string[],
  exerciseId: string
): boolean {
  if (!isUpperExerciseId(exerciseId)) return false;
  if (equipped.includes(exerciseId)) return true;

  const nextPattern = getVariantPattern(exerciseId);
  if (!nextPattern) return false;
  if (equipped.length >= LINEUP_EQUIP_COUNT) return false;
  if (equipped.length === 0) return true;

  const currentPattern = getVariantPattern(equipped[0]);
  return currentPattern !== null && currentPattern !== nextPattern;
}

/** Categories where sets are counted in reps (not time holds). */
export const REP_LOGGED_CATEGORY_IDS = new Set([
  'incline-pushups',
  'pushups',
  'pike-pushups',
  'diamond-pushups',
  'dips',
  'archer-pushups',
  'superman-pulls',
  'doorway-rows',
  'inverted-floor-rows',
  'inverted-rows',
  'negative-pull-ups',
  'chin-ups',
  'pull-ups',
  'squats',
  'lunges',
  'glute-bridges',
  'step-ups',
  'single-leg-bridges',
  'jump-squats',
  'burpees',
  'bulgarian-splits',
  'pistol-squats',
  'crunches',
  'leg-raises',
  'hanging-knee-raises',
  'hanging-leg-raises'
]);

export function isRepLoggedCategory(categoryId: string): boolean {
  return REP_LOGGED_CATEGORY_IDS.has(categoryId);
}

/** Loaded (backpack) exercises that log weight × reps after each set. */
export function isWeightedEquipmentCategory(categoryId: string): boolean {
  return getVariantById(categoryId)?.equipment?.includes('backpack') ?? false;
}

export type LevelUpAdvice = {
  /** Why the set is past its useful range. */
  kind: 'reps' | 'hold';
  /** Harder variations to try, easiest first. */
  nextIds: string[];
};

/**
 * When a bodyweight set goes past the top of its useful range (e.g. 50
 * pushups), suggest a harder variation. Loaded variants progress by weight
 * instead, so they never get this advice.
 */
export function getLevelUpAdvice(
  categoryId: string,
  reps: number | null | undefined,
  durationSeconds: number
): LevelUpAdvice | null {
  const variant = getVariantById(categoryId);
  if (!variant || isWeightedEquipmentCategory(categoryId)) return null;
  const nextIds = [...(variant.levelUp ?? [])];

  if (variant.repCeiling && reps && reps > variant.repCeiling) {
    return { kind: 'reps', nextIds };
  }
  if (variant.holdCeilingSeconds && durationSeconds > variant.holdCeilingSeconds) {
    return { kind: 'hold', nextIds };
  }
  return null;
}

export function getAllWorkoutCategoryIds(): string[] {
  return ALL_VARIANTS.map((variant) => variant.id);
}

function getStoreCategoryForExercise(id: string): MoveCategory | undefined {
  if (isRecoveryExerciseId(id)) return RECOVERY_STORE_CATEGORY;
  return STORE_CATEGORIES.find((cat) =>
    cat.variants.some((variant) => variant.id === id)
  );
}

export function resolveLineupMove(exerciseId: string): Move {
  const category = getStoreCategoryForExercise(exerciseId);
  const variant =
    getVariantById(exerciseId) ??
    UPPER_STORE_CATEGORY.variants[0];

  const slot = category?.id ?? 'upper';
  const displayGroup = getLineupDisplayGroup(slot, variant.pattern);

  return {
    id: variant.id,
    categoryId: variant.id,
    name: variant.name,
    description: variant.description,
    muscleGroup: category?.muscleGroup ?? 'full body',
    displayGroup,
    lineupSlot: slot,
    pattern: variant.pattern,
    tier: variant.tier,
    color: category?.color ?? UPPER_STORE_CATEGORY.color,
    glow: category?.glow ?? UPPER_STORE_CATEGORY.glow
  };
}

/** @deprecated Use resolveLineupMove */
export function resolveCoreMove(exerciseId: string): Move {
  return resolveLineupMove(exerciseId);
}

/** @deprecated Use resolveLineupMove */
export function resolveMove(_category: MoveCategory, variantId: string): Move {
  return resolveLineupMove(variantId);
}

export function resolveMoveById(moveId: string): Move | null {
  if (!getVariantById(moveId)) return null;
  return resolveLineupMove(moveId);
}

export const BUTTON_LABELS = [
  "I'M DONE",
  "CAN'T DO MORE",
  'ALL TIRED OUT',
  'NEED A BREAK',
  'FINISH SET'
];
