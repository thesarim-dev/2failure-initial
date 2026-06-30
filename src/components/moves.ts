export type MovementPattern = 'push' | 'pull';

export type HomeGymEquipment = 'dumbbell' | 'barbell' | 'bench';

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
  equipment?: readonly HomeGymEquipment[];
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
    {
      id: 'pushups',
      name: 'Pushups',
      description: 'Work up to 100 total reps across your sets on push day.',
      price: 0,
      tier: 'BASE',
      pattern: 'push'
    },
    {
      id: 'incline-pushups',
      name: 'Incline Pushups',
      description: 'Push up with your hands elevated on a bench or step.',
      price: 100,
      tier: 'PRO',
      pattern: 'push'
    },
    {
      id: 'diamond-pushups',
      name: 'Diamond Pushups',
      description: 'Hands together. Super tricep workout.',
      price: 250,
      tier: 'PRO',
      pattern: 'push'
    },
    {
      id: 'superman-pulls',
      name: 'Superman Pulls',
      description: 'Lift your chest off the floor like Superman flying.',
      price: 0,
      tier: 'BASE',
      pattern: 'pull'
    },
    {
      id: 'inverted-floor-rows',
      name: 'Inverted Floor Rows',
      description:
        'Row from the floor on your back with your feet planted.',
      price: 100,
      tier: 'PRO',
      pattern: 'pull'
    },
    {
      id: 'doorway-rows',
      name: 'Doorway Rows',
      description: 'Row your chest to a sturdy door frame while leaning back.',
      price: 150,
      tier: 'PRO',
      pattern: 'pull'
    },
    {
      id: 'dumbbell-shoulder-press',
      name: 'Dumbbell Shoulder Press',
      description:
        'Press both dumbbells overhead. Stop when your shoulders give out.',
      price: 0,
      tier: 'BASE',
      pattern: 'push',
      equipment: ['dumbbell']
    },
    {
      id: 'dumbbell-row',
      name: 'Dumbbell Row',
      description:
        'Hinge at the hips. Pull each dumbbell to your hip. Full stretch, full squeeze.',
      price: 0,
      tier: 'BASE',
      pattern: 'pull',
      equipment: ['dumbbell']
    },
    {
      id: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      description: 'Heavy 3x5 with the bar touching your chest each rep.',
      price: 0,
      tier: 'BASE',
      pattern: 'push',
      equipment: ['barbell', 'bench']
    },
    {
      id: 'dips',
      name: 'Dips',
      description: 'Deep dip on bars or benches, then press up.',
      price: 0,
      tier: 'BASE',
      pattern: 'push',
      equipment: ['bench']
    },
    {
      id: 'pull-ups',
      name: 'Pull-Ups',
      description: 'Hang from a bar and pull until your chin clears it.',
      price: 0,
      tier: 'BASE',
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
    'bg-[#FF66EE] text-black dark:bg-[#FF66FF] dark:text-black',
  glow:
    'border-[#E040C8] shadow-[4px_4px_0_0_#E040C8,0_0_20px_rgba(255,102,238,0.45)] dark:border-[#FF66FF] dark:shadow-[0_0_0_1px_#FF66FF,0_0_18px_rgba(255,102,255,0.8),0_0_36px_rgba(255,102,255,0.45)]',
  variants: [
    {
      id: 'squats',
      name: 'Squats',
      description: 'Bodyweight air squats with a deep drop and steady pace.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'lunges',
      name: 'Lunges',
      description: 'Step forward into a deep lunge, then return to standing.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'glute-bridges',
      name: 'Glute Bridges',
      description: 'Drive hips up from the floor, squeeze glutes, and lower slowly.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'jump-squats',
      name: 'Jump Squats',
      description: 'Squat down and hop back up for extra power.',
      price: 150,
      tier: 'PRO'
    },
    {
      id: 'bulgarian-splits',
      name: 'Bulgarian Splits',
      description: 'Rear foot elevated, squat as deep as you can with control.',
      price: 350,
      tier: 'ELITE'
    },
    {
      id: 'barbell-deadlift',
      name: 'Barbell Deadlift',
      description: 'Hinge and lift the bar, then lower with control each rep.',
      price: 0,
      tier: 'BASE',
      equipment: ['barbell']
    },
    {
      id: 'barbell-squat',
      name: 'Barbell Squat',
      description: 'Heavy 3x5 squat breaking parallel each rep.',
      price: 0,
      tier: 'BASE',
      equipment: ['barbell']
    },
    {
      id: 'burpees',
      name: 'Burpees',
      description: 'Drop to the floor, kick back, and hop up in one crisp motion.',
      price: 0,
      tier: 'BASE'
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
      tier: 'BASE'
    },
    {
      id: 'crunches',
      name: 'Crunches',
      description: 'Curl up like a little sit-up.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'l-sit',
      name: 'L-Sit',
      description: 'Max hold with legs locked out and hips lifted off the floor.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'side-planks',
      name: 'Side Planks',
      description: 'Hold a strong plank on your side.',
      price: 150,
      tier: 'PRO'
    },
    {
      id: 'leg-raises',
      name: 'Leg Raises',
      description: 'Raise your legs slow and lower with control.',
      price: 0,
      tier: 'BASE'
    },
    {
      id: 'hollow-body',
      name: 'Hollow Body Hold',
      description: 'Hold a tight banana-shaped hollow body position.',
      price: 400,
      tier: 'ELITE'
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
  'pushups',
  'incline-pushups',
  'diamond-pushups',
  'superman-pulls',
  'doorway-rows',
  'dumbbell-shoulder-press',
  'dumbbell-row',
  'barbell-bench-press',
  'dips',
  'pull-ups',
  'squats',
  'jump-squats',
  'lunges',
  'glute-bridges',
  'bulgarian-splits',
  'barbell-deadlift',
  'barbell-squat',
  'burpees',
  'crunches',
  'leg-raises'
]);

export function isRepLoggedCategory(categoryId: string): boolean {
  return REP_LOGGED_CATEGORY_IDS.has(categoryId);
}

/** Barbell or dumbbell exercises that should log weight after each set. */
export function isWeightedEquipmentCategory(categoryId: string): boolean {
  const variant = getVariantById(categoryId);
  if (!variant?.equipment?.length) return false;
  return variant.equipment.some(
    (item) => item === 'barbell' || item === 'dumbbell'
  );
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
