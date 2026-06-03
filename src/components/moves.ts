export type Move = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  color: string;
  glow: string;
};

export type Variant = {
  id: string;
  name: string;
  description: string;
  price: number;
  tier: 'BASE' | 'PRO' | 'ELITE';
};

export type MoveCategory = {
  id: string;
  name: string;
  color: string;
  glow: string;
  variants: Variant[];
};

export const MOVE_CATEGORIES: MoveCategory[] = [
{
  id: 'pushups',
  name: 'Pushups',
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
    tier: 'BASE'
  },
  {
    id: 'incline-pushups',
    name: 'Incline Pushups',
    description: 'Easier than the floor. We see you, baby mode.',
    price: 100,
    tier: 'PRO'
  },
  {
    id: 'diamond-pushups',
    name: 'Diamond Pushups',
    description: 'Hands together. Tricep destruction.',
    price: 250,
    tier: 'PRO'
  },
  {
    id: 'archer-pushups',
    name: 'Archer Pushups',
    description: 'One arm in charge. The other vibes.',
    price: 500,
    tier: 'ELITE'
  }]

},
{
  id: 'squats',
  name: 'Squats',
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
    id: 'jump-squats',
    name: 'Jump Squats',
    description: 'Now with extra knee damage.',
    price: 150,
    tier: 'PRO'
  },
  {
    id: 'pistol-squats',
    name: 'Pistol Squats',
    description: 'One leg. Zero dignity.',
    price: 500,
    tier: 'ELITE'
  }]

},
{
  id: 'planks',
  name: 'Planks',
  color:
    'bg-[#00FFFF] text-black dark:bg-[#4DFFFF] dark:text-black',
  glow:
    'border-[#00FFFF] shadow-[0_0_0_1px_#00FFFF,0_0_14px_rgba(0,255,255,0.7),0_0_28px_rgba(0,255,255,0.35)] dark:border-[#4DFFFF] dark:shadow-[0_0_0_1px_#4DFFFF,0_0_18px_rgba(77,255,255,0.8),0_0_36px_rgba(77,255,255,0.45)]',
  variants: [
  {
    id: 'planks',
    name: 'Planks',
    description: 'Stare at the floor and contemplate your life choices.',
    price: 0,
    tier: 'BASE'
  },
  {
    id: 'side-planks',
    name: 'Side Planks',
    description: 'Sideways suffering. Twice the fun.',
    price: 150,
    tier: 'PRO'
  },
  {
    id: 'hollow-body',
    name: 'Hollow Body Hold',
    description: 'Banana shape. Banana pain.',
    price: 400,
    tier: 'ELITE'
  }]

},
{
  id: 'lunges',
  name: 'Lunges',
  color:
    'bg-[#FF4D00] text-black dark:bg-[#FF7733] dark:text-black',
  glow:
    'border-[#FF4D00] shadow-[0_0_0_1px_#FF4D00,0_0_14px_rgba(255,77,0,0.7),0_0_28px_rgba(255,77,0,0.35)] dark:border-[#FF7733] dark:shadow-[0_0_0_1px_#FF7733,0_0_18px_rgba(255,119,51,0.8),0_0_36px_rgba(255,119,51,0.45)]',
  variants: [
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'Step forward. Regret it. Step back.',
    price: 0,
    tier: 'BASE'
  },
  {
    id: 'walking-lunges',
    name: 'Walking Lunges',
    description: 'Now with locomotion. Look at you go.',
    price: 100,
    tier: 'PRO'
  },
  {
    id: 'bulgarian-splits',
    name: 'Bulgarian Splits',
    description: 'Back foot up. Soul down.',
    price: 350,
    tier: 'ELITE'
  }]

},
{
  id: 'crunches',
  name: 'Crunches',
  color:
    'bg-[#9D00FF] text-black dark:bg-[#C266FF] dark:text-black',
  glow:
    'border-[#9D00FF] shadow-[0_0_0_1px_#9D00FF,0_0_14px_rgba(157,0,255,0.7),0_0_28px_rgba(157,0,255,0.35)] dark:border-[#C266FF] dark:shadow-[0_0_0_1px_#C266FF,0_0_18px_rgba(194,102,255,0.8),0_0_36px_rgba(194,102,255,0.45)]',
  variants: [
  {
    id: 'crunches',
    name: 'Crunches',
    description: 'Pretend you are getting out of bed.',
    price: 0,
    tier: 'BASE'
  },
  {
    id: 'leg-raises',
    name: 'Leg Raises',
    description: 'Legs up. Ab cramps incoming.',
    price: 150,
    tier: 'PRO'
  },
  {
    id: 'v-ups',
    name: 'V-Ups',
    description: 'Fold like a beach chair.',
    price: 400,
    tier: 'ELITE'
  }]

}];


// Resolve an equipped variant + category color into a renderable Move
export function resolveMove(category: MoveCategory, variantId: string): Move {
  const variant =
  category.variants.find((v) => v.id === variantId) ?? category.variants[0];
  return {
    id: variant.id,
    categoryId: category.id,
    name: variant.name,
    description: variant.description,
    color: category.color,
    glow: category.glow
  };
}

export const SHADY_QUOTES = [
"The floor misses you. Don't let your streak rot.",
'Are pushups feeling mid? Level up or stay a loser.',
'You call that failure? My grandma fails harder.',
"I've seen more effort from a dead battery.",
"Wow, you actually showed up. I'm shocked.",
"Failure is the only option. And you're great at it."];


export const BUTTON_LABELS = [
"I'M COOKED",
'LITERALLY DYING',
"I CAN'T ANYMORE",
'MY SOUL LEFT',
'END MY SUFFERING'];