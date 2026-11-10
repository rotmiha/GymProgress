begin;

create function private.require_actor(required_role text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_role text;
begin
  select role into actor_role from public.users where id = actor;
  if actor is null or not private.has_active_session()
     or actor_role not in ('stranka', 'trener') or actor_role is null
     or (required_role is not null and actor_role <> required_role) then
    raise exception using errcode = '42501', message = 'Za dejanje nimate dovoljenja.';
  end if;
  return actor;
end;
$$;
revoke all on function private.require_actor(text) from public;

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  muscle_group text not null,
  equipment text not null
);
insert into public.exercises (name, muscle_group, equipment) values
  ('Počep', 'Noge', 'Drog'),
  ('Potisk s prsi', 'Prsi', 'Drog'),
  ('Mrtvi dvig', 'Hrbet in noge', 'Drog'),
  ('Veslanje', 'Hrbet', 'Ročke'),
  ('Potisk nad glavo', 'Ramena', 'Ročke'),
  ('Upogib komolca', 'Roke', 'Ročke');

create table public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id),
  name text not null check (length(btrim(name)) between 1 and 100),
  description text not null default '' check (length(description) <= 2000),
  created_at timestamptz not null default now()
);
create index on public.workout_programs(owner_id);

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position int not null check (position > 0),
  target_sets int not null check (target_sets between 1 and 100),
  target_reps int not null check (target_reps between 1 and 1000),
  unique (program_id, position)
);

alter table public.exercises enable row level security;
alter table public.workout_programs enable row level security;
alter table public.program_exercises enable row level security;
revoke all on public.exercises, public.workout_programs, public.program_exercises from anon, authenticated;
grant select on public.exercises, public.workout_programs, public.program_exercises to authenticated;

create policy exercises_read on public.exercises for select to authenticated
using ((select private.has_active_session()));
create policy programs_read on public.workout_programs for select to authenticated
using (owner_id = (select auth.uid()) and (select private.has_active_session()));
create policy program_exercises_read on public.program_exercises for select to authenticated
using (exists (select 1 from public.workout_programs p where p.id = program_id));

-- Celoten program in vrstni red vaj se shranita atomarno.
create function public.save_program(payload jsonb, program uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor();
  result uuid := program;
  item jsonb;
  position int := 0;
begin
  if jsonb_typeof(payload) <> 'object' or payload is null
     or coalesce(length(btrim(payload->>'name')), 0) not between 1 and 100
     or coalesce(length(payload->>'description'), 0) > 2000 then
    raise exception using errcode = '22023', message = 'Vnesite ime programa (1–100 znakov).';
  end if;
  if jsonb_typeof(payload->'exercises') is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Dodajte vsaj eno vajo.';
  end if;
  if jsonb_array_length(payload->'exercises') not between 1 and 100 then
    raise exception using errcode = '22023', message = 'Program mora imeti od 1 do 100 vaj.';
  end if;
  if program is null then
    insert into public.workout_programs(owner_id, name, description)
    values (actor, btrim(payload->>'name'), coalesce(payload->>'description', '')) returning id into result;
  else
    perform 1 from public.workout_programs where id = program and owner_id = actor for update;
    if not found then
      raise exception using errcode = '42501', message = 'Urejate lahko samo svoje programe.';
    end if;
    update public.workout_programs set name = btrim(payload->>'name'),
      description = coalesce(payload->>'description', '') where id = program;
    delete from public.program_exercises where program_id = program;
  end if;
  for item in select value from jsonb_array_elements(payload->'exercises') loop
    position := position + 1;
    if coalesce(item->>'target_sets', '') !~ '^[0-9]+$'
       or coalesce(item->>'target_reps', '') !~ '^[0-9]+$' then
      raise exception using errcode = '22023', message = 'Serije in ponovitve morajo biti pozitivna cela števila.';
    end if;
    insert into public.program_exercises(program_id, exercise_id, position, target_sets, target_reps)
    values (result, (item->>'exercise_id')::uuid, position,
      (item->>'target_sets')::int, (item->>'target_reps')::int);
  end loop;
  return result;
end;
$$;
revoke all on function public.save_program(jsonb, uuid) from public;
grant execute on function public.save_program(jsonb, uuid) to authenticated;

commit;
