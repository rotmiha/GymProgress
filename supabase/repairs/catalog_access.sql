-- Obnovi branje OBSTOJEČEGA kataloga za prijavljene uporabnike.
-- Ne dodaja, preimenuje, posodablja ali briše vaj.
-- Predpogoj: auth_access.sql ali osnovni migraciji za Supabase Auth.
begin;

alter table public.exercises enable row level security;
revoke all on public.exercises from anon, authenticated;
grant select on public.exercises to authenticated;

-- Starim pravilom SELECT/ALL, vezanim na vloge client/trainer,
-- sledi enotno pravilo branja kataloga z aktivno sejo.
do $$
declare
  catalog_policy record;
begin
  for catalog_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'exercises'
      and cmd in ('SELECT', 'ALL')
  loop
    execute format('drop policy %I on public.exercises', catalog_policy.policyname);
  end loop;
end;
$$;

create policy exercises_read
on public.exercises
for select
to authenticated
using ((select private.has_active_session()));

commit;
