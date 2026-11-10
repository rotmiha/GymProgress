import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('US-07 osebni rekordi', () => {
  let db: PGlite;
  let program: string;
  let exercise: string;
  beforeAll(async () => {
    db = await database();
    await actor(db, ids.client);
    exercise = await scalar(db, 'select id as value from public.exercises limit 1');
    program = await scalar(db, 'select public.save_program($1::jsonb) as value', [
      JSON.stringify({
        name: 'Rekordi',
        exercises: [{ exercise_id: exercise, target_sets: 3, target_reps: 10 }],
      }),
    ]);
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });
  async function workout(weight: number, complete = true) {
    const id = await scalar(db, 'select public.start_workout($1, gen_random_uuid()) as value', [
      program,
    ]);
    await db.query('select public.save_workout_set($1, 1, 5, $2)', [id, weight]);
    const result = complete
      ? await scalar<{
          workout_records: { weight_kg: number; previous_weight_kg: number | null }[];
        }>(db, 'select public.complete_workout($1) as value', [id])
      : null;
    return { id, result };
  }
  it('prvi zaključeni rezultat vzpostavi rekord; nedokončan višji rezultat se prezre', async () => {
    await workout(200, false);
    const { result } = await workout(50);
    expect(result?.workout_records).toMatchObject([{ weight_kg: 50, previous_weight_kg: null }]);
  });
  it('enaka ali nižja teža ne ustvari novega rekorda', async () => {
    expect((await workout(50)).result?.workout_records).toEqual([]);
    expect((await workout(40)).result?.workout_records).toEqual([]);
  });
  it('višja teža ustvari en rekord; ponovljen zaključek ohrani dogodek', async () => {
    const { id, result } = await workout(55.5);
    expect(result?.workout_records).toMatchObject([{ weight_kg: 55.5, previous_weight_kg: 50 }]);
    expect(await scalar(db, 'select public.complete_workout($1) as value', [id])).toEqual(result);
    expect(
      await scalar<number>(
        db,
        'select count(*)::int as value from public.workout_records where session_id = $1',
        [id],
      ),
    ).toBe(1);
  });
  it('primerja največjo težo pri vaji in ne vsote serij', async () => {
    const id = await scalar(db, 'select public.start_workout($1, gen_random_uuid()) as value', [
      program,
    ]);
    await db.query('select public.save_workout_set($1, 1, 20, 30)', [id]);
    await db.query('select public.save_workout_set($1, 1, 1, 60)', [id]);
    const result = await scalar<{ workout_records: { weight_kg: number }[] }>(
      db,
      'select public.complete_workout($1) as value',
      [id],
    );
    expect(result.workout_records).toMatchObject([{ weight_kg: 60 }]);
  });
  it('tuji rekordi niso vidni in ne vplivajo na lastne rezultate', async () => {
    await actor(db, ids.other);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_records'),
    ).toBe(0);
    await expect(db.exec('delete from public.workout_records')).rejects.toThrow(
      /permission denied/,
    );
    const ownProgram = await scalar(db, 'select public.save_program($1::jsonb) as value', [
      JSON.stringify({
        name: 'Drug račun',
        exercises: [{ exercise_id: exercise, target_sets: 1, target_reps: 1 }],
      }),
    ]);
    const id = await scalar(db, 'select public.start_workout($1, gen_random_uuid()) as value', [
      ownProgram,
    ]);
    await db.query('select public.save_workout_set($1, 1, 1, 5)', [id]);
    expect(await scalar(db, 'select public.complete_workout($1) as value', [id])).toMatchObject({
      workout_records: [{ weight_kg: 5, previous_weight_kg: null }],
    });
  });
});
