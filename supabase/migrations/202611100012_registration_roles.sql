begin;

-- Sprožilec registracije zapisuje stranka/trener, starejša baza pa je
-- dovoljevala samo client/trainer/admin. Uskladi omejitev in obstoječe vloge.
-- Identifikatorji računov, povezave, programi in Auth podatki ostanejo enaki.
alter table public.users drop constraint if exists users_role_check;
alter table public.users alter column role set default 'stranka';

update public.users
set role = case btrim(role::text)
  when 'client' then 'stranka'
  when 'trainer' then 'trener'
  when 'admin' then 'administrator'
end
where btrim(role::text) in ('client', 'trainer', 'admin');

alter table public.users add constraint users_role_check
  check (role in ('stranka', 'trener', 'administrator'));

-- Vse spremembe so v isti transakciji; neznana vloga razveljavi popravek.
notify pgrst, 'reload schema';
commit;
