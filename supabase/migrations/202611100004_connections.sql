begin;

create table public.trainer_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.users(id),
  client_id uuid not null references public.users(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (trainer_id, client_id),
  check (trainer_id <> client_id)
);
create index on public.trainer_clients(client_id);
alter table public.trainer_clients enable row level security;
revoke all on public.trainer_clients from anon, authenticated;
grant select on public.trainer_clients to authenticated;
create policy connections_read on public.trainer_clients for select to authenticated
using ((trainer_id = (select auth.uid()) or client_id = (select auth.uid()))
  and (select private.has_active_session()));

create function public.invite_client(email_address text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor('trener');
  recipient uuid;
  result uuid;
begin
  select id into recipient from public.users
  where lower(email) = lower(btrim(email_address)) and role = 'stranka';
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

create function public.respond_invitation(invitation uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor('stranka');
begin
  if decision is null or decision not in ('accepted', 'rejected') then
    raise exception using errcode = '22023', message = 'Izberite sprejem ali zavrnitev.';
  end if;
  update public.trainer_clients set status = decision
  where id = invitation and client_id = actor and status = 'pending';
  if not found then
    raise exception using errcode = '42501', message = 'Povabilo ni dostopno ali je že obravnavano.';
  end if;
end;
$$;

create function public.list_connections()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor();
begin
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id', c.id, 'trainer_id', c.trainer_id, 'client_id', c.client_id,
    'status', c.status, 'email', u.email, 'ime', u.ime, 'priimek', u.priimek
  ) order by c.created_at desc)
  from public.trainer_clients c
  join public.users u on u.id = case when c.trainer_id = actor then c.client_id else c.trainer_id end
  where c.trainer_id = actor or c.client_id = actor), '[]'::jsonb);
end;
$$;

create function public.get_client_profile(client uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.require_actor('trener');
begin
  if not exists (select 1 from public.trainer_clients
    where trainer_id = actor and client_id = client and status = 'accepted') then
    raise exception using errcode = '42501', message = 'Stranka še ni potrdila povezave.';
  end if;
  return (select jsonb_build_object('id', id, 'ime', ime, 'priimek', priimek, 'email', email)
    from public.users where id = client);
end;
$$;

revoke all on function public.invite_client(text), public.respond_invitation(uuid, text),
  public.list_connections(), public.get_client_profile(uuid) from public;
grant execute on function public.invite_client(text), public.respond_invitation(uuid, text),
  public.list_connections(), public.get_client_profile(uuid) to authenticated;

commit;
