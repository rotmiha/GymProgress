import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('US-05 beleženje serij', () => {
  let db: PGlite;
  let program: string;
  let session: string;
  let exercise: string;
  let set: string;
  beforeAll(async () => {
    db = await database();
    await actor(db, ids.client);
    exercise = await scalar(db, 'select id as value from public.exercises limit 1');
    program = await scalar(db, 'select public.save_program($1::jsonb) as value', [
      JSON.stringify({
        name: 'Moj program',
        exercises: [{ exercise_id: exercise, target_sets: 3, target_reps: 10 }],
      }),
    ]);
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });
  it('shrani posnetek programa in ponovitev zahteve ne podvoji treninga', async () => {
    session = await scalar(db, 'select public.start_workout($1, $2) as value', [
      program,
      '20000000-0000-0000-0000-000000000001',
    ]);
    expect(
      await scalar(db, 'select public.start_workout($1, $2) as value', [program, session]),
    ).toBe(session);
    await db.query('select public.save_program($1::jsonb, $2)', [
      JSON.stringify({
        name: 'Spremenjen',
        exercises: [{ exercise_id: exercise, target_sets: 1, target_reps: 1 }],
      }),
      program,
    ]);
    const snapshot = await scalar(
      db,
      'select program_snapshot as value from public.workout_sessions where id = $1',
      [session],
    );
    expect(snapshot).toMatchObject([{ target_sets: 3, target_reps: 10 }]);
  });
  it('zavrne neveljavne podatke in omogoči ustvarjanje, popravek ter brisanje', async () => {
    for (const [reps, weight] of [
      [0, 20],
      [3, -1],
      [null, 20],
      [3, 'NaN'],
    ]) {
      await expect(
        db.query('select public.save_workout_set($1, 1, $2, $3)', [session, reps, weight]),
      ).rejects.toThrow();
    }
    await expect(
      db.query('select public.save_workout_set($1, 99, 10, 20)', [session]),
    ).rejects.toThrow(/ni del/);
    set = await scalar(db, 'select public.save_workout_set($1, 1, 10, 0) as value', [session]);
    await db.query('select public.save_workout_set($1, 1, 8, 12.5, $2)', [session, set]);
    expect(
      await scalar<number>(db, 'select reps as value from public.workout_sets where id = $1', [
        set,
      ]),
    ).toBe(8);
    await db.query('select public.delete_workout_set($1, $2)', [session, set]);
    expect(await scalar<number>(db, 'select count(*)::int as value from public.workout_sets')).toBe(
      0,
    );
    set = await scalar(db, 'select public.save_workout_set($1, 1, 10, 20) as value', [session]);
  });
  it('drug uporabnik ne vidi in ne spreminja treninga ali serij', async () => {
    await actor(db, ids.other);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_sessions'),
    ).toBe(0);
    expect(await scalar<number>(db, 'select count(*)::int as value from public.workout_sets')).toBe(
      0,
    );
    await expect(
      db.query('select public.start_workout($1, gen_random_uuid())', [program]),
    ).rejects.toThrow(/ni dostopen/);
    await expect(
      db.query('select public.save_workout_set($1, 1, 10, 20)', [session]),
    ).rejects.toThrow(/samo svoje/);
    await expect(
      db.query('select public.delete_workout_set($1, $2)', [session, set]),
    ).rejects.toThrow(/samo svoje/);
  });
  it('potrjeni trener lahko bere, vendar ne spreminja strankinega treninga', async () => {
    await actor(db, ids.trainer);
    const invitation = await scalar(
      db,
      "select public.invite_client('client@example.com') as value",
    );
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_sessions'),
    ).toBe(0);
    await actor(db, ids.client);
    await db.query("select public.respond_invitation($1, 'accepted')", [invitation]);
    await actor(db, ids.trainer);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_sessions'),
    ).toBe(1);
    await expect(
      db.query('select public.save_workout_set($1, 1, 10, 20)', [session]),
    ).rejects.toThrow(/samo svoje/);
    await expect(db.exec('delete from public.workout_sets')).rejects.toThrow(/permission denied/);
  });
});
