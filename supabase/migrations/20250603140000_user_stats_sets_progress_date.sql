alter table public.user_stats
  add column if not exists sets_progress_date date;

comment on column public.user_stats.sets_progress_date is
  'Calendar date for daily set progress; resets user_workouts sets when a new day starts.';
