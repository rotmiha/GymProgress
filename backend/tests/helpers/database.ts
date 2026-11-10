import { PGlite } from '@electric-sql/pglite';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const ids = {
  client: '10000000-0000-0000-0000-000000000001',
  other: '10000000-0000-0000-0000-000000000002',
  trainer: '10000000-0000-0000-0000-000000000003',
  stranger: '10000000-0000-0000-0000-000000000004',
};

export async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
    create table auth.sessions(id uuid primary key, user_id uuid references auth.users(id));
    create function auth.jwt() returns jsonb language sql stable as
      $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as
      $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to authenticated;
  `);
  const directory = fileURLToPath(new URL('../../../supabase/migrations/', import.meta.url));
  for (const file of (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()) {
    await db.exec(await readFile(`${directory}/${file}`, 'utf8'));
  }
  for (const [name, id] of Object.entries(ids)) {
    await db.query('insert into auth.users(id, email, raw_user_meta_data) values ($1, $2, $3)', [
      id,
      `${name}@example.com`,
      JSON.stringify({
        role: ['trainer', 'stranger'].includes(name) ? 'trener' : 'stranka',
        ime: name,
        priimek: 'Test',
      }),
    ]);
    await db.query('insert into auth.sessions(id, user_id) values ($1, $1)', [id]);
  }
  return db;
}

export async function actor(db: PGlite, id: string) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: id, role: 'authenticated', session_id: id }),
  ]);
  await db.exec('set role authenticated');
}

export async function scalar<T = string>(
  db: PGlite,
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const { rows } = await db.query<{ value: T }>(sql, params);
  return rows[0].value;
}
