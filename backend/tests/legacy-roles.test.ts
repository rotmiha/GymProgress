import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('združljivost starih vlog client in trainer', () => {
  let db: PGlite;
  let exercise: string;
  let clientProgram: string;
  let trainerProgram: string;
  beforeAll(async () => {
    db = await database();
    await db.exec(`alter table public.users drop constraint users_role_check;
      update public.users set role = 'client    ' where id = '${ids.client}';
      update public.users set role = 'trainer   ' where id = '${ids.trainer}';`);
    exercise = await scalar(db, 'select id as value from public.exercises limit 1');
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });
  const payload = () =>
    JSON.stringify({
      name: 'Moj program',
      exercises: [{ exercise_id: exercise, target_sets: 3, target_reps: 10 }],
    });
  it('obema vlogama dovoli ustvarjanje lastnega programa', async () => {
    await actor(db, ids.client);
    clientProgram = await scalar(db, 'select public.save_program($1::jsonb) as value', [payload()]);
    await actor(db, ids.trainer);
    trainerProgram = await scalar(db, 'select public.save_program($1::jsonb) as value', [
      payload(),
    ]);
    expect(clientProgram).toBeTruthy();
    expect(trainerProgram).toBeTruthy();
  });
  it('prepozna staro vlogo pri povabilu in potrjeni dodelitvi', async () => {
    const invitation = await scalar(
      db,
      "select public.invite_client('client@example.com') as value",
    );
    await actor(db, ids.client);
    await db.query("select public.respond_invitation($1, 'accepted')", [invitation]);
    await actor(db, ids.trainer);
    expect(
      await scalar(db, 'select public.assign_program($1, $2) as value', [
        trainerProgram,
        ids.client,
      ]),
    ).toBeTruthy();
  });
  it('stranka ne dobi trenerjevih pravic in trener ne sme spreminjati tujih programov', async () => {
    await actor(db, ids.client);
    await expect(
      db.query('select public.assign_program($1, $2)', [clientProgram, ids.other]),
    ).rejects.toThrow(/dovoljenja/);
    await actor(db, ids.trainer);
    await expect(
      db.query('select public.save_program($1::jsonb, $2)', [payload(), clientProgram]),
    ).rejects.toThrow(/samo svoje/);
  });
  it('stara vloga ne obide preverjanja aktivne seje', async () => {
    await db.exec('reset role');
    await db.query('delete from auth.sessions where user_id = $1', [ids.trainer]);
    await actor(db, ids.trainer);
    await expect(db.query('select public.save_program($1::jsonb)', [payload()])).rejects.toThrow(
      /dovoljenja/,
    );
  });
});
