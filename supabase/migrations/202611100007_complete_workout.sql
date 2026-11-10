begin;

create function public.complete_workout(p_session uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor();
  workout public.workout_sessions%rowtype;
begin
  -- Enoten vrstni red zaklepanja za vzporedne začetke in zaključke uporabnika.
  perform 1 from public.users where id = actor for update;
  select * into workout from public.workout_sessions
  where id = p_session and trainee_id = actor for update;
  if not found then
    raise exception using errcode = '42501', message = 'Zaključite lahko samo svoj trening.';
  end if;
  if workout.completed_at is not null then
    return to_jsonb(workout);
  end if;
  if not exists (select 1 from public.workout_sets where session_id = p_session) then
    raise exception using errcode = '22023', message = 'Pred zaključkom shranite vsaj eno serijo.';
  end if;
  update public.workout_sessions
  set completed_at = clock_timestamp(), total_volume_kg = (
    select sum(reps * weight_kg) from public.workout_sets where session_id = p_session
  )
  where id = p_session returning * into workout;
  return to_jsonb(workout);
end;
$$;
revoke all on function public.complete_workout(uuid) from public;
grant execute on function public.complete_workout(uuid) to authenticated;

commit;
