begin;

-- Stara baza lahko nima UNIQUE(program_id, trainee_id).
-- Dodelitev serializira že obstoječi zaklep programa; podatkov ne brišemo.
create or replace function public.assign_program(program uuid, trainee uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_actor('trener');
  result uuid;
begin
  perform 1 from public.workout_programs
  where id = program and owner_id = actor
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Dodelite lahko samo lasten program.';
  end if;

  perform 1 from public.trainer_clients
  where trainer_id = actor and client_id = trainee and status = 'accepted'
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Program lahko dodelite le potrjeno povezani stranki.';
  end if;

  select id into result
  from public.program_assignments
  where program_id = program and trainee_id = trainee
  order by assigned_at, id
  limit 1;

  if result is null then
    insert into public.program_assignments(program_id, trainee_id, assigned_by)
    values (program, trainee, actor)
    returning id into result;
  end if;
  return result;
end;
$$;
revoke all on function public.assign_program(uuid, uuid) from public;
grant execute on function public.assign_program(uuid, uuid) to authenticated;

-- Branje dodeljenega programa ne sme ostati omejeno samo na njegovega avtorja.
create or replace function private.can_use_program(program uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_active_session() and exists (
    select 1 from public.workout_programs p
    where p.id = program and (p.owner_id = auth.uid() or exists (
      select 1 from public.program_assignments a
      join public.trainer_clients c
        on c.trainer_id = a.assigned_by and c.client_id = a.trainee_id
      where a.program_id = p.id and a.trainee_id = auth.uid() and c.status = 'accepted'
    ))
  );
$$;
revoke all on function private.can_use_program(uuid) from public;
grant execute on function private.can_use_program(uuid) to authenticated;

alter table public.program_assignments enable row level security;
alter table public.workout_programs enable row level security;
alter table public.program_exercises enable row level security;
revoke all on public.program_assignments, public.workout_programs, public.program_exercises
  from public, anon, authenticated;
grant select on public.program_assignments, public.workout_programs, public.program_exercises
  to authenticated;

-- Obnovi pravila teh treh tabel tudi v bazi s starejšimi politikami.
-- Pisanja še naprej potekajo samo prek preverjenih SQL funkcij.
do $$
declare
  old_policy record;
begin
  for old_policy in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('program_assignments', 'workout_programs', 'program_exercises')
  loop
    execute format('drop policy %I on public.%I', old_policy.policyname, old_policy.tablename);
  end loop;
end;
$$;

create policy assignments_read on public.program_assignments
for select to authenticated
using ((select private.has_active_session()) and (
  assigned_by = (select auth.uid())
  or (trainee_id = (select auth.uid()) and private.can_use_program(program_id))
));

create policy programs_read on public.workout_programs
for select to authenticated
using (private.can_use_program(id));

create policy program_exercises_read on public.program_exercises
for select to authenticated
using (exists (select 1 from public.workout_programs p where p.id = program_id));

notify pgrst, 'reload schema';
commit;
