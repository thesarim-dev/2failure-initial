-- 2failure: a set is logged exactly once, even on a bad connection.
--
-- If the connection drops after the server saved a set, the app can't tell and
-- sends it again. Each set now carries an id made on the phone; a second copy
-- of the same id returns the saved row instead of logging the set twice.

alter table public.workout_set_logs add column if not exists client_id uuid;
create unique index if not exists workout_set_logs_user_client_idx
  on public.workout_set_logs (user_id, client_id) where client_id is not null;

-- Replace the 4-argument version (two overloads would confuse the API).
drop function if exists public.log_set_entry(text, integer, numeric, integer);

create or replace function public.log_set_entry(
  p_category_id text,
  p_reps integer,
  p_weight_kg numeric default null,
  p_set_number integer default null,
  p_client_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  -- The same set sent again (a retry after a lost reply): it's already saved.
  if p_client_id is not null then
    select id into v_id from public.workout_set_logs where user_id = v_uid and client_id = p_client_id;
    if v_id is not null then
      return v_id;
    end if;
  end if;
  if p_category_id is null or length(p_category_id) > 64 then
    raise exception 'invalid exercise';
  end if;
  if p_reps is null or p_reps < 1 or p_reps > 1000 then
    raise exception 'implausible reps';
  end if;
  if p_weight_kg is not null and (p_weight_kg <= 0 or p_weight_kg > 500) then
    raise exception 'implausible weight';
  end if;
  if p_set_number is not null and (p_set_number < 1 or p_set_number > 50) then
    raise exception 'implausible set number';
  end if;
  -- Real sets take time: no more than one entry every 3 seconds, at most 300 a day.
  if exists (select 1 from public.workout_set_logs where user_id = v_uid and completed_at > now() - interval '3 seconds') then
    raise exception 'too fast';
  end if;
  if (select count(*) from public.workout_set_logs where user_id = v_uid and completed_at > now() - interval '24 hours') >= 300 then
    raise exception 'daily limit';
  end if;
  insert into public.workout_set_logs (user_id, category_id, reps, weight_kg, set_number, client_id)
  values (v_uid, p_category_id, p_reps, p_weight_kg, p_set_number, p_client_id)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.log_set_entry(text, integer, numeric, integer, uuid) from public;
grant execute on function public.log_set_entry(text, integer, numeric, integer, uuid) to authenticated;
