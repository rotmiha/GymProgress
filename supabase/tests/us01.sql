-- Zaženite kot postgres v Supabase SQL Editorju po migraciji. Vse se povrne.
begin;
insert into auth.users(id, email, raw_user_meta_data) values
  ('10000000-0000-0000-0000-000000000001', 'us01-a@example.invalid', '{"role":"stranka"}'),
  ('10000000-0000-0000-0000-000000000002', 'us01-b@example.invalid', '{"role":"trener"}');
insert into auth.sessions(id, user_id) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
do $$
declare rejected boolean := false;
begin
  begin
    insert into auth.users(id, email, raw_user_meta_data) values
      ('10000000-0000-0000-0000-000000000003', 'us01-admin@example.invalid', '{"role":"administrator"}');
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: registracija administratorja'; end if;
  if has_table_privilege('anon', 'public.users', 'SELECT') then raise exception 'FAIL: anonimen dostop'; end if;
end;
$$;
update auth.users set raw_user_meta_data = '{"role":"administrator"}'
where id = '10000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.users) <> 1 then raise exception 'FAIL: RLS lastništvo'; end if;
  if (select role from public.users limit 1) <> 'stranka' then raise exception 'FAIL: eskalacija prek metapodatkov'; end if;
  begin
    update public.users set role = 'administrator';
    raise exception 'FAIL: neposredna sprememba vloge';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.users(id, email, role) values (gen_random_uuid(), 'x@example.invalid', 'administrator');
    raise exception 'FAIL: neposreden vnos profila';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
delete from auth.sessions where id = '20000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$
begin
  if (select count(*) from public.users) <> 0 then raise exception 'FAIL: dostop po odjavi'; end if;
end;
$$;
reset role;
rollback;
