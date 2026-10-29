-- 2failure: friends, base visits, cheers and a weekly squad challenge.
--
-- Everything goes through security-definer functions, so players only ever
-- see what they should: their own friendships, and the bases and weekly
-- training of accepted friends. Squad progress is counted from the server's
-- own set log, and rewards are paid by the server once per week.

-- ---------------------------------------------------------------------------
-- Friend codes: 6 characters, unique, assigned by the server (apps can't edit them).
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists friend_code text;

create or replace function public.new_friend_code()
returns text
language plpgsql
as $$
declare
  v text;
begin
  loop
    v := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where friend_code = v);
  end loop;
  return v;
end;
$$;

do $$
declare
  r record;
begin
  for r in select id from public.profiles where friend_code is null loop
    update public.profiles set friend_code = public.new_friend_code() where id = r.id;
  end loop;
end;
$$;

create unique index if not exists profiles_friend_code_key on public.profiles (friend_code);

create or replace function public.assign_friend_code()
returns trigger
language plpgsql
as $$
begin
  if new.friend_code is null then
    new.friend_code := public.new_friend_code();
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_friend_code on public.profiles;
create trigger profiles_friend_code before insert on public.profiles
  for each row execute function public.assign_friend_code();

-- ---------------------------------------------------------------------------
-- Friendships (one row per pair, user_a < user_b), cheers, squad claims.
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  primary key (user_a, user_b),
  check (user_a < user_b)
);
alter table public.friendships enable row level security;
drop policy if exists "Friendships: read own" on public.friendships;
create policy "Friendships: read own" on public.friendships for select to authenticated using (auth.uid() in (user_a, user_b));

create table if not exists public.cheers (
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (from_user, to_user, day)
);
alter table public.cheers enable row level security;
drop policy if exists "Cheers: read own" on public.cheers;
create policy "Cheers: read own" on public.cheers for select to authenticated using (auth.uid() in (from_user, to_user));

create table if not exists public.squad_claims (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  coins integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, week_start)
);
alter table public.squad_claims enable row level security;
drop policy if exists "Squad claims: read own" on public.squad_claims;
create policy "Squad claims: read own" on public.squad_claims for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships
     where user_a = least(a, b) and user_b = greatest(a, b) and status = 'accepted'
  );
$$;

-- Weeks start on Monday (UTC) for the squad challenge.
create or replace function public.squad_week_start()
returns timestamptz
language sql
stable
as $$
  select date_trunc('week', now() at time zone 'utc') at time zone 'utc';
$$;

create or replace function public.sets_this_week(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.workout_set_logs
   where user_id = p_user and completed_at >= public.squad_week_start();
$$;

-- ---------------------------------------------------------------------------
-- Friends
-- ---------------------------------------------------------------------------
create or replace function public.my_friend_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select friend_code from public.profiles where id = auth.uid();
$$;

-- 'sent' | 'accepted' | 'already' | 'pending' | 'self' | 'not_found' | 'limit'
create or replace function public.send_friend_request(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_other uuid;
  v_row public.friendships;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  select id into v_other from public.profiles where friend_code = upper(trim(coalesce(p_code, '')));
  if v_other is null then return 'not_found'; end if;
  if v_other = v_uid then return 'self'; end if;
  select * into v_row from public.friendships where user_a = least(v_uid, v_other) and user_b = greatest(v_uid, v_other);
  if found then
    if v_row.status = 'accepted' then return 'already'; end if;
    if v_row.requested_by = v_uid then return 'pending'; end if;
    -- They had already asked you: adding their code accepts.
    update public.friendships set status = 'accepted', accepted_at = timezone('utc', now())
     where user_a = v_row.user_a and user_b = v_row.user_b;
    return 'accepted';
  end if;
  if (select count(*) from public.friendships where v_uid in (user_a, user_b)) >= 50 then
    return 'limit';
  end if;
  insert into public.friendships (user_a, user_b, requested_by)
  values (least(v_uid, v_other), greatest(v_uid, v_other), v_uid);
  return 'sent';
end;
$$;

create or replace function public.respond_friend_request(p_friend uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_accept then
    update public.friendships set status = 'accepted', accepted_at = timezone('utc', now())
     where user_a = least(v_uid, p_friend) and user_b = greatest(v_uid, p_friend)
       and status = 'pending' and requested_by = p_friend;
  else
    delete from public.friendships
     where user_a = least(v_uid, p_friend) and user_b = greatest(v_uid, p_friend)
       and status = 'pending' and requested_by = p_friend;
  end if;
end;
$$;

create or replace function public.remove_friend(p_friend uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.friendships
   where user_a = least(auth.uid(), p_friend) and user_b = greatest(auth.uid(), p_friend);
$$;

-- Your friends and requests. Details (streak, HQ, sets) only for accepted friends.
create or replace function public.friends_overview()
returns table (
  friend_id uuid,
  display_name text,
  status text,
  incoming boolean,
  current_streak integer,
  hq_level integer,
  sets_this_week integer,
  cheered_today boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    coalesce(nullif(p.display_name, ''), 'Athlete'),
    f.status,
    (f.status = 'pending' and f.requested_by <> auth.uid()),
    case when f.status = 'accepted' then coalesce(s.current_streak, 0) else 0 end,
    case when f.status = 'accepted' then coalesce((
      select max((it->>'level')::integer)
        from jsonb_array_elements(coalesce(b.state->'placed', '[]'::jsonb)) it
       where it->>'itemId' = 'hq'
    ), 1) else 0 end,
    case when f.status = 'accepted' then public.sets_this_week(o.id) else 0 end,
    exists (
      select 1 from public.cheers c
       where c.from_user = auth.uid() and c.to_user = o.id and c.day = (now() at time zone 'utc')::date
    )
  from public.friendships f
  cross join lateral (select case when f.user_a = auth.uid() then f.user_b else f.user_a end as id) o
  join public.profiles p on p.id = o.id
  left join public.user_stats s on s.user_id = o.id
  left join public.base_games b on b.user_id = o.id
  where auth.uid() in (f.user_a, f.user_b);
$$;

-- A friend's base, to visit (read-only). Friends only.
create or replace function public.get_friend_base(p_friend uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_state jsonb;
begin
  if not public.are_friends(auth.uid(), p_friend) then
    raise exception 'not_friends' using errcode = 'P0001';
  end if;
  select state into v_state from public.base_games where user_id = p_friend;
  return coalesce(v_state, '{}'::jsonb);
end;
$$;

-- Cheer a friend's base: once a day per friend; they get 5 coins.
create or replace function public.cheer_friend(p_friend uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if not public.are_friends(v_uid, p_friend) then
    return 'not_friends';
  end if;
  insert into public.cheers (from_user, to_user, day)
  values (v_uid, p_friend, (now() at time zone 'utc')::date)
  on conflict do nothing;
  if not found then
    return 'already';
  end if;
  update public.profiles set coins = coins + 5 where id = p_friend;
  insert into public.coin_ledger (user_id, delta, reason, meta)
  values (p_friend, 5, 'cheer', jsonb_build_object('from', v_uid));
  return 'cheered';
end;
$$;

-- ---------------------------------------------------------------------------
-- The squad challenge: you and your friends, 30 sets each, this week.
-- ---------------------------------------------------------------------------
create or replace function public.squad_status()
returns table (goal integer, total integer, my_sets integer, members integer, claimed boolean)
language sql
stable
security definer
set search_path = public
as $$
  with squad as (
    select auth.uid() as id
    union
    select case when f.user_a = auth.uid() then f.user_b else f.user_a end
      from public.friendships f
     where auth.uid() in (f.user_a, f.user_b) and f.status = 'accepted'
  )
  select
    (case when count(*) >= 2 then 30 * count(*) else 0 end)::integer,
    coalesce(sum(public.sets_this_week(id)), 0)::integer,
    public.sets_this_week(auth.uid()),
    count(*)::integer,
    exists (
      select 1 from public.squad_claims
       where user_id = auth.uid() and week_start = (public.squad_week_start())::date
    )
  from squad;
$$;

-- Everyone who did 10+ sets claims once the squad hits its goal: 300 coins,
-- and room in the material budget for the 40 of each material the app adds.
create or replace function public.claim_squad_reward()
returns table (coins integer, balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_status record;
  v_week date := (public.squad_week_start())::date;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  perform 1 from public.profiles where id = v_uid for update;
  select * into v_status from public.squad_status();
  if v_status.members < 2 then raise exception 'no_squad' using errcode = 'P0001'; end if;
  if v_status.total < v_status.goal then raise exception 'not_done' using errcode = 'P0001'; end if;
  if v_status.my_sets < 10 then raise exception 'too_few_sets' using errcode = 'P0001'; end if;
  if v_status.claimed then raise exception 'claimed' using errcode = 'P0001'; end if;

  insert into public.squad_claims (user_id, week_start, coins) values (v_uid, v_week, 300);
  update public.profiles set coins = profiles.coins + 300 where id = v_uid returning profiles.coins into balance;
  insert into public.coin_ledger (user_id, delta, reason, meta) values (v_uid, 300, 'squad', jsonb_build_object('week', v_week));
  insert into public.economy (user_id, material_budget) values (v_uid, 400 + 120)
  on conflict (user_id) do update set material_budget = public.economy.material_budget + 120, updated_at = timezone('utc', now());
  coins := 300;
  return next;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: only signed-in players, only through these functions.
-- ---------------------------------------------------------------------------
revoke all on function public.my_friend_code() from public;
revoke all on function public.send_friend_request(text) from public;
revoke all on function public.respond_friend_request(uuid, boolean) from public;
revoke all on function public.remove_friend(uuid) from public;
revoke all on function public.friends_overview() from public;
revoke all on function public.get_friend_base(uuid) from public;
revoke all on function public.cheer_friend(uuid) from public;
revoke all on function public.squad_status() from public;
revoke all on function public.claim_squad_reward() from public;
grant execute on function public.my_friend_code() to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.friends_overview() to authenticated;
grant execute on function public.get_friend_base(uuid) to authenticated;
grant execute on function public.cheer_friend(uuid) to authenticated;
grant execute on function public.squad_status() to authenticated;
grant execute on function public.claim_squad_reward() to authenticated;
revoke insert, update, delete on public.friendships, public.cheers, public.squad_claims from authenticated, anon;
