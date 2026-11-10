begin;

-- Nadgradi obstoječe tabele. Treningov, serij, programov in vaj ne briše.
alter table public.workout_sessions
  add column if not exists program_name text,
  add column if not exists program_snapshot jsonb,
  add column if not exists program_snapshot_reconstructed boolean not null default false;
alter table public.workout_sets
  add column if not exists exercise_position int;

-- Stari model ni hranil posnetka načrta. Obnovimo ga samo tam, kjer manjka,
-- in ga izrecno označimo; obstoječi posnetki novih treningov ostanejo enaki.
update public.workout_sessions s
set program_name = coalesce(s.program_name,
      (select p.name from public.workout_programs p where p.id = s.program_id),
      'Program ni na voljo'),
    program_snapshot = coalesce(s.program_snapshot, (
      select jsonb_agg(jsonb_build_object(
        'exercise_id', e.id, 'name', e.name, 'position', pe.position,
        'target_sets', pe.target_sets, 'target_reps', pe.target_reps
      ) order by pe.position)
      from public.program_exercises pe
      join public.exercises e on e.id = pe.exercise_id
      where pe.program_id = s.program_id
    ), '[]'::jsonb),
    program_snapshot_reconstructed = s.program_snapshot_reconstructed or s.program_snapshot is null
where s.program_name is null or s.program_snapshot is null;

update public.workout_sets ws
set exercise_position = (
  select min((item->>'position')::int)
  from public.workout_sessions s, jsonb_array_elements(s.program_snapshot) item
  where s.id = ws.session_id and (item->>'exercise_id')::uuid = ws.exercise_id
)
where ws.exercise_position is null;

alter table public.workout_sessions
  alter column program_name set not null,
  alter column program_snapshot set not null,
  alter column started_at set default now(),
  alter column total_volume_kg set default 0;
alter table public.workout_sets alter column id set default gen_random_uuid();

create table if not exists public.workout_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id),
  exercise_id uuid not null references public.exercises(id),
  weight_kg numeric(12,3) not null,
  previous_weight_kg numeric(12,3),
  unique (session_id, exercise_id)
);
alter table public.workout_records alter column id set default gen_random_uuid();

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.workout_records enable row level security;
revoke all on public.workout_sessions, public.workout_sets, public.workout_records
  from public, anon, authenticated;
grant select on public.workout_sessions, public.workout_sets, public.workout_records
  to authenticated;

do $$
declare
  old_policy record;
begin
  for old_policy in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('workout_sessions', 'workout_sets', 'workout_records')
  loop
    execute format('drop policy %I on public.%I', old_policy.policyname, old_policy.tablename);
  end loop;
end;
$$;

create policy sessions_read on public.workout_sessions for select to authenticated
using ((select private.has_active_session()) and (
  trainee_id = (select auth.uid()) or exists (
    select 1 from public.trainer_clients c
    where c.trainer_id = (select auth.uid()) and c.client_id = trainee_id and c.status = 'accepted'
  )
));
create policy sets_read on public.workout_sets for select to authenticated
using (exists (select 1 from public.workout_sessions s where s.id = session_id));
create policy records_read on public.workout_records for select to authenticated
using (exists (select 1 from public.workout_sessions s where s.id = session_id));

-- Obnovi celoten tok začetka, serij in zaključka na nadgrajeni shemi.

create or replace function public.start_workout(program uuid, request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor();
  snapshot jsonb;
  title text;
begin
  if request_id is null then
    raise exception using errcode = '22023', message = 'Manjka identifikator začetka treninga.';
  end if;
  perform 1 from public.users where id = actor for update;
  if exists (select 1 from public.workout_sessions where id = request_id) then
    if not exists (select 1 from public.workout_sessions where id = request_id and trainee_id = actor and program_id = program) then
      raise exception using errcode = '42501', message = 'Trening ni dostopen.';
    end if;
    return request_id;
  end if;
  if not private.can_use_program(program) then
    raise exception using errcode = '42501', message = 'Program ni dostopen.';
  end if;
  select name into title from public.workout_programs where id = program for share;
  select jsonb_agg(jsonb_build_object(
    'exercise_id', e.id, 'name', e.name, 'position', pe.position,
    'target_sets', pe.target_sets, 'target_reps', pe.target_reps
  ) order by pe.position) into snapshot
  from public.program_exercises pe join public.exercises e on e.id = pe.exercise_id
  where pe.program_id = program;
  if snapshot is null then
    raise exception using errcode = '22023', message = 'Program nima vaj.';
  end if;
  insert into public.workout_sessions(id, trainee_id, program_id, program_name, program_snapshot)
  values (request_id, actor, program, title, snapshot);
  return request_id;
end;
$$;

create or replace function private.lock_open_workout(workout uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor();
  finished timestamptz;
begin
  select completed_at into finished from public.workout_sessions
  where id = workout and trainee_id = actor for update;
  if not found then
    raise exception using errcode = '42501', message = 'Spreminjate lahko samo svoje treninge.';
  end if;
  if finished is not null then
    raise exception using errcode = '22023', message = 'Zaključenega treninga ni mogoče spreminjati.';
  end if;
end;
$$;
revoke all on function private.lock_open_workout(uuid) from public;

create or replace function public.save_workout_set(p_session uuid, p_position int, p_reps int, p_weight numeric, p_set uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  exercise uuid;
  result uuid;
  next_number int;
begin
  perform private.lock_open_workout(p_session);
  if p_reps is null or p_reps not between 1 and 10000 or p_weight is null or p_weight not between 0 and 100000 then
    raise exception using errcode = '22023', message = 'Ponovitve morajo biti pozitivno celo število, teža pa med 0 in 100000 kg.';
  end if;
  select (item->>'exercise_id')::uuid into exercise
  from public.workout_sessions s, jsonb_array_elements(s.program_snapshot) item
  where s.id = p_session and (item->>'position')::int = p_position;
  if exercise is null then
    raise exception using errcode = '22023', message = 'Vaja ni del tega treninga.';
  end if;
  if p_set is null then
    select coalesce(max(set_number), 0) + 1 into next_number from public.workout_sets
    where session_id = p_session and exercise_id = exercise;
    insert into public.workout_sets(session_id, exercise_id, exercise_position, set_number, reps, weight_kg)
    values (p_session, exercise, p_position, next_number, p_reps, p_weight) returning id into result;
  else
    update public.workout_sets set reps = p_reps, weight_kg = p_weight
    where id = p_set and session_id = p_session and exercise_position = p_position returning id into result;
    if result is null then
      raise exception using errcode = '42501', message = 'Serija ni del tega treninga.';
    end if;
  end if;
  return result;
end;
$$;

create or replace function public.delete_workout_set(p_session uuid, p_set uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.lock_open_workout(p_session);
  delete from public.workout_sets where id = p_set and session_id = p_session;
  if not found then
    raise exception using errcode = '42501', message = 'Serija ni del tega treninga.';
  end if;
end;
$$;
revoke all on function public.start_workout(uuid, uuid),
  public.save_workout_set(uuid, int, int, numeric, uuid), public.delete_workout_set(uuid, uuid) from public;
grant execute on function public.start_workout(uuid, uuid),
  public.save_workout_set(uuid, int, int, numeric, uuid), public.delete_workout_set(uuid, uuid) to authenticated;


create or replace function private.workout_result(workout public.workout_sessions)
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


notify pgrst, 'reload schema';
commit;
