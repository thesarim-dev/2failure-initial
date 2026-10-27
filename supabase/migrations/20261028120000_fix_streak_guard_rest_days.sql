-- 2failure: fix the streak guard for rest days.
--
-- Coming back from rest days, the app adds those days to the streak (they're
-- days on plan): 2 rest days + today = +3. The previous guard only allowed +1
-- per update, so that save was refused. Now the streak may grow by up to the
-- number of days since the last workout (capped at 15), still only with real
-- training logged in the last 48 hours; restores still can't pass the longest
-- streak, and the workout date can't jump into the future.

create or replace function public.guard_user_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent boolean;
  v_gap integer := 1;
begin
  if new.last_workout_date is not null
     and new.last_workout_date ~ '^\d{4}-\d{2}-\d{2}$'
     and new.last_workout_date::date > (now() at time zone 'utc')::date + 1 then
    raise exception 'workout_date_in_future' using errcode = 'P0001';
  end if;

  if new.current_streak > old.current_streak then
    select exists (select 1 from public.coin_ledger where user_id = new.user_id and created_at > now() - interval '48 hours')
        or exists (select 1 from public.workout_set_logs where user_id = new.user_id and completed_at > now() - interval '48 hours')
      into v_recent;
    if old.last_workout_date ~ '^\d{4}-\d{2}-\d{2}$' and new.last_workout_date ~ '^\d{4}-\d{2}-\d{2}$' then
      v_gap := greatest(1, least(15, new.last_workout_date::date - old.last_workout_date::date));
    end if;
    if not ((v_recent and new.current_streak <= old.current_streak + v_gap) or new.current_streak <= old.longest_streak) then
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
