-- Samo diagnostika; ne spreminja računov, gesel ali pravil dostopa.
-- Izvede se v Supabase SQL Editorju. Preveri zadnjo ustvarjeno sejo projekta.
begin;

do $$
declare
  current_session record;
begin
  select id, user_id into current_session
  from auth.sessions
  order by created_at desc
  limit 1;

  if current_session.id is null then
    raise exception 'V projektu ni seje. Najprej se prijavite.';
  end if;

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', current_session.user_id,
    'role', 'authenticated',
    'session_id', current_session.id
  )::text, true);
end;
$$;

set local role authenticated;

select
  private.has_active_session() as seja_prepoznana,
  (select count(*) from public.users) as vidni_profili,
  (select role from public.users where id = auth.uid()) as vloga;

reset role;
rollback;
