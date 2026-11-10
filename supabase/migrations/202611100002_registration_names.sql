begin;

-- Posodobitev sprožilca tudi za projekte, kjer je migracija US-01 že izvedena.
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

  if given_name is null
     or given_name = ''
     or length(given_name) > 100
     or family_name is null
     or family_name = ''
     or length(family_name) > 100 then
    raise exception 'Ime in priimek sta obvezna in lahko vsebujeta največ 100 znakov.';
  end if;

  insert into public.users (id, email, ime, priimek, role)
  values (new.id, new.email, given_name, family_name, selected_role);
  return new;
end;
$$;
revoke all on function private.create_user_profile() from public;

commit;
