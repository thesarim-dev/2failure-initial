-- Upper/lower lineup: add pull exercises and align equipped defaults

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
    ('pull-ups', 'Pull-ups', 'pull-ups', 'Bar up. Chin over. Ego boosted.', true, 11),
    ('inverted-rows', 'Inverted Rows', 'inverted-rows', 'Under the bar. Pull your pride back.', false, 12),
    ('chin-ups', 'Chin-ups', 'chin-ups', 'Palms in. Biceps crying.', false, 13),
    ('archer-pull-ups', 'Archer Pull-ups', 'archer-pull-ups', 'One side pulls. The other judges.', false, 14)
) as v(category_id, workout_name, variant_id, description, is_equipped, sort_order)
on conflict (user_id, category_id) do nothing;

-- New users: default equipped lineup = push + pull upper, squats + lunges lower, planks + crunches core
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
    (new.id, 'pull-ups', 'Pull-ups', 'pull-ups', 'Bar up. Chin over. Ego boosted.', true, 2),
    (new.id, 'squats', 'Squats', 'squats', 'Drop it low. Stand up. Cry.', true, 3),
    (new.id, 'lunges', 'Lunges', 'lunges', 'Step forward. Regret it. Step back.', true, 4),
    (new.id, 'planks', 'Planks', 'planks', 'Stare at the floor and contemplate your life choices.', true, 5),
    (new.id, 'crunches', 'Crunches', 'crunches', 'Pretend you are getting out of bed.', true, 6),
    (new.id, 'incline-pushups', 'Incline Pushups', 'incline-pushups', 'Easier than the floor. We see you, baby mode.', false, 7),
    (new.id, 'diamond-pushups', 'Diamond Pushups', 'diamond-pushups', 'Hands together. Tricep destruction.', false, 8),
    (new.id, 'archer-pushups', 'Archer Pushups', 'archer-pushups', 'One arm in charge. The other vibes.', false, 9),
    (new.id, 'inverted-rows', 'Inverted Rows', 'inverted-rows', 'Under the bar. Pull your pride back.', false, 10),
    (new.id, 'chin-ups', 'Chin-ups', 'chin-ups', 'Palms in. Biceps crying.', false, 11),
    (new.id, 'archer-pull-ups', 'Archer Pull-ups', 'archer-pull-ups', 'One side pulls. The other judges.', false, 12),
    (new.id, 'jump-squats', 'Jump Squats', 'jump-squats', 'Now with extra knee damage.', false, 13),
    (new.id, 'pistol-squats', 'Pistol Squats', 'pistol-squats', 'One leg. Zero dignity.', false, 14),
    (new.id, 'walking-lunges', 'Walking Lunges', 'walking-lunges', 'Now with locomotion. Look at you go.', false, 15),
    (new.id, 'bulgarian-splits', 'Bulgarian Splits', 'bulgarian-splits', 'Back foot up. Soul down.', false, 16),
    (new.id, 'l-sit', 'L-Sit', 'l-sit', 'Legs out. Hands down. Shake like a leaf.', false, 17),
    (new.id, 'side-planks', 'Side Planks', 'side-planks', 'Sideways suffering. Twice the fun.', false, 18),
    (new.id, 'leg-raises', 'Leg Raises', 'leg-raises', 'Legs up. Ab cramps incoming.', false, 19),
    (new.id, 'hollow-body', 'Hollow Body Hold', 'hollow-body', 'Banana shape. Banana pain.', false, 20),
    (new.id, 'v-ups', 'V-Ups', 'v-ups', 'Fold like a beach chair.', false, 21);

  return new;
end;
$$;
