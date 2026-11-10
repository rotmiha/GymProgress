import { afterAll, beforeAll, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

let db: PGlite;
beforeAll(async () => {
  db = await database();
}, 30_000);
afterAll(async () => {
  await db?.close();
});

it('odpre obstoječe vaje brez spremembe uporabnikovih imen ali števila zapisov', async () => {
  await db.exec(`
    insert into public.exercises(name, muscle_group, equipment)
    values ('Bench Press', 'Prsa', 'Palica'), ('Squat', 'Noge', 'Palica');
    drop policy exercises_read on public.exercises;
    create policy legacy_catalog on public.exercises as restrictive for select to authenticated using (false);
  `);
  const before = await db.query(
    'select id, name, muscle_group, equipment from public.exercises order by id',
  );
  await actor(db, ids.client);
  expect(await scalar<number>(db, 'select count(*)::int as value from public.exercises')).toBe(0);
  await db.exec('reset role');
  const repair = await readFile(
    fileURLToPath(new URL('../../supabase/repairs/catalog_access.sql', import.meta.url)),
    'utf8',
  );
  await db.exec(repair);
  await db.exec(repair);
  expect(
    (await db.query('select id, name, muscle_group, equipment from public.exercises order by id'))
      .rows,
  ).toEqual(before.rows);
  await actor(db, ids.client);
  expect(await scalar<number>(db, 'select count(*)::int as value from public.exercises')).toBe(
    before.rows.length,
  );
  expect(
    await scalar(db, "select name as value from public.exercises where name = 'Bench Press'"),
  ).toBe('Bench Press');
  await expect(db.exec("delete from public.exercises where name = 'Bench Press'")).rejects.toThrow(
    /permission denied/,
  );
});
