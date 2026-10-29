-- 2failure: friends, base visits, cheers, and weekly squads you pick.
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
-- Squads: each week you pick which friends to co-op with (up to 4 people).
-- You start a squad by inviting 1–3 friends; they join or decline. Only joined
-- members count: the goal is 30 sets each. One squad per person per week.
-- ---------------------------------------------------------------------------
create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.squad_members (
  squad_id uuid not null references public.squads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  status text not null check (status in ('invited', 'joined')),
  invited_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (squad_id, user_id)
);
-- One joined squad per person per week.
create unique index if not exists squad_members_one_per_week on public.squad_members (user_id, week_start) where status = 'joined';
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
drop policy if exists "Squads: read own" on public.squads;
create policy "Squads: read own" on public.squads for select to authenticated using (
  exists (select 1 from public.squad_members m where m.squad_id = id and m.user_id = auth.uid())
);
drop policy if exists "Squad members: read own squads" on public.squad_members;
create policy "Squad members: read own squads" on public.squad_members for select to authenticated using (user_id = auth.uid());

create or replace function public.my_squad_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select squad_id from public.squad_members
   where user_id = auth.uid() and week_start = (public.squad_week_start())::date and status = 'joined'
   limit 1;
$$;

-- Start this week's squad with 1–3 friends (they get invites).
create or replace function public.create_squad(p_friends uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_week date := (public.squad_week_start())::date;
  v_squad uuid;
  v_friend uuid;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if public.my_squad_id() is not null then raise exception 'already_in_squad' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_friends, 1), 0) < 1 or array_length(p_friends, 1) > 3 then
    raise exception 'pick_1_to_3' using errcode = 'P0001';
  end if;
  foreach v_friend in array p_friends loop
    if not public.are_friends(v_uid, v_friend) then raise exception 'not_friends' using errcode = 'P0001'; end if;
  end loop;
  insert into public.squads (week_start, created_by) values (v_week, v_uid) returning id into v_squad;
  insert into public.squad_members (squad_id, user_id, week_start, status) values (v_squad, v_uid, v_week, 'joined');
  insert into public.squad_members (squad_id, user_id, week_start, status, invited_by)
  select v_squad, f, v_week, 'invited', v_uid from unnest(p_friends) f
  on conflict do nothing;
  return v_squad;
end;
$$;

-- Invite one more friend to your squad (up to 4 people).
create or replace function public.invite_to_squad(p_friend uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_squad uuid := public.my_squad_id();
begin
  if v_squad is null then return 'no_squad'; end if;
  if not public.are_friends(v_uid, p_friend) then return 'not_friends'; end if;
  if (select count(*) from public.squad_members where squad_id = v_squad) >= 4 then return 'full'; end if;
  insert into public.squad_members (squad_id, user_id, week_start, status, invited_by)
  values (v_squad, p_friend, (public.squad_week_start())::date, 'invited', v_uid)
  on conflict do nothing;
  return 'invited';
end;
$$;

-- Squad invites waiting for you this week.
create or replace function public.my_squad_invites()
returns table (squad_id uuid, from_name text, members text[])
language sql
stable
security definer
set search_path = public
as $$
  select m.squad_id,
         coalesce(nullif(p.display_name, ''), 'Athlete'),
         array(
           select coalesce(nullif(pp.display_name, ''), 'Athlete')
             from public.squad_members mm join public.profiles pp on pp.id = mm.user_id
            where mm.squad_id = m.squad_id and mm.status = 'joined'
         )
    from public.squad_members m
    join public.profiles p on p.id = m.invited_by
   where m.user_id = auth.uid() and m.status = 'invited' and m.week_start = (public.squad_week_start())::date;
$$;

create or replace function public.respond_squad_invite(p_squad uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not exists (select 1 from public.squad_members where squad_id = p_squad and user_id = v_uid and status = 'invited') then
    return 'no_invite';
  end if;
  if not p_accept then
    delete from public.squad_members where squad_id = p_squad and user_id = v_uid;
    return 'declined';
  end if;
  if public.my_squad_id() is not null then return 'already_in_squad'; end if;
  update public.squad_members set status = 'joined' where squad_id = p_squad and user_id = v_uid;
  return 'joined';
end;
$$;

-- Leave this week's squad (you can start or join another).
create or replace function public.leave_squad()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.squad_members where squad_id = public.my_squad_id() and user_id = auth.uid();
$$;

-- Your squad this week: goal (30 sets per joined member), progress, members.
drop function if exists public.squad_status();
create or replace function public.squad_status()
returns table (squad_id uuid, goal integer, total integer, my_sets integer, members integer, claimed boolean)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (select public.my_squad_id() as id),
       joined as (select m.user_id from public.squad_members m, mine where m.squad_id = mine.id and m.status = 'joined')
  select
    (select id from mine),
    (case when (select count(*) from joined) >= 2 then 30 * (select count(*) from joined) else 0 end)::integer,
    coalesce((select sum(public.sets_this_week(user_id)) from joined), 0)::integer,
    public.sets_this_week(auth.uid()),
    (select count(*) from joined)::integer,
    exists (select 1 from public.squad_claims where user_id = auth.uid() and week_start = (public.squad_week_start())::date);
$$;

create or replace function public.squad_members_status()
returns table (user_id uuid, display_name text, status text, sets_this_week integer, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  select m.user_id, coalesce(nullif(p.display_name, ''), 'Athlete'), m.status, public.sets_this_week(m.user_id), m.user_id = auth.uid()
    from public.squad_members m join public.profiles p on p.id = m.user_id
   where m.squad_id = public.my_squad_id()
   order by (m.user_id = auth.uid()) desc, (m.status = 'joined') desc, p.display_name;
$$;

-- Joined members with 10+ sets claim once the squad hits its goal: 300 coins,
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
  if v_status.squad_id is null or v_status.members < 2 then raise exception 'no_squad' using errcode = 'P0001'; end if;
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
revoke all on function public.my_squad_id() from public;
revoke all on function public.create_squad(uuid[]) from public;
revoke all on function public.invite_to_squad(uuid) from public;
revoke all on function public.my_squad_invites() from public;
revoke all on function public.respond_squad_invite(uuid, boolean) from public;
revoke all on function public.leave_squad() from public;
revoke all on function public.squad_members_status() from public;
revoke all on function public.claim_squad_reward() from public;
grant execute on function public.my_friend_code() to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.friends_overview() to authenticated;
grant execute on function public.get_friend_base(uuid) to authenticated;
grant execute on function public.cheer_friend(uuid) to authenticated;
grant execute on function public.squad_status() to authenticated;
grant execute on function public.create_squad(uuid[]) to authenticated;
grant execute on function public.invite_to_squad(uuid) to authenticated;
grant execute on function public.my_squad_invites() to authenticated;
grant execute on function public.respond_squad_invite(uuid, boolean) to authenticated;
grant execute on function public.leave_squad() to authenticated;
grant execute on function public.squad_members_status() to authenticated;
grant execute on function public.claim_squad_reward() to authenticated;
revoke insert, update, delete on public.friendships, public.cheers, public.squad_claims, public.squads, public.squad_members from authenticated, anon;
