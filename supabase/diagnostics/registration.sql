-- Samo branje konfiguracije; ne izpisuje računov, gesel ali žetonov.
-- Izvedite v Supabase SQL Editorju ob napaki registracije.
select jsonb_build_object(
  'profile_columns', (
    select jsonb_agg(jsonb_build_object(
      'name', column_name, 'type', data_type, 'length', character_maximum_length,
      'nullable', is_nullable, 'default', column_default
    ) order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
  ),
  'profile_constraints', (
    select jsonb_agg(jsonb_build_object('name', conname, 'definition', pg_get_constraintdef(oid)))
    from pg_constraint where conrelid = 'public.users'::regclass
  ),
  'auth_triggers', (
    select jsonb_agg(jsonb_build_object(
      'name', t.tgname, 'enabled', t.tgenabled,
      'trigger', pg_get_triggerdef(t.oid),
      'function', pg_get_functiondef(p.oid),
      'owner', pg_get_userbyid(p.proowner)
    ))
    from pg_trigger t join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal
  )
) as registration_configuration;
