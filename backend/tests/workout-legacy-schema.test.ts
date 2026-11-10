import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('izvedba treninga na starejši shemi', () => {
  let db: PGlite;
  let program: string;
  let exercise: string;
  let workout: string;
  let previousSession: unknown[];
  let previousSets: unknown[];
  const oldSession = '20000000-0000-0000-0000-000000000001';
  const newSession = '20000000-0000-0000-0000-000000000002';
  const sessionFields = 'id, trainee_id, program_id, started_at, completed_at, total_volume_kg';
  const setFields = 'id, session_id, exercise_id, set_number, reps, weight_kg';
  const repair = () =>
    readFile(
      new URL('../../supabase/migrations/202611100011_workout_legacy_schema.sql', import.meta.url),
      'utf8',
    );

  beforeAll(async () => {
    db = await database();
    await actor(db, ids.client);
    exercise = await scalar(db, 'select id as value from public.exercises limit 1');
    program = await scalar(db, 'select public.save_program($1::jsonb) as value', [
      JSON.stringify({
        name: 'Moj trening',
        exercises: [{ exercise_id: exercise, target_sets: 3, target_reps: 10 }],
      }),
    ]);
    await db.query('select public.start_workout($1, $2)', [program, oldSession]);
    await db.query('select public.save_workout_set($1, 1, 10, 20)', [oldSession]);
    await db.query('select public.complete_workout($1)', [oldSession]);
    previousSession = (await db.query(`select ${sessionFields} from public.workout_sessions`)).rows;
    previousSets = (await db.query(`select ${setFields} from public.workout_sets`)).rows;
    await db.exec(`reset role;
      alter table public.workout_sessions drop column program_name, drop column program_snapshot, drop column program_snapshot_reconstructed;
      alter table public.workout_sets drop column exercise_position;`);
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });

  it('reproducira napako 42703 pri začetku', async () => {
    await actor(db, ids.client);
    await expect(
      db.query('select public.start_workout($1, $2)', [program, newSession]),
    ).rejects.toMatchObject({ code: '42703' });
  });

  it('doda manjkajoče stolpce in ohrani stare treninge ter opravljene serije', async () => {
    await db.exec('reset role');
    await db.exec(await repair());
    expect((await db.query(`select ${sessionFields} from public.workout_sessions`)).rows).toEqual(
      previousSession,
    );
    expect((await db.query(`select ${setFields} from public.workout_sets`)).rows).toEqual(
      previousSets,
    );
    expect(
      await scalar(
        db,
        'select program_snapshot_reconstructed as value from public.workout_sessions where id = $1',
        [oldSession],
      ),
    ).toBe(true);
  });

  it('začne trening, shrani posnetek in ne podvoji ponovljene zahteve', async () => {
    await actor(db, ids.client);
    workout = await scalar(db, 'select public.start_workout($1, $2) as value', [
      program,
      newSession,
    ]);
    expect(
      await scalar(db, 'select public.start_workout($1, $2) as value', [program, newSession]),
    ).toBe(workout);
    expect(
      await scalar(db, 'select program_name as value from public.workout_sessions where id = $1', [
        workout,
      ]),
    ).toBe('Moj trening');
    expect(
      await scalar(
        db,
        'select program_snapshot as value from public.workout_sessions where id = $1',
        [workout],
      ),
    ).toMatchObject([{ exercise_id: exercise, target_sets: 3, target_reps: 10 }]);
    expect(
      await scalar(
        db,
        'select program_snapshot_reconstructed as value from public.workout_sessions where id = $1',
        [workout],
      ),
    ).toBe(false);
  });

  it('omogoči zapis, popravek, brisanje in zaključek s pravilnim volumnom', async () => {
    const set = await scalar(db, 'select public.save_workout_set($1, 1, 10, 20) as value', [
      workout,
    ]);
    await db.query('select public.save_workout_set($1, 1, 8, 25, $2)', [workout, set]);
    await db.query('select public.delete_workout_set($1, $2)', [workout, set]);
    await db.query('select public.save_workout_set($1, 1, 10, 20)', [workout]);
    await db.query('select public.save_workout_set($1, 1, 5, 12.5)', [workout]);
    const result = await scalar<{ total_volume_kg: number }>(
      db,
      'select public.complete_workout($1) as value',
      [workout],
    );
    expect(Number(result.total_volume_kg)).toBe(262.5);
    expect(await scalar(db, 'select public.complete_workout($1) as value', [workout])).toEqual(
      result,
    );
    await expect(
      db.query('select public.save_workout_set($1, 1, 1, 0)', [workout]),
    ).rejects.toThrow(/Zaključenega/);
  });

  it('ponovitev migracije ne prepiše posnetkov, tuj račun pa nima dostopa', async () => {
    const snapshot = await scalar(
      db,
      'select program_snapshot as value from public.workout_sessions where id = $1',
      [workout],
    );
    await db.query('select public.save_program($1::jsonb, $2)', [
      JSON.stringify({
        name: 'Drugačen načrt',
        exercises: [{ exercise_id: exercise, target_sets: 1, target_reps: 1 }],
      }),
      program,
    ]);
    await db.exec('reset role');
    await db.exec(await repair());
    await actor(db, ids.client);
    expect(
      await scalar(
        db,
        'select program_snapshot as value from public.workout_sessions where id = $1',
        [workout],
      ),
    ).toEqual(snapshot);
    await actor(db, ids.other);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_sessions'),
    ).toBe(0);
    await expect(
      db.query('select public.start_workout($1, gen_random_uuid())', [program]),
    ).rejects.toThrow(/ni dostopen/);
  });
});
