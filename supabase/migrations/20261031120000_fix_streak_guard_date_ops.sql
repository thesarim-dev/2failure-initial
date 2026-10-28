-- 2failure: fix streak guard when last_workout_date is a date column.
--
-- Production (and some older schemas) store last_workout_date as `date`.
-- The rest-day streak guard used the text regex operator `~` on that column,
-- so EVERY update to user_stats failed with:
--   operator does not exist: date ~ unknown
--
-- That blocked streak updates and sets_progress_date rolls, so finished sets
-- never counted toward the day or the streak (while coin rewards / set logs
-- still worked, because those go through security-definer RPCs).
--
-- Cast through text/date so the guard works for both `date` and `text` columns.

create or replace function public.guard_user_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent boolean;
  v_gap integer := 1;
  v_old_day text := case when old.last_workout_date is null then null else old.last_workout_date::text end;
  v_new_day text := case when new.last_workout_date is null then null else new.last_workout_date::text end;
begin
  if v_new_day is not null
     and v_new_day ~ '^\d{4}-\d{2}-\d{2}$'
     and v_new_day::date > (now() at time zone 'utc')::date + 1 then
    raise exception 'workout_date_in_future' using errcode = 'P0001';
  end if;

  if new.current_streak > old.current_streak then
    select exists (select 1 from public.coin_ledger where user_id = new.user_id and created_at > now() - interval '48 hours')
        or exists (select 1 from public.workout_set_logs where user_id = new.user_id and completed_at > now() - interval '48 hours')
      into v_recent;
    if v_old_day ~ '^\d{4}-\d{2}-\d{2}$' and v_new_day ~ '^\d{4}-\d{2}-\d{2}$' then
      v_gap := greatest(1, least(15, v_new_day::date - v_old_day::date));
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
