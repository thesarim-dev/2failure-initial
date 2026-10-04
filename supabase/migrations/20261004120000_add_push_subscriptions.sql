-- Push subscriptions for "protect your flame" evening reminders.
-- One row per device. Players manage their own rows; the scheduled function
-- (service role) reads them all and records when it last sent.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  timezone text not null default 'UTC',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  last_sent_on date
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Push subscriptions: read own" on public.push_subscriptions;
create policy "Push subscriptions: read own"
  on public.push_subscriptions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Push subscriptions: insert own" on public.push_subscriptions;
create policy "Push subscriptions: insert own"
  on public.push_subscriptions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Push subscriptions: update own" on public.push_subscriptions;
create policy "Push subscriptions: update own"
  on public.push_subscriptions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Push subscriptions: delete own" on public.push_subscriptions;
create policy "Push subscriptions: delete own"
  on public.push_subscriptions for delete to authenticated
  using (auth.uid() = user_id);
