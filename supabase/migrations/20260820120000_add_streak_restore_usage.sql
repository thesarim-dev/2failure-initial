alter table public.user_stats
  add column if not exists streak_restore_month text,
  add column if not exists streak_restore_count integer not null default 0;

alter table public.user_stats
  drop constraint if exists user_stats_streak_restore_count_check;

alter table public.user_stats
  add constraint user_stats_streak_restore_count_check
  check (streak_restore_count >= 0);

comment on column public.user_stats.streak_restore_month is
  'Local YYYY-MM of the last streak restore; usage resets when the month changes.';
comment on column public.user_stats.streak_restore_count is
  'Number of streak restores in streak_restore_month. Cost doubles from 50 up to 800.';
