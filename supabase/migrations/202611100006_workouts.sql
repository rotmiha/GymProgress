begin;

create table public.workout_sessions (
  id uuid primary key,
  trainee_id uuid not null references public.users(id),
  program_id uuid not null references public.workout_programs(id),
  program_name text not null,
  program_snapshot jsonb not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  total_volume_kg numeric not null default 0
);
create index on public.workout_sessions(trainee_id, started_at);
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id),
  exercise_id uuid not null references public.exercises(id),
  exercise_position int not null,
  set_number int not null check (set_number > 0),
  reps int not null check (reps between 1 and 10000),
  weight_kg numeric(12,3) not null check (weight_kg between 0 and 100000),
  unique (session_id, exercise_position, set_number)
);
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
revoke all on public.workout_sessions, public.workout_sets from anon, authenticated;
grant select on public.workout_sessions, public.workout_sets to authenticated;
create policy sessions_read on public.workout_sessions for select to authenticated
using ((select private.has_active_session()) and (trainee_id = (select auth.uid()) or exists (
  select 1 from public.trainer_clients c
  where c.trainer_id = (select auth.uid()) and c.client_id = trainee_id and c.status = 'accepted'
)));
create policy sets_read on public.workout_sets for select to authenticated
using (exists (select 1 from public.workout_sessions s where s.id = session_id));

create function public.start_workout(program uuid, request_id uuid)
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

create function private.lock_open_workout(workout uuid)
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

create function public.save_workout_set(p_session uuid, p_position int, p_reps int, p_weight numeric, p_set uuid default null)
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
    where session_id = p_session and exercise_position = p_position;
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

create function public.delete_workout_set(p_session uuid, p_set uuid)
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

commit;
