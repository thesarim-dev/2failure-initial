-- Core exercise pool: add L-Sit and other core rows for set tracking

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
  true,
  0,
  v.sort_order
from public.profiles p
cross join (
  values
    ('l-sit', 'L-Sit', 'l-sit', 'Legs out. Hands down. Shake like a leaf.', 6),
    ('hollow-body', 'Hollow Body Hold', 'hollow-body', 'Banana shape. Banana pain.', 7),
    ('side-planks', 'Side Planks', 'side-planks', 'Sideways suffering. Twice the fun.', 8),
    ('leg-raises', 'Leg Raises', 'leg-raises', 'Legs up. Ab cramps incoming.', 9),
    ('v-ups', 'V-Ups', 'v-ups', 'Fold like a beach chair.', 10)
) as v(category_id, workout_name, variant_id, description, sort_order)
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
    (new.id, 'pushups', 'Pushups', 'pushups', 'Floor. Down. Up. Repeat until death.', true, 0, 1),
    (new.id, 'squats', 'Squats', 'squats', 'Drop it low. Stand up. Cry.', true, 0, 2),
    (new.id, 'lunges', 'Lunges', 'lunges', 'Step forward. Regret it. Step back.', true, 0, 3),
    (new.id, 'planks', 'Planks', 'planks', 'Stare at the floor and contemplate your life choices.', true, 0, 4),
    (new.id, 'l-sit', 'L-Sit', 'l-sit', 'Legs out. Hands down. Shake like a leaf.', true, 0, 5),
    (new.id, 'hollow-body', 'Hollow Body Hold', 'hollow-body', 'Banana shape. Banana pain.', true, 0, 6),
    (new.id, 'side-planks', 'Side Planks', 'side-planks', 'Sideways suffering. Twice the fun.', true, 0, 7),
    (new.id, 'crunches', 'Crunches', 'crunches', 'Pretend you are getting out of bed.', true, 0, 8),
    (new.id, 'leg-raises', 'Leg Raises', 'leg-raises', 'Legs up. Ab cramps incoming.', true, 0, 9),
    (new.id, 'v-ups', 'V-Ups', 'v-ups', 'Fold like a beach chair.', true, 0, 10);

  return new;
end;
$$;
