-- Fix new-user onboarding trigger so signup no longer fails on invalid starter workout values

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'user_name',
    split_part(coalesce(new.email, ''), '@', 1),
    'Athlete'
  );

  insert into public.profiles (id, display_name, coins, current_streak)
  values (new.id, v_display_name, 0, 0)
  on conflict (id) do nothing;

  insert into public.user_workouts (
    user_id,
    category_id,
    workout_name,
    variant_id,
    description,
    is_equipped,
    sets_completed,
    sort_order
  )
  values
    (new.id, 'pushups', 'Pushups', 'pushups', 'Floor. Down. Up. Repeat until death.', true, 0, 1),
    (new.id, 'superman-pulls', 'Superman Pulls', 'superman-pulls', 'Face down, arms forward. Lift chest and legs, pull elbows to hips, extend back out.', true, 0, 2),
    (new.id, 'squats', 'Squats', 'squats', 'Drop it low. Stand up. Cry.', true, 0, 3),
    (new.id, 'lunges', 'Lunges', 'lunges', 'Step forward. Regret it. Step back.', true, 0, 4),
    (new.id, 'planks', 'Planks', 'planks', 'Stare at the floor and think about life.', true, 0, 5),
    (new.id, 'crunches', 'Crunches', 'crunches', 'Pretend you are getting out of bed.', true, 0, 6),
    (new.id, 'incline-pushups', 'Incline Pushups', 'incline-pushups', 'Easier than the floor. We see you, baby mode.', false, 0, 7),
    (new.id, 'diamond-pushups', 'Diamond Pushups', 'diamond-pushups', 'Hands together. Tricep destruction.', false, 0, 8),
    (new.id, 'inverted-floor-rows', 'Inverted Floor Rows', 'inverted-floor-rows', 'On your back, feet planted. Drive elbows into the floor and lift your upper back.', false, 0, 9),
    (new.id, 'doorway-rows', 'Doorway Rows', 'doorway-rows', 'Grab a sturdy door frame, lean back, and pull your chest toward it.', false, 0, 10),
    (new.id, 'glute-bridges', 'Glute Bridges', 'glute-bridges', 'Back on the floor. Drive hips up. Squeeze. Lower with shame.', false, 0, 11),
    (new.id, 'jump-squats', 'Jump Squats', 'jump-squats', 'Now with extra knee damage.', false, 0, 12),
    (new.id, 'bulgarian-splits', 'Bulgarian Splits', 'bulgarian-splits', 'Back foot up. Soul down.', false, 0, 13),
    (new.id, 'l-sit', 'L-Sit', 'l-sit', 'Legs out. Hands down. Shake like a leaf.', false, 0, 14),
    (new.id, 'side-planks', 'Side Planks', 'side-planks', 'Sideways suffering. Twice the fun.', false, 0, 15),
    (new.id, 'leg-raises', 'Leg Raises', 'leg-raises', 'Legs up. Ab cramps incoming.', false, 0, 16),
    (new.id, 'hollow-body', 'Hollow Body Hold', 'hollow-body', 'Banana shape. Banana pain.', false, 0, 17)
  on conflict (user_id, category_id) do nothing;

  return new;
end;
$$;
