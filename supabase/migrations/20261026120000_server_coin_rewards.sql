-- 2failure: coins are earned and spent on the server.
--
-- Before: the app calculated coins and wrote the new total straight into
-- profiles.coins, so anyone could set their own balance from the browser.
-- Now: the app reports a finished set (exercise, how long it lasted, its tier);
-- the server checks it's plausible and pays with the same formula as
-- src/lib/coinRewards.ts. Spending goes through spend_coins, which checks the
-- balance. Clients can no longer write the coins column directly.

-- Every earn and spend, for auditing (and for future leaderboards).
create table if not exists public.coin_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists coin_ledger_user_time_idx on public.coin_ledger (user_id, created_at desc);
alter table public.coin_ledger enable row level security;
drop policy if exists "Coin ledger: read own" on public.coin_ledger;
create policy "Coin ledger: read own" on public.coin_ledger for select to authenticated using (user_id = auth.uid());
-- No insert/update/delete policies: only the functions below write the ledger.

-- Same rules as src/lib/coinRewards.ts: nothing under 10 s, 20 base, up to +10
-- for effort (full at 60 s), +5 PRO / +10 ELITE.
create or replace function public.coins_for_set(p_seconds integer, p_tier text)
returns integer
language sql
immutable
as $$
  select case
    when coalesce(p_seconds, 0) < 10 then 0
    else 20
      + round(10 * least(1.0, p_seconds / 60.0))::integer
      + case p_tier when 'PRO' then 5 when 'ELITE' then 10 else 0 end
  end;
$$;

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
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_category_id is null or length(p_category_id) > 64 then
    raise exception 'invalid exercise';
  end if;

  -- One reward at a time per user, so parallel calls can't both pass the checks.
  perform 1 from public.profiles where id = v_uid for update;

  select max(created_at) into v_last
    from public.coin_ledger
   where user_id = v_uid and reason = 'set';
  select count(*) into v_today
    from public.coin_ledger
   where user_id = v_uid and reason = 'set' and created_at > now() - interval '24 hours';

  v_earned := public.coins_for_set(v_seconds, p_tier);

  -- A set can't finish sooner after the previous one than it lasted itself.
  if v_last is not null and now() - v_last < make_interval(secs => greatest(v_seconds, 5)) then
    v_earned := 0;
    v_reason := 'set_too_soon';
  -- More than 80 rewarded sets in a day isn't a real training day.
  elsif v_today >= 80 then
    v_earned := 0;
    v_reason := 'set_daily_cap';
  end if;

  insert into public.coin_ledger (user_id, delta, reason, meta)
  values (v_uid, v_earned, v_reason, jsonb_build_object('category', p_category_id, 'seconds', v_seconds, 'tier', p_tier));

  update public.profiles set coins = coins + v_earned where id = v_uid returning coins into balance;
  earned := v_earned;
  return next;
end;
$$;

create or replace function public.spend_coins(p_amount integer, p_reason text default 'spend')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_balance integer;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'invalid amount';
  end if;

  select coins into v_balance from public.profiles where id = v_uid for update;
  if v_balance is null or v_balance < p_amount then
    raise exception 'not enough coins' using errcode = 'P0001';
  end if;

  update public.profiles set coins = coins - p_amount where id = v_uid returning coins into v_balance;
  insert into public.coin_ledger (user_id, delta, reason)
  values (v_uid, -p_amount, left(coalesce(p_reason, 'spend'), 40));
  return v_balance;
end;
$$;

revoke all on function public.log_set_reward(text, integer, text) from public;
grant execute on function public.log_set_reward(text, integer, text) to authenticated;
revoke all on function public.spend_coins(integer, text) from public;
grant execute on function public.spend_coins(integer, text) to authenticated;

-- Lock the coins column: clients may still update their name (and streak),
-- but coins only change through the functions above.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, current_streak, updated_at) on public.profiles to authenticated;
