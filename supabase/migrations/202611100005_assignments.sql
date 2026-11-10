begin;

create table public.program_assignments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.workout_programs(id),
  trainee_id uuid not null references public.users(id),
  assigned_by uuid not null references public.users(id),
  assigned_at timestamptz not null default now(),
  unique (program_id, trainee_id)
);
create index on public.program_assignments(trainee_id);
alter table public.program_assignments enable row level security;
revoke all on public.program_assignments from anon, authenticated;
grant select on public.program_assignments to authenticated;
create policy assignments_read on public.program_assignments for select to authenticated
using ((select private.has_active_session()) and (
  assigned_by = (select auth.uid()) or (
    trainee_id = (select auth.uid()) and exists (
      select 1 from public.trainer_clients c
      where c.trainer_id = assigned_by and c.client_id = trainee_id and c.status = 'accepted'
    )
  )
));

-- Enotno dovoljenje za branje programa in poznejši začetek treninga.
create function private.can_use_program(program uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_active_session() and exists (
    select 1 from public.workout_programs p
    where p.id = program and (p.owner_id = auth.uid() or exists (
      select 1 from public.program_assignments a
      join public.trainer_clients c on c.trainer_id = a.assigned_by and c.client_id = a.trainee_id
      where a.program_id = p.id and a.trainee_id = auth.uid() and c.status = 'accepted'
    ))
  );
$$;
revoke all on function private.can_use_program(uuid) from public;
grant execute on function private.can_use_program(uuid) to authenticated;
drop policy programs_read on public.workout_programs;
create policy programs_read on public.workout_programs for select to authenticated
using (private.can_use_program(id));

create function public.assign_program(program uuid, trainee uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor('trener');
  result uuid;
begin
  perform 1 from public.workout_programs where id = program and owner_id = actor for update;
  if not found then
    raise exception using errcode = '42501', message = 'Dodelite lahko samo lasten program.';
  end if;
  perform 1 from public.trainer_clients
  where trainer_id = actor and client_id = trainee and status = 'accepted' for update;
  if not found then
    raise exception using errcode = '42501', message = 'Program lahko dodelite le potrjeno povezani stranki.';
  end if;
  insert into public.program_assignments(program_id, trainee_id, assigned_by)
  values (program, trainee, actor)
  on conflict (program_id, trainee_id) do nothing returning id into result;
  if result is null then
    select id into result from public.program_assignments where program_id = program and trainee_id = trainee;
  end if;
  return result;
end;
$$;
revoke all on function public.assign_program(uuid, uuid) from public;
grant execute on function public.assign_program(uuid, uuid) to authenticated;

commit;
