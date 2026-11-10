import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { database, ids } from './helpers/database';

describe('registracija s staro omejitvijo vlog', () => {
  let db: PGlite;
  const insert = (id: string, role: string) =>
    db.query('insert into auth.users(id, email, raw_user_meta_data) values ($1, $2, $3)', [
      id,
      `${id}@example.com`,
      JSON.stringify({ role, ime: 'Miha', priimek: 'Test' }),
    ]);
  const repair = () =>
    readFile(
      new URL('../../supabase/migrations/202611100012_registration_roles.sql', import.meta.url),
      'utf8',
    );

  beforeAll(async () => {
    db = await database();
    await db.exec(`
      alter table public.users drop constraint users_role_check;
      alter table public.users alter column role type varchar(20);
      alter table public.users alter column role set default 'client';
      update public.users set role = case role when 'stranka' then 'client' when 'trener' then 'trainer' else 'admin' end;
      alter table public.users add constraint users_role_check check (role in ('client','trainer','admin'));
    `);
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });

  it('reproducira zavrnjeno registracijo zaradi users_role_check', async () => {
    await expect(insert('30000000-0000-0000-0000-000000000001', 'stranka')).rejects.toMatchObject({
      code: '23514',
    });
    expect(
      (
        await db.query(
          "select id from auth.users where id = '30000000-0000-0000-0000-000000000001'",
        )
      ).rows,
    ).toHaveLength(0);
  });

  it('uskladi vloge in ohrani vse druge podatke obstoječih profilov', async () => {
    const before = (
      await db.query('select id, email, ime, priimek, created_at from public.users order by id')
    ).rows;
    await db.exec(await repair());
    expect(
      (await db.query('select id, email, ime, priimek, created_at from public.users order by id'))
        .rows,
    ).toEqual(before);
    expect(
      (await db.query('select role from public.users where id = $1', [ids.trainer])).rows,
    ).toEqual([{ role: 'trener' }]);
    await db.exec(await repair());
  });

  it('ustvari profil stranke in trenerja z imenom in priimkom', async () => {
    for (const [id, role] of [
      ['30000000-0000-0000-0000-000000000001', 'stranka'],
      ['30000000-0000-0000-0000-000000000002', 'trener'],
    ]) {
      await insert(id, role);
      expect(
        (await db.query('select role, ime, priimek from public.users where id = $1', [id])).rows,
      ).toEqual([{ role, ime: 'Miha', priimek: 'Test' }]);
    }
  });

  it('še naprej zavrne registracijo administratorja', async () => {
    await expect(insert('30000000-0000-0000-0000-000000000003', 'administrator')).rejects.toThrow(
      /Registracija zahteva/,
    );
  });
});
