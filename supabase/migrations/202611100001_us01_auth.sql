begin;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  ime text,
  priimek text,
  role text not null check (role in ('stranka', 'trener', 'administrator')),
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Prepreči uporabo še nepretečenega JWT po odjavi.
create function private.has_active_session()
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

create policy users_read_own
on public.users
for select
to authenticated
using (id = (select auth.uid()) and (select private.has_active_session()));

create function private.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text := new.raw_user_meta_data ->> 'role';
begin
  if selected_role is null or selected_role not in ('stranka', 'trener') then
    raise exception 'Registracija zahteva vlogo stranka ali trener.';
  end if;

  insert into public.users (id, email, role)
  values (new.id, new.email, selected_role);
  return new;
end;
$$;
revoke all on function private.create_user_profile() from public;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.create_user_profile();

-- Kontaktni e-naslov sledi potrjenim spremembam v Supabase Auth.
create function private.sync_user_email()
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
create trigger on_auth_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function private.sync_user_email();

commit;
