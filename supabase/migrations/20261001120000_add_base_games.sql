-- Base game state, one row per player.
--
-- The whole base (materials, buildings, decorations, terrain, trophies,
-- quests, builders) is stored as JSON in `state`. Stone, timber and crystal
-- are also exposed as read-only columns so they can be seen and queried in
-- the dashboard (leaderboards, support, analytics).
--
-- Coins stay where they are: public.profiles.coins.

create table if not exists public.base_games (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  version integer not null default 3,
  updated_at timestamptz not null default now(),

  stone integer generated always as (coalesce((state -> 'resources' ->> 'stone')::integer, 0)) stored,
  timber integer generated always as (coalesce((state -> 'resources' ->> 'timber')::integer, 0)) stored,
  crystal integer generated always as (coalesce((state -> 'resources' ->> 'crystal')::integer, 0)) stored
);

comment on table public.base_games is
  'Base game save per player. Materials (stone, timber, crystal) live in state.resources; coins live in profiles.coins.';

alter table public.base_games enable row level security;

drop policy if exists "Base games: read own" on public.base_games;
create policy "Base games: read own"
  on public.base_games
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Base games: insert own" on public.base_games;
create policy "Base games: insert own"
  on public.base_games
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Base games: update own" on public.base_games;
create policy "Base games: update own"
  on public.base_games
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at honest even if a client sends an old timestamp.
create or replace function public.base_games_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists base_games_touch_updated_at on public.base_games;
create trigger base_games_touch_updated_at
  before insert or update on public.base_games
  for each row execute function public.base_games_touch_updated_at();
