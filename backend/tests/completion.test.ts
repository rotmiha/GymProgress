import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('US-06 zaključek in volumen', () => {
  let db: PGlite;
  let session: string;
  let set: string;
  beforeAll(async () => {
    db = await database();
    await actor(db, ids.client);
    const exercise = await scalar(db, 'select id as value from public.exercises limit 1');
    const program = await scalar(db, 'select public.save_program($1::jsonb) as value', [
      JSON.stringify({
        name: 'Volumen',
        exercises: [{ exercise_id: exercise, target_sets: 3, target_reps: 10 }],
      }),
    ]);
    session = await scalar(db, 'select public.start_workout($1, gen_random_uuid()) as value', [
      program,
    ]);
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });
  it('ne zaključi praznega treninga', async () => {
    await expect(db.query('select public.complete_workout($1)', [session])).rejects.toThrow(
      /vsaj eno/,
    );
  });
  it('izračuna točen volumen in ohrani isti rezultat ob ponovitvi', async () => {
    set = await scalar(db, 'select public.save_workout_set($1, 1, 10, 20) as value', [session]);
    await db.query('select public.save_workout_set($1, 1, 5, 12.5)', [session]);
    const first = await scalar<{ total_volume_kg: number; completed_at: string }>(
      db,
      'select public.complete_workout($1) as value',
      [session],
    );
    expect(Number(first.total_volume_kg)).toBe(262.5);
    expect(first.completed_at).toBeTruthy();
    expect(await scalar(db, 'select public.complete_workout($1) as value', [session])).toEqual(
      first,
    );
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_sessions'),
    ).toBe(1);
  });
  it('zaklenjene serije niso več spremenljive', async () => {
    await expect(
      db.query('select public.save_workout_set($1, 1, 1, 0, $2)', [session, set]),
    ).rejects.toThrow(/Zaključenega/);
    await expect(
      db.query('select public.delete_workout_set($1, $2)', [session, set]),
    ).rejects.toThrow(/Zaključenega/);
    await expect(
      db.exec('update public.workout_sessions set total_volume_kg = 999'),
    ).rejects.toThrow(/permission denied/);
  });
  it('drug uporabnik ne more zaključiti tujega treninga', async () => {
    await actor(db, ids.other);
    await expect(db.query('select public.complete_workout($1)', [session])).rejects.toThrow(
      /samo svoj/,
    );
  });
});
