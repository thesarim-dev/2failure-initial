-- Personal bests per exercise category + set rep history

alter table public.user_workouts
  add column if not exists best_reps integer check (best_reps is null or best_reps > 0),
  add column if not exists best_reps_at timestamptz;

comment on column public.user_workouts.best_reps is
  'Highest rep count logged for this exercise category.';
comment on column public.user_workouts.best_reps_at is
  'When the current personal best was achieved.';

create table if not exists public.workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null,
  reps integer not null check (reps > 0),
  completed_at timestamptz not null default timezone('utc', now())
);

create index if not exists workout_set_logs_user_category_idx
  on public.workout_set_logs (user_id, category_id, completed_at desc);

comment on table public.workout_set_logs is
  'Per-set rep counts logged after each completed exercise.';

alter table public.workout_set_logs enable row level security;

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

grant all on table public.workout_set_logs to postgres, service_role;
grant select, insert on table public.workout_set_logs to authenticated;
