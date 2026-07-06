import { supabase } from './supabase';

const STARTER_WORKOUTS = [
  {
    category_id: 'pushups',
    workout_name: 'Pushups',
    variant_id: 'pushups',
    description: 'Floor. Down. Up. Repeat until death.',
    is_equipped: true,
    sets_completed: 0,
    sort_order: 1
  },
  {
    category_id: 'superman-pulls',
    workout_name: 'Superman Pulls',
    variant_id: 'superman-pulls',
    description: 'Face down, arms forward. Lift chest and legs, pull elbows to hips, extend back out.',
    is_equipped: true,
    sets_completed: 0,
    sort_order: 2
  },
  {
    category_id: 'squats',
    workout_name: 'Squats',
    variant_id: 'squats',
    description: 'Drop it low. Stand up. Cry.',
    is_equipped: true,
    sets_completed: 0,
    sort_order: 3
  },
  {
    category_id: 'lunges',
    workout_name: 'Lunges',
    variant_id: 'lunges',
    description: 'Step forward. Regret it. Step back.',
    is_equipped: true,
    sets_completed: 0,
    sort_order: 4
  },
  {
    category_id: 'planks',
    workout_name: 'Planks',
    variant_id: 'planks',
    description: 'Stare at the floor and think about life.',
    is_equipped: true,
    sets_completed: 0,
    sort_order: 5
  },
  {
    category_id: 'crunches',
    workout_name: 'Crunches',
    variant_id: 'crunches',
    description: 'Pretend you are getting out of bed.',
    is_equipped: true,
    sets_completed: 0,
    sort_order: 6
  },
  {
    category_id: 'incline-pushups',
    workout_name: 'Incline Pushups',
    variant_id: 'incline-pushups',
    description: 'Easier than the floor. We see you, baby mode.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 7
  },
  {
    category_id: 'diamond-pushups',
    workout_name: 'Diamond Pushups',
    variant_id: 'diamond-pushups',
    description: 'Hands together. Tricep destruction.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 8
  },
  {
    category_id: 'inverted-floor-rows',
    workout_name: 'Inverted Floor Rows',
    variant_id: 'inverted-floor-rows',
    description: 'On your back, feet planted. Drive elbows into the floor and lift your upper back.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 9
  },
  {
    category_id: 'doorway-rows',
    workout_name: 'Doorway Rows',
    variant_id: 'doorway-rows',
    description: 'Grab a sturdy door frame, lean back, and pull your chest toward it.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 10
  },
  {
    category_id: 'glute-bridges',
    workout_name: 'Glute Bridges',
    variant_id: 'glute-bridges',
    description: 'Back on the floor. Drive hips up. Squeeze. Lower with shame.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 11
  },
  {
    category_id: 'jump-squats',
    workout_name: 'Jump Squats',
    variant_id: 'jump-squats',
    description: 'Now with extra knee damage.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 12
  },
  {
    category_id: 'bulgarian-splits',
    workout_name: 'Bulgarian Splits',
    variant_id: 'bulgarian-splits',
    description: 'Back foot up. Soul down.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 13
  },
  {
    category_id: 'l-sit',
    workout_name: 'L-Sit',
    variant_id: 'l-sit',
    description: 'Legs out. Hands down. Shake like a leaf.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 14
  },
  {
    category_id: 'side-planks',
    workout_name: 'Side Planks',
    variant_id: 'side-planks',
    description: 'Sideways suffering. Twice the fun.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 15
  },
  {
    category_id: 'leg-raises',
    workout_name: 'Leg Raises',
    variant_id: 'leg-raises',
    description: 'Legs up. Ab cramps incoming.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 16
  },
  {
    category_id: 'hollow-body',
    workout_name: 'Hollow Body Hold',
    variant_id: 'hollow-body',
    description: 'Banana shape. Banana pain.',
    is_equipped: false,
    sets_completed: 0,
    sort_order: 17
  }
] as const;

export async function ensureUserProfileAndWorkouts(
  userId: string,
  displayName?: string | null
): Promise<void> {
  const safeDisplayName = displayName?.trim() || 'Athlete';

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        display_name: safeDisplayName,
        coins: 0,
        current_streak: 0
      },
      { onConflict: 'id' }
    );

  if (profileError) throw profileError;

  const { error: workoutsError } = await supabase.from('user_workouts').upsert(
    STARTER_WORKOUTS.map((workout) => ({
      user_id: userId,
      ...workout
    })),
    { onConflict: 'user_id,category_id' }
  );

  if (workoutsError) throw workoutsError;
}
