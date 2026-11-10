begin;

-- Dogodki rekordov ostanejo vezani na trening, na katerem so bili doseženi.
create table public.workout_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id),
  exercise_id uuid not null references public.exercises(id),
  weight_kg numeric(12,3) not null,
  previous_weight_kg numeric(12,3),
  unique (session_id, exercise_id)
);
alter table public.workout_records enable row level security;
revoke all on public.workout_records from anon, authenticated;
grant select on public.workout_records to authenticated;
create policy records_read on public.workout_records for select to authenticated
using (exists (select 1 from public.workout_sessions s where s.id = session_id));

create function private.workout_result(workout public.workout_sessions)
returns jsonb language sql stable security definer set search_path = '' as $$
  select to_jsonb(workout) || jsonb_build_object('workout_records', coalesce((
    select jsonb_agg(to_jsonb(r) || jsonb_build_object('exercises', jsonb_build_object('name', e.name)))
    from public.workout_records r join public.exercises e on e.id = r.exercise_id
    where r.session_id = (workout).id
  ), '[]'::jsonb));
$$;
revoke all on function private.workout_result(public.workout_sessions) from public;

create or replace function public.complete_workout(p_session uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor();
  workout public.workout_sessions%rowtype;
  current_result record;
  previous_weight numeric;
begin
  -- Zaklep uporabnika serializira zaključke vseh njegovih treningov.
  perform 1 from public.users where id = actor for update;
  select * into workout from public.workout_sessions
  where id = p_session and trainee_id = actor for update;
  if not found then
    raise exception using errcode = '42501', message = 'Zaključite lahko samo svoj trening.';
  end if;
  if workout.completed_at is not null then
    return private.workout_result(workout);
  end if;
  if not exists (select 1 from public.workout_sets where session_id = p_session) then
    raise exception using errcode = '22023', message = 'Pred zaključkom shranite vsaj eno serijo.';
  end if;
  for current_result in
    select exercise_id, max(weight_kg) as weight
    from public.workout_sets where session_id = p_session group by exercise_id
  loop
    select max(ws.weight_kg) into previous_weight
    from public.workout_sets ws join public.workout_sessions s on s.id = ws.session_id
    where s.trainee_id = actor and s.completed_at is not null
      and s.id <> p_session and ws.exercise_id = current_result.exercise_id;
    if previous_weight is null or current_result.weight > previous_weight then
      insert into public.workout_records(session_id, exercise_id, weight_kg, previous_weight_kg)
      values (p_session, current_result.exercise_id, current_result.weight, previous_weight);
    end if;
  end loop;
  update public.workout_sessions
  set completed_at = clock_timestamp(), total_volume_kg = (
    select sum(reps * weight_kg) from public.workout_sets where session_id = p_session
  )
  where id = p_session returning * into workout;
  return private.workout_result(workout);
end;
$$;
revoke all on function public.complete_workout(uuid) from public;
grant execute on function public.complete_workout(uuid) to authenticated;

commit;
