begin;

-- Vir pravic ostaja zaščiten profil, nikoli uporabniški metapodatki.
-- Podpira tudi stare vloge v stolpcu CHAR brez spreminjanja podatkov.
create or replace function private.application_role(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case lower(btrim(role::text))
    when 'client' then 'stranka'
    when 'trainer' then 'trener'
    when 'admin' then 'administrator'
    else lower(btrim(role::text))
  end
  from public.users
  where id = p_user;
$$;
revoke all on function private.application_role(uuid) from public;

create or replace function private.require_actor(required_role text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_role text := private.application_role(actor);
begin
  if actor is null or not private.has_active_session()
     or actor_role is null or actor_role not in ('stranka', 'trener')
     or (required_role is not null and actor_role <> required_role) then
    raise exception using errcode = '42501', message = 'Za dejanje nimate dovoljenja.';
  end if;
  return actor;
end;
$$;
revoke all on function private.require_actor(text) from public;

-- Pri povabilu prav tako prepozna obstoječo stranko z vlogo client.
create or replace function public.invite_client(email_address text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_actor('trener');
  recipient uuid;
  result uuid;
begin
  select id into recipient from public.users
  where lower(email) = lower(btrim(email_address))
    and private.application_role(id) = 'stranka';
  if recipient is null then
    raise exception using errcode = '22023', message = 'Stranka s tem e-naslovom ne obstaja.';
  end if;
  insert into public.trainer_clients(trainer_id, client_id)
  values (actor, recipient)
  on conflict (trainer_id, client_id) do update set status = 'pending', created_at = now()
  where public.trainer_clients.status = 'rejected'
  returning id into result;
  if result is null then
    raise exception using errcode = '22023', message = 'Povabilo ali potrjena povezava že obstaja.';
  end if;
  return result;
end;
$$;
revoke all on function public.invite_client(text) from public;
grant execute on function public.invite_client(text) to authenticated;

notify pgrst, 'reload schema';
commit;
