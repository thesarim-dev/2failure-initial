-- Weight + reps logging for barbell/dumbbell exercises

alter table public.workout_set_logs
  add column if not exists weight_kg numeric(6, 2)
    check (weight_kg is null or weight_kg > 0);

comment on column public.workout_set_logs.weight_kg is
  'Load used for the set in kilograms (barbell/dumbbell exercises).';

alter table public.user_workouts
  add column if not exists best_weight_kg numeric(6, 2)
    check (best_weight_kg is null or best_weight_kg > 0),
  add column if not exists best_weight_reps integer
    check (best_weight_reps is null or best_weight_reps > 0),
  add column if not exists best_weight_at timestamptz;

comment on column public.user_workouts.best_weight_kg is
  'Heaviest weight logged at meaningful reps for this exercise.';
comment on column public.user_workouts.best_weight_reps is
  'Reps achieved with best_weight_kg.';
comment on column public.user_workouts.best_weight_at is
  'When the current weight personal best was achieved.';
