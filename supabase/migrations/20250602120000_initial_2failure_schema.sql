-- =============================================================================
-- 2failure — initial schema (profiles, user_workouts, signup trigger, RLS)
-- Run once in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- =============================================================================

-- Extensions (usually enabled on Supabase; safe to run)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  coins integer not null default 0 check (coins >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'App profile per authenticated user (2failure).';

-- -----------------------------------------------------------------------------
-- user_workouts (per-user workout templates / equipped defaults)
-- -----------------------------------------------------------------------------
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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_workouts_user_category_unique unique (user_id, category_id)
);

create index if not exists user_workouts_user_id_idx on public.user_workouts (user_id);

comment on table public.user_workouts is 'User workout templates; one row per category (pushups, squats, etc.).';

-- -----------------------------------------------------------------------------
-- updated_at helpers
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- New user: profile + 5 default workouts (matches 2failure app categories)
-- -----------------------------------------------------------------------------
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
    (new.id, 'planks', 'Planks', 'planks', 'Stare at the floor and contemplate your life choices.', true, 0, 3),
    (new.id, 'lunges', 'Lunges', 'lunges', 'Step forward. Regret it. Step back.', true, 0, 4),
    (new.id, 'crunches', 'Crunches', 'crunches', 'Pretend you are getting out of bed.', true, 0, 5);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_workouts enable row level security;

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

-- Grant API access (Supabase often has these; idempotent)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.profiles to postgres, service_role;
grant select, update on table public.profiles to authenticated;
grant all on table public.user_workouts to postgres, service_role;
grant select, insert, update, delete on table public.user_workouts to authenticated;
