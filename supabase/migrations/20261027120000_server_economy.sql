-- 2failure: the base economy is enforced by the server.
--
-- Builds on 20261026120000_server_coin_rewards.sql (run that one first).
--
-- 1. Materials: every player has an earned budget, raised by each
--    server-checked set (log_set_reward). A base's value is the materials it
--    holds plus everything built from them (prices generated from the game's
--    catalog by scripts/economy-sql.ts). Saving a base worth more than the
--    budget is refused, so materials and buildings can't be made up.
-- 2. The set log (workout_set_logs) is written only through log_set_entry,
--    which checks the numbers are plausible.
-- 3. Streaks can only grow by one day with real training, or be restored up to
--    the longest streak ever reached.

create table if not exists public.economy (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  material_budget integer not null default 400,
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.economy enable row level security;
drop policy if exists "Economy: read own" on public.economy;
create policy "Economy: read own" on public.economy for select to authenticated using (user_id = auth.uid());

-- Material value of a saved base (same rules as src/game/economy.ts).
create or replace function public.base_value(p_state jsonb)
returns integer
language plpgsql
immutable
as $$
declare
  prices constant jsonb := '{"structures":{"hq":[0,64,185],"watchtower":[25,40,74],"lodge":[25,40,74],"forge":[25,40,72],"yard":[35,63,126],"spring":[40,55,90]},"decor":{"path":2,"wall":4,"arch":10,"pine":4,"bush":3,"rock":2,"flowers":2,"garden":4,"statue":20,"bench":5,"banner":5,"campfire":6,"picnic":6,"fountain":22,"gazebo":20,"lamp":5,"torch":3,"lanterns":6,"plyobox":4,"pullupbar":8,"dipbars":6,"punchbag":6,"hay":2,"barrels":3,"pumpkins":2,"birdhouse":2,"coop":8,"beehive":5,"well":8,"barn":16,"windmill":16,"signpost":2,"tent":6,"parasol":4,"sandcastle":3,"snowman":3,"lilypad":2,"bridge":6},"edges":{"fence":2,"wall":3,"hedge":2}}'::jsonb;
  v numeric := 0;
  item jsonb;
  lvls jsonb;
  upto integer;
  i integer;
  kind text;
begin
  v := greatest(coalesce((p_state->'resources'->>'stone')::numeric, 0), 0)
     + greatest(coalesce((p_state->'resources'->>'timber')::numeric, 0), 0)
     + greatest(coalesce((p_state->'resources'->>'crystal')::numeric, 0), 0);
  for item in select value from jsonb_array_elements(coalesce(p_state->'placed', '[]'::jsonb)) loop
    continue when item->>'itemId' like 'trophy:%';
    lvls := prices->'structures'->(item->>'itemId');
    if lvls is not null then
      select max((j->>'targetLevel')::integer) into upto
        from jsonb_array_elements(coalesce(p_state->'constructions', '[]'::jsonb)) j
       where j->>'uid' = item->>'uid';
      upto := greatest(coalesce((item->>'level')::integer, 0), coalesce(upto, 0));
      for i in 0 .. least(upto, jsonb_array_length(lvls)) - 1 loop
        v := v + (lvls->>i)::integer;
      end loop;
    else
      v := v + coalesce((prices->'decor'->>(item->>'itemId'))::integer, 0);
    end if;
  end loop;
  for kind in select value from jsonb_each_text(coalesce(p_state->'edges', '{}'::jsonb)) loop
    v := v + coalesce((prices->'edges'->>kind)::integer, 0);
  end loop;
  return floor(v)::integer;
end;
$$;

-- Existing players start with a budget covering their current base (nobody loses anything).
insert into public.economy (user_id, material_budget)
select user_id, greatest(400, public.base_value(state)) from public.base_games
on conflict (user_id) do nothing;

-- Refuse to save a base worth more than the player has earned.
create or replace function public.guard_base_games()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value integer;
  v_budget integer;
begin
  insert into public.economy (user_id) values (new.user_id) on conflict (user_id) do nothing;
  select material_budget into v_budget from public.economy where user_id = new.user_id;
  v_value := public.base_value(new.state);
  if v_value > v_budget then
    raise exception 'base_over_budget' using errcode = 'P0001', detail = format('base value %s exceeds earned budget %s', v_value, v_budget);
  end if;
  return new;
end;
$$;
drop trigger if exists base_games_guard on public.base_games;
create trigger base_games_guard before insert or update of state on public.base_games
  for each row execute function public.guard_base_games();

-- Rewards: coins as before, and each rewarded set raises the material budget.
create or replace function public.log_set_reward(p_category_id text, p_seconds integer, p_tier text default 'BASE')
returns table (earned integer, balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_seconds integer := least(greatest(coalesce(p_seconds, 0), 0), 3600);
  v_last timestamptz;
  v_today integer;
  v_earned integer;
  v_reason text := 'set';
  v_bonus integer;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_category_id is null or length(p_category_id) > 64 then
    raise exception 'invalid exercise';
  end if;

  perform 1 from public.profiles where id = v_uid for update;

  select max(created_at) into v_last from public.coin_ledger where user_id = v_uid and reason = 'set';
  select count(*) into v_today from public.coin_ledger where user_id = v_uid and reason = 'set' and created_at > now() - interval '24 hours';

  v_earned := public.coins_for_set(v_seconds, p_tier);
  if v_last is not null and now() - v_last < make_interval(secs => greatest(v_seconds, 5)) then
    v_earned := 0;
    v_reason := 'set_too_soon';
  elsif v_today >= 80 then
    v_earned := 0;
    v_reason := 'set_daily_cap';
  end if;

  insert into public.coin_ledger (user_id, delta, reason, meta)
  values (v_uid, v_earned, v_reason, jsonb_build_object('category', p_category_id, 'seconds', v_seconds, 'tier', p_tier));
  update public.profiles set coins = coins + v_earned where id = v_uid returning coins into balance;

  -- A real set (10 s or more, not too soon, under the daily cap) also earns
  -- material budget: more than a set can earn, plus room for the day's quests
  -- and session bonus (first set of a day) and the weekly bonus (first of a week).
  if v_reason = 'set' and v_seconds >= 10 then
    v_bonus := 25
      + case when v_last is null or (v_last at time zone 'utc')::date <> (now() at time zone 'utc')::date then 60 else 0 end
      + case when v_last is null or date_trunc('week', v_last) <> date_trunc('week', now()) then 40 else 0 end;
    insert into public.economy (user_id, material_budget) values (v_uid, 400 + v_bonus)
    on conflict (user_id) do update set material_budget = public.economy.material_budget + v_bonus, updated_at = timezone('utc', now());
  end if;

  earned := v_earned;
  return next;
end;
$$;

-- The set log: written only through this function, with plausibility checks.
create or replace function public.log_set_entry(p_category_id text, p_reps integer, p_weight_kg numeric default null, p_set_number integer default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_category_id is null or length(p_category_id) > 64 then
    raise exception 'invalid exercise';
  end if;
  if p_reps is null or p_reps < 1 or p_reps > 1000 then
    raise exception 'implausible reps';
  end if;
  if p_weight_kg is not null and (p_weight_kg <= 0 or p_weight_kg > 500) then
    raise exception 'implausible weight';
  end if;
  if p_set_number is not null and (p_set_number < 1 or p_set_number > 50) then
    raise exception 'implausible set number';
  end if;
  -- Real sets take time: no more than one entry every 3 seconds, at most 300 a day.
  if exists (select 1 from public.workout_set_logs where user_id = v_uid and completed_at > now() - interval '3 seconds') then
    raise exception 'too fast';
  end if;
  if (select count(*) from public.workout_set_logs where user_id = v_uid and completed_at > now() - interval '24 hours') >= 300 then
    raise exception 'daily limit';
  end if;
  insert into public.workout_set_logs (user_id, category_id, reps, weight_kg, set_number)
  values (v_uid, p_category_id, p_reps, p_weight_kg, p_set_number)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.log_set_entry(text, integer, numeric, integer) from public;
grant execute on function public.log_set_entry(text, integer, numeric, integer) to authenticated;
revoke insert, update, delete on public.workout_set_logs from authenticated, anon;

-- Streaks: +1 day only with real training in the last 48 hours; restores can't
-- go past the longest streak ever; workouts count up one at a time.
create or replace function public.guard_user_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent boolean;
begin
  if new.current_streak > old.current_streak then
    select exists (select 1 from public.coin_ledger where user_id = new.user_id and created_at > now() - interval '48 hours')
        or exists (select 1 from public.workout_set_logs where user_id = new.user_id and completed_at > now() - interval '48 hours')
      into v_recent;
    if not ((new.current_streak = old.current_streak + 1 and v_recent) or new.current_streak <= old.longest_streak) then
      raise exception 'streak_not_earned' using errcode = 'P0001';
    end if;
  end if;
  if new.longest_streak > greatest(old.longest_streak, new.current_streak) then
    raise exception 'streak_not_earned' using errcode = 'P0001';
  end if;
  if new.total_workouts > old.total_workouts + 1 then
    raise exception 'workouts_not_earned' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists user_stats_guard on public.user_stats;
create trigger user_stats_guard before update on public.user_stats
  for each row execute function public.guard_user_stats();
