-- Consolidated baseline migration for 2failure schema and onboarding behavior.
-- This preserves the current app behavior while making fresh setups simpler.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  coins integer not null default 0 check (coins >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'App profile per authenticated user (2failure).';

create table if not exists public.user_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null,
  workout_name text not null,
  variant_id text not null,
  description text,
  is_equipped boolean not null default true,
  sets_completed integer not null default 0 check (sets_completed >= 0 and sets_completed <= 3),
  sort_order integer not null default 0,
  best_reps integer check (best_reps is null or best_reps > 0),
  best_reps_at timestamptz,
  best_weight_kg numeric(6, 2) check (best_weight_kg is null or best_weight_kg > 0),
  best_weight_reps integer check (best_weight_reps is null or best_weight_reps > 0),
  best_weight_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_workouts_user_category_unique unique (user_id, category_id)
);

create index if not exists user_workouts_user_id_idx on public.user_workouts (user_id);

comment on table public.user_workouts is 'User workout templates; one row per category (pushups, squats, etc.).';

create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  total_workouts integer not null default 0 check (total_workouts >= 0),
  last_workout_date text,
  sets_progress_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.user_stats is 'Daily workout and streak progress for each user.';

create table if not exists public.workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null,
  reps integer not null check (reps > 0),
  completed_at timestamptz not null default timezone('utc', now()),
  weight_kg numeric(6, 2) check (weight_kg is null or weight_kg > 0),
  set_number integer check (set_number is null or set_number > 0)
);

create index if not exists workout_set_logs_user_category_idx
  on public.workout_set_logs (user_id, category_id, completed_at desc);

comment on table public.workout_set_logs is 'Per-set rep counts logged after each completed exercise.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists user_workouts_set_updated_at on public.user_workouts;
create trigger user_workouts_set_updated_at
  before update on public.user_workouts
  for each row
  execute function public.set_updated_at();

drop trigger if exists user_stats_set_updated_at on public.user_stats;
create trigger user_stats_set_updated_at
  before update on public.user_stats
  for each row
  execute function public.set_updated_at();

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

  insert into public.user_stats (user_id, current_streak, longest_streak, total_workouts, last_workout_date, sets_progress_date)
  values (new.id, 0, 0, 0, null, null)
  on conflict (user_id) do nothing;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_workouts enable row level security;
alter table public.user_stats enable row level security;
alter table public.workout_set_logs enable row level security;

drop policy if exists "Profiles: read own" on public.profiles;
create policy "Profiles: read own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "User workouts: read own" on public.user_workouts;
create policy "User workouts: read own"
  on public.user_workouts
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "User workouts: insert own" on public.user_workouts;
create policy "User workouts: insert own"
  on public.user_workouts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "User workouts: update own" on public.user_workouts;
create policy "User workouts: update own"
  on public.user_workouts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "User workouts: delete own" on public.user_workouts;
create policy "User workouts: delete own"
  on public.user_workouts
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "User stats: read own" on public.user_stats;
create policy "User stats: read own"
  on public.user_stats
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "User stats: insert own" on public.user_stats;
create policy "User stats: insert own"
  on public.user_stats
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "User stats: update own" on public.user_stats;
create policy "User stats: update own"
  on public.user_stats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Workout set logs: read own" on public.workout_set_logs;
create policy "Workout set logs: read own"
  on public.workout_set_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Workout set logs: insert own" on public.workout_set_logs;
create policy "Workout set logs: insert own"
  on public.workout_set_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.profiles to postgres, service_role;
grant select, update on table public.profiles to authenticated;
grant all on table public.user_workouts to postgres, service_role;
grant select, insert, update, delete on table public.user_workouts to authenticated;
grant all on table public.user_stats to postgres, service_role;
grant select, insert, update on table public.user_stats to authenticated;
grant all on table public.workout_set_logs to postgres, service_role;
grant select, insert on table public.workout_set_logs to authenticated;

insert into public.user_stats (user_id, current_streak, longest_streak, total_workouts, last_workout_date, sets_progress_date)
select p.id, 0, 0, 0, null, null
from public.profiles p
on conflict (user_id) do nothing;

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
    ('pushups', 'Pushups', 'pushups', 'Floor. Down. Up. Repeat until death.', true, 1),
    ('superman-pulls', 'Superman Pulls', 'superman-pulls', 'Face down, arms forward. Lift chest and legs, pull elbows to hips, extend back out.', true, 2),
    ('squats', 'Squats', 'squats', 'Drop it low. Stand up. Cry.', true, 3),
    ('lunges', 'Lunges', 'lunges', 'Step forward. Regret it. Step back.', true, 4),
    ('planks', 'Planks', 'planks', 'Stare at the floor and think about life.', true, 5),
    ('crunches', 'Crunches', 'crunches', 'Pretend you are getting out of bed.', true, 6),
    ('incline-pushups', 'Incline Pushups', 'incline-pushups', 'Easier than the floor. We see you, baby mode.', false, 7),
    ('diamond-pushups', 'Diamond Pushups', 'diamond-pushups', 'Hands together. Tricep destruction.', false, 8),
    ('inverted-floor-rows', 'Inverted Floor Rows', 'inverted-floor-rows', 'On your back, feet planted. Drive elbows into the floor and lift your upper back.', false, 9),
    ('doorway-rows', 'Doorway Rows', 'doorway-rows', 'Grab a sturdy door frame, lean back, and pull your chest toward it.', false, 10),
    ('glute-bridges', 'Glute Bridges', 'glute-bridges', 'Back on the floor. Drive hips up. Squeeze. Lower with shame.', false, 11),
    ('jump-squats', 'Jump Squats', 'jump-squats', 'Now with extra knee damage.', false, 12),
    ('bulgarian-splits', 'Bulgarian Splits', 'bulgarian-splits', 'Back foot up. Soul down.', false, 13),
    ('l-sit', 'L-Sit', 'l-sit', 'Legs out. Hands down. Shake like a leaf.', false, 14),
    ('side-planks', 'Side Planks', 'side-planks', 'Sideways suffering. Twice the fun.', false, 15),
    ('leg-raises', 'Leg Raises', 'leg-raises', 'Legs up. Ab cramps incoming.', false, 16),
    ('hollow-body', 'Hollow Body Hold', 'hollow-body', 'Banana shape. Banana pain.', false, 17)
) as v(category_id, workout_name, variant_id, description, is_equipped, sort_order)
on conflict (user_id, category_id) do nothing;
