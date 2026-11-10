import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('US-04 dodeljevanje programov', () => {
  let db: PGlite;
  let program: string;
  let invitation: string;
  beforeAll(async () => {
    db = await database();
    await actor(db, ids.trainer);
    const exercise = await scalar(db, 'select id as value from public.exercises limit 1');
    program = await scalar(db, 'select public.save_program($1::jsonb) as value', [
      JSON.stringify({
        name: 'Trenerjev program',
        exercises: [{ exercise_id: exercise, target_sets: 3, target_reps: 10 }],
      }),
    ]);
    invitation = await scalar(db, "select public.invite_client('client@example.com') as value");
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });
  it('pred potrditvijo ne omogoči dodelitve ali branja programa', async () => {
    await expect(
      db.query('select public.assign_program($1, $2)', [program, ids.client]),
    ).rejects.toThrow(/potrjeno/);
    await actor(db, ids.client);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_programs'),
    ).toBe(0);
    await expect(
      db.query('select public.assign_program($1, $2)', [program, ids.client]),
    ).rejects.toThrow(/dovoljenja/);
    await db.query("select public.respond_invitation($1, 'accepted')", [invitation]);
  });
  it('dodeli samo enkrat in odpre program le prejemniku', async () => {
    await actor(db, ids.trainer);
    const assignment = await scalar(db, 'select public.assign_program($1, $2) as value', [
      program,
      ids.client,
    ]);
    expect(
      await scalar(db, 'select public.assign_program($1, $2) as value', [program, ids.client]),
    ).toBe(assignment);
    await actor(db, ids.client);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_programs'),
    ).toBe(1);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.program_exercises'),
    ).toBe(1);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.program_assignments'),
    ).toBe(1);
    await actor(db, ids.other);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_programs'),
    ).toBe(0);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.program_assignments'),
    ).toBe(0);
  });
  it('prepreči dodelitev tujega programa in spremembe prek tabel', async () => {
    await actor(db, ids.stranger);
    await expect(
      db.query('select public.assign_program($1, $2)', [program, ids.client]),
    ).rejects.toThrow(/lasten/);
    await expect(db.exec('delete from public.program_assignments')).rejects.toThrow(
      /permission denied/,
    );
  });
});
