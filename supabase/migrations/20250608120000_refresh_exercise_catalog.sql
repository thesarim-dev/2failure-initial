-- Refresh exercise catalog: floor-friendly pulls, glute bridges, trim advanced variants

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
select
  p.id,
  v.category_id,
  v.workout_name,
  v.variant_id,
  v.description,
  v.is_equipped,
  0,
  v.sort_order
from public.profiles p
cross join (
  values
    ('superman-pulls', 'Superman Pulls', 'superman-pulls', 'Face down, arms forward. Lift chest and legs, pull elbows to hips, extend back out.', false, 22),
    ('inverted-floor-rows', 'Inverted Floor Rows', 'inverted-floor-rows', 'On your back, feet planted. Drive elbows into the floor and lift your upper back.', false, 23),
    ('doorway-rows', 'Doorway Rows', 'doorway-rows', 'Grab a sturdy door frame, lean back, and pull your chest toward it.', false, 24),
    ('glute-bridges', 'Glute Bridges', 'glute-bridges', 'Back on the floor. Drive hips up. Squeeze. Lower with shame.', false, 25)
) as v(category_id, workout_name, variant_id, description, is_equipped, sort_order)
on conflict (user_id, category_id) do nothing;

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
  values (new.id, v_display_name, 0, 0);

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
    (new.id, 'pushups', 'Pushups', 'pushups', 'Floor. Down. Up. Repeat until death.', true, 1),
    (new.id, 'superman-pulls', 'Superman Pulls', 'superman-pulls', 'Face down, arms forward. Lift chest and legs, pull elbows to hips, extend back out.', true, 2),
    (new.id, 'squats', 'Squats', 'squats', 'Drop it low. Stand up. Cry.', true, 3),
    (new.id, 'lunges', 'Lunges', 'lunges', 'Step forward. Regret it. Step back.', true, 4),
    (new.id, 'planks', 'Planks', 'planks', 'Stare at the floor and think about life.', true, 5),
    (new.id, 'crunches', 'Crunches', 'crunches', 'Pretend you are getting out of bed.', true, 6),
    (new.id, 'incline-pushups', 'Incline Pushups', 'incline-pushups', 'Easier than the floor. We see you, baby mode.', false, 7),
    (new.id, 'diamond-pushups', 'Diamond Pushups', 'diamond-pushups', 'Hands together. Tricep destruction.', false, 8),
    (new.id, 'inverted-floor-rows', 'Inverted Floor Rows', 'inverted-floor-rows', 'On your back, feet planted. Drive elbows into the floor and lift your upper back.', false, 9),
    (new.id, 'doorway-rows', 'Doorway Rows', 'doorway-rows', 'Grab a sturdy door frame, lean back, and pull your chest toward it.', false, 10),
    (new.id, 'glute-bridges', 'Glute Bridges', 'glute-bridges', 'Back on the floor. Drive hips up. Squeeze. Lower with shame.', false, 11),
    (new.id, 'jump-squats', 'Jump Squats', 'jump-squats', 'Now with extra knee damage.', false, 12),
    (new.id, 'bulgarian-splits', 'Bulgarian Splits', 'bulgarian-splits', 'Back foot up. Soul down.', false, 13),
    (new.id, 'l-sit', 'L-Sit', 'l-sit', 'Legs out. Hands down. Shake like a leaf.', false, 14),
    (new.id, 'side-planks', 'Side Planks', 'side-planks', 'Sideways suffering. Twice the fun.', false, 15),
    (new.id, 'leg-raises', 'Leg Raises', 'leg-raises', 'Legs up. Ab cramps incoming.', false, 16),
    (new.id, 'hollow-body', 'Hollow Body Hold', 'hollow-body', 'Banana shape. Banana pain.', false, 17);

  return new;
end;
$$;
