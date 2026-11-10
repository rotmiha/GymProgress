import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';

it('obnovi manjkajočo shemo private brez izgube obstoječega profila in zapre stare politike', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
      create table auth.sessions(id uuid primary key, user_id uuid, created_at timestamptz default now());
      create function auth.jwt() returns jsonb language sql stable as
        $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
      create function auth.uid() returns uuid language sql stable as
        $$ select (auth.jwt()->>'sub')::uuid $$;
      grant usage on schema auth to authenticated;
      create table public.users(id uuid primary key, email text, ime text, priimek text, role char(12) check (role in ('client','trainer','admin')), created_at timestamptz default now());
      insert into auth.users values ('10000000-0000-0000-0000-000000000001', 'a@example.com', '{}');
      insert into auth.sessions(id, user_id) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
      insert into public.users(id,email,role) values ('10000000-0000-0000-0000-000000000001','a@example.com','client');
      create policy obsolete_public_read on public.users for select using (true);
    `);
    const repair = await readFile(
      fileURLToPath(new URL('../../supabase/repairs/auth_access.sql', import.meta.url)),
      'utf8',
    );
    await db.exec(repair);
    await db.exec(repair); // Popravek je ponovljiv.
    const diagnostic = await readFile(
      fileURLToPath(new URL('../../supabase/diagnostics/profile_access.sql', import.meta.url)),
      'utf8',
    );
    const results = await db.exec(diagnostic);
    expect(results.flatMap((result) => result.rows)).toContainEqual({
      seja_prepoznana: true,
      vidni_profili: 1,
      vloga: 'stranka',
    });
    const { rows } = await db.query('select count(*)::int as count from public.users');
    expect(rows[0].count).toBe(1);
    await db.exec('delete from auth.sessions; set role authenticated;');
    expect((await db.query('select count(*)::int as count from public.users')).rows[0].count).toBe(
      0,
    );
  } finally {
    await db.close();
  }
}, 30_000);
