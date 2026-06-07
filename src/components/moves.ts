export type MovementPattern = 'push' | 'pull';

export type LineupSlot = 'upper' | 'lower' | 'core';

export type Move = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  muscleGroup: string;
  displayGroup: string;
  lineupSlot: LineupSlot;
  pattern?: MovementPattern;
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
    'bg-[#CCFF00] text-black dark:bg-[#C8E838] dark:text-black',
  glow:
    'border-[#CCFF00] shadow-[0_0_0_1px_#CCFF00,0_0_14px_rgba(204,255,0,0.7),0_0_28px_rgba(204,255,0,0.35)] dark:border-[#C8E838] dark:shadow-[0_0_0_1px_#C8E838,0_0_18px_rgba(200,232,56,0.85),0_0_36px_rgba(200,232,56,0.5)]',
  variants: [
    {
      id: 'pushups',
      name: 'Pushups',
      description: 'Floor. Down. Up. Repeat until death.',
      price: 0,
      tier: 'BASE',
      pattern: 'push'
    },
    {
      id: 'incline-pushups',
      name: 'Incline Pushups',
      description: 'Easier than the floor. We see you, baby mode.',
      price: 100,
      tier: 'PRO',
      pattern: 'push'
    },
    {
      id: 'diamond-pushups',
      name: 'Diamond Pushups',
      description: 'Hands together. Tricep destruction.',
      price: 250,
      tier: 'PRO',
      pattern: 'push'
    },
    {
      id: 'superman-pulls',
      name: 'Superman Pulls',
      description: "You're meant to be Clark anyway.",
      price: 0,
      tier: 'BASE',
      pattern: 'pull'
    },
    {
      id: 'inverted-floor-rows',
      name: 'Inverted Floor Rows',
      description:
        'On your back, feet planted. Drive elbows into the floor and lift your upper back.',
      price: 100,
      tier: 'PRO',
      pattern: 'pull'
    },
    {
      id: 'doorway-rows',
      name: 'Doorway Rows',
      description:
        'Grab a sturdy door frame, lean back, and pull your chest toward it.',
      price: 150,
      tier: 'PRO',
      pattern: 'pull'
    }
  ]
};

export const LOWER_STORE_CATEGORY: MoveCategory = {
  id: 'lower',
  name: 'Lower Body',
  muscleGroup: 'lower body',
  equipHint: 'Equip 2 lower body exercises for your daily lineup.',
  color:
    'bg-[#FF00FF] text-black dark:bg-[#FF66FF] dark:text-black',
  glow:
    'border-[#FF00FF] shadow-[0_0_0_1px_#FF00FF,0_0_14px_rgba(255,0,255,0.7),0_0_28px_rgba(255,0,255,0.35)] dark:border-[#FF66FF] dark:shadow-[0_0_0_1px_#FF66FF,0_0_18px_rgba(255,102,255,0.8),0_0_36px_rgba(255,102,255,0.45)]',
  variants: [
    {
      id: 'squats',
      name: 'Squats',
      description: 'Drop it low. Stand up. Cry.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'lunges',
      name: 'Lunges',
      description: 'Step forward. Regret it. Step back.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'glute-bridges',
      name: 'Glute Bridges',
      description: 'Back on the floor. Drive hips up. Squeeze. Lower with shame.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'jump-squats',
      name: 'Jump Squats',
      description: 'Now with extra knee damage.',
      price: 150,
      tier: 'PRO'
    },
    {
      id: 'bulgarian-splits',
      name: 'Bulgarian Splits',
      description: 'Back foot up. Soul down.',
      price: 350,
      tier: 'ELITE'
    }
  ]
};

export const CORE_STORE_CATEGORY: MoveCategory = {
  id: 'core',
  name: 'Core',
  muscleGroup: 'core',
  equipHint: 'Equip 2 core exercises for your daily lineup.',
  color:
    'bg-[#00FFFF] text-black dark:bg-[#4DFFFF] dark:text-black',
  glow:
    'border-[#00FFFF] shadow-[0_0_0_1px_#00FFFF,0_0_14px_rgba(0,255,255,0.7),0_0_28px_rgba(0,255,255,0.35)] dark:border-[#4DFFFF] dark:shadow-[0_0_0_1px_#4DFFFF,0_0_18px_rgba(77,255,255,0.8),0_0_36px_rgba(77,255,255,0.45)]',
  variants: [
    {
      id: 'planks',
      name: 'Planks',
      description: 'Stare at the floor and think about life.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'crunches',
      name: 'Crunches',
      description: 'Pretend you are getting out of bed.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'l-sit',
      name: 'L-Sit',
      description: 'Legs out. Hands down. Shake like a leaf.',
      price: 150,
      tier: 'PRO'
    },
    {
      id: 'side-planks',
      name: 'Side Planks',
      description: 'Sideways suffering. Twice the fun.',
      price: 150,
      tier: 'PRO'
    },
    {
      id: 'leg-raises',
      name: 'Leg Raises',
      description: 'Legs up. Ab cramps incoming.',
      price: 150,
      tier: 'PRO'
    },
    {
      id: 'hollow-body',
      name: 'Hollow Body Hold',
      description: 'Banana shape. Banana pain.',
      price: 400,
      tier: 'ELITE'
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

const ALL_VARIANTS = STORE_CATEGORIES.flatMap((cat) => cat.variants);

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

export function getLineupSlot(id: string): LineupSlot | null {
  if (isUpperExerciseId(id)) return 'upper';
  if (isLowerExerciseId(id)) return 'lower';
  if (isCoreExerciseId(id)) return 'core';
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
  'pushups',
  'incline-pushups',
  'diamond-pushups',
  'superman-pulls',
  'doorway-rows',
  'squats',
  'jump-squats',
  'lunges',
  'glute-bridges',
  'bulgarian-splits',
  'crunches',
  'leg-raises'
]);

export function isRepLoggedCategory(categoryId: string): boolean {
  return REP_LOGGED_CATEGORY_IDS.has(categoryId);
}

export function getAllWorkoutCategoryIds(): string[] {
  return ALL_VARIANTS.map((variant) => variant.id);
}

function getStoreCategoryForExercise(id: string): MoveCategory | undefined {
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

export const SHADY_QUOTES = [
  "The floor misses you. Don't let your streak rot.",
  'Are pushups feeling mid? Level up or stay a loser.',
  'You call that failure? My grandma fails harder.',
  "I've seen more effort from a dead battery.",
  "Wow, you actually showed up. I'm shocked.",
  "Failure is the only option. And you're great at it."
];

export const BUTTON_LABELS = [
  "I'M COOKED",
  'LITERALLY DYING',
  "I CAN'T ANYMORE",
  'MY SOUL LEFT',
  'END MY SUFFERING'
];
