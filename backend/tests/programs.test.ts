import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('US-02 programi v PostgreSQL', () => {
  let db: PGlite;
  let exercise: string;
  let program: string;
  beforeAll(async () => {
    db = await database();
    await actor(db, ids.client);
    exercise = await scalar(db, 'select id as value from public.exercises limit 1');
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });

  it('zavrne prazen program in neveljavne serije brez delnih zapisov', async () => {
    for (const payload of [
      { name: '', exercises: [] },
      { name: 'Prazen', exercises: [] },
      { name: 'Napačen', exercises: [{ exercise_id: exercise, target_sets: 0, target_reps: 10 }] },
    ]) {
      await expect(
        db.query('select public.save_program($1::jsonb)', [JSON.stringify(payload)]),
      ).rejects.toThrow();
    }
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_programs'),
    ).toBe(0);
  });
  it('ustvari program in atomarno spremeni vrstni red ter odstrani vajo', async () => {
    program = await scalar(db, 'select public.save_program($1::jsonb) as value', [
      JSON.stringify({
        name: 'Moč',
        exercises: [
          { exercise_id: exercise, target_sets: 3, target_reps: 10 },
          { exercise_id: exercise, target_sets: 4, target_reps: 8 },
        ],
      }),
    ]);
    await db.query('select public.save_program($1::jsonb, $2::uuid)', [
      JSON.stringify({
        name: 'Moč 2',
        exercises: [{ exercise_id: exercise, target_sets: 4, target_reps: 8 }],
      }),
      program,
    ]);
    const { rows } = await db.query(
      'select position, target_sets, target_reps from public.program_exercises where program_id = $1',
      [program],
    );
    expect(rows).toEqual([{ position: 1, target_sets: 4, target_reps: 8 }]);
  });
  it('skrije tuj program in prepreči spreminjanje tudi prek RPC', async () => {
    await actor(db, ids.other);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_programs'),
    ).toBe(0);
    await expect(
      db.query('select public.save_program($1::jsonb, $2::uuid)', [
        JSON.stringify({
          name: 'Napad',
          exercises: [{ exercise_id: exercise, target_sets: 1, target_reps: 1 }],
        }),
        program,
      ]),
    ).rejects.toThrow(/samo svoje/);
    await expect(
      db.exec("insert into public.workout_programs(owner_id, name) values (auth.uid(), 'Obhod')"),
    ).rejects.toThrow(/permission denied/);
  });
});
