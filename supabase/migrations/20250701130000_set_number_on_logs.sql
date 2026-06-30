-- Per-set index within a workout day (set 1, 2, 3…)

alter table public.workout_set_logs
  add column if not exists set_number integer
    check (set_number is null or set_number > 0);

comment on column public.workout_set_logs.set_number is
  'Which set of the day this log was for (1-based).';
