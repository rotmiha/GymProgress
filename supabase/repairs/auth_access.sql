-- Popravek za obstoječo GymProgress bazo, kjer public.users že obstaja,
-- shema private oziroma pravilna politika dostopa pa manjka.
-- Zaženite celotno datoteko v SQL Editorju ISTEGA projekta kot v .env.
-- Računov in gesel ne briše. Stare vloge pretvori v stranka/trener/administrator.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.has_active_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions
    where id::text = (select auth.jwt() ->> 'session_id')
      and user_id = (select auth.uid())
  );
$$;
revoke all on function private.has_active_session() from public;
grant execute on function private.has_active_session() to authenticated;

alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;

-- Nadomesti morebitne stare politike samo na aplikacijski tabeli users.
do $$
declare
  policy record;
begin
  for policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'users'
  loop
    execute format('drop policy %I on public.users', policy.policyname);
  end loop;
end;
$$;

-- Stare aplikacijske vloge (client/trainer/admin) uskladi z dokumentacijo.
-- auth.users.role ostane notranja Supabase vloga authenticated.
do $$
declare
  role_constraint record;
begin
  for role_constraint in
    select conname from pg_constraint
    where conrelid = 'public.users'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.users drop constraint %I', role_constraint.conname);
  end loop;
end;
$$;
alter table public.users alter column role drop default;
alter table public.users alter column role type text using btrim(role::text);
update public.users
set role = case role when 'client' then 'stranka' when 'trainer' then 'trener'
  when 'admin' then 'administrator' else role end;
alter table public.users add constraint users_role_check
check (role in ('stranka', 'trener', 'administrator'));
create policy users_read_own on public.users for select to authenticated
using (id = (select auth.uid()) and (select private.has_active_session()));

-- Zagotovi pravilen sprožilec za prihodnje registracije z imenom in priimkom.
create or replace function private.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text := new.raw_user_meta_data ->> 'role';
  given_name text := btrim(new.raw_user_meta_data ->> 'ime');
  family_name text := btrim(new.raw_user_meta_data ->> 'priimek');
begin
  if selected_role is null or selected_role not in ('stranka', 'trener') then
    raise exception 'Registracija zahteva vlogo stranka ali trener.';
  end if;

  if given_name is null or given_name = '' or length(given_name) > 100
     or family_name is null or family_name = '' or length(family_name) > 100 then
    raise exception 'Ime in priimek sta obvezna in lahko vsebujeta največ 100 znakov.';
  end if;

  insert into public.users (id, email, ime, priimek, role)
  values (new.id, new.email, given_name, family_name, selected_role);
  return new;
end;
$$;
revoke all on function private.create_user_profile() from public;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.create_user_profile();

create or replace function private.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
  set email = new.email
  where id = new.id;
  return new;
end;
$$;
revoke all on function private.sync_user_email() from public;
drop trigger if exists on_auth_email_updated on auth.users;
create trigger on_auth_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function private.sync_user_email();

commit;
