import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';

it('izvede migracijo in preveri RLS, varovanje vlog ter preklic sej v PostgreSQL', async () => {
  const db = new PGlite();
  try {
    // Lokalni nadomestek tabel in JWT funkcij, ki jih gostovani Supabase že ima.
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
      create table auth.sessions(id uuid primary key, user_id uuid references auth.users(id));
      create function auth.jwt() returns jsonb language sql stable as
        $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
      create function auth.uid() returns uuid language sql stable as
        $$ select (auth.jwt()->>'sub')::uuid $$;
      grant usage on schema auth to authenticated;
    `);
    const migration = await readFile(fileURLToPath(new URL('../../supabase/migrations/202611100001_us01_auth.sql', import.meta.url)), 'utf8');
    const checks = await readFile(fileURLToPath(new URL('../../supabase/tests/us01.sql', import.meta.url)), 'utf8');
    await db.exec(migration);
    await db.exec(checks);
    const { rows } = await db.query<{ count: number }>('select count(*)::int as count from public.users');
    expect(rows[0].count).toBe(0); // Testni zapisi so povrnjeni.
  } finally { await db.close(); }
}, 30_000);
