import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('dodelitev na obstoječi bazi brez sestavljene UNIQUE omejitve', () => {
  let db: PGlite;
  let program: string;
  let existingProgram: string;
  let existingRows: unknown[];
  beforeAll(async () => {
    db = await database();
    await actor(db, ids.trainer);
    const exercise = await scalar(db, 'select id as value from public.exercises limit 1');
    for (const name of ['Nov program', 'Obstoječ program']) {
      const id = await scalar(db, 'select public.save_program($1::jsonb) as value', [
        JSON.stringify({
          name,
          exercises: [{ exercise_id: exercise, target_sets: 3, target_reps: 10 }],
        }),
      ]);
      if (name === 'Nov program') program = id;
      else existingProgram = id;
    }
    const invitation = await scalar(
      db,
      "select public.invite_client('client@example.com') as value",
    );
    await actor(db, ids.client);
    await db.query("select public.respond_invitation($1, 'accepted')", [invitation]);
    await db.exec('reset role');
    await db.exec(
      'alter table public.program_assignments drop constraint program_assignments_program_id_trainee_id_key',
    );
    await db.query(
      'insert into public.program_assignments(program_id, trainee_id, assigned_by) values ($1, $2, $3)',
      [existingProgram, ids.client, ids.trainer],
    );
    existingRows = (await db.query('select * from public.program_assignments')).rows;

    // Posnema prvotno funkcijo in stare politike, ki prejemniku skrijejo program.
    const original = await readFile(
      new URL('../../supabase/migrations/202611100005_assignments.sql', import.meta.url),
      'utf8',
    );
    const definition = original.slice(
      original.indexOf('create function public.assign_program('),
      original.indexOf('revoke all on function public.assign_program'),
    );
    await db.exec(definition.replace('create function', 'create or replace function'));
    await db.exec(`drop policy programs_read on public.workout_programs;
      create policy programs_read on public.workout_programs for select to authenticated using (owner_id = auth.uid());
      create policy old_assignment_restriction on public.program_assignments as restrictive for select to authenticated using (false);`);
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });

  it('reproducira prijavljeno napako 42P10', async () => {
    await actor(db, ids.trainer);
    await expect(
      db.query('select public.assign_program($1, $2)', [program, ids.client]),
    ).rejects.toMatchObject({ code: '42P10' });
  });

  it('popravek ohrani obstoječe dodelitve in prepreči podvojitve brez UNIQUE', async () => {
    await db.exec('reset role');
    const repair = await readFile(
      new URL(
        '../../supabase/migrations/202611100010_assignment_legacy_schema.sql',
        import.meta.url,
      ),
      'utf8',
    );
    await db.exec(repair);
    await db.exec(repair);
    expect((await db.query('select * from public.program_assignments')).rows).toEqual(existingRows);
    await actor(db, ids.trainer);
    const first = await scalar(db, 'select public.assign_program($1, $2) as value', [
      program,
      ids.client,
    ]);
    expect(
      await scalar(db, 'select public.assign_program($1, $2) as value', [program, ids.client]),
    ).toBe(first);
    expect(
      await scalar<number>(
        db,
        'select count(*)::int as value from public.program_assignments where program_id = $1',
        [program],
      ),
    ).toBe(1);
  });

  it('stranka vidi dodelitev in vaje ter lahko iz programa začne svoj trening', async () => {
    await actor(db, ids.client);
    expect(
      await scalar<number>(
        db,
        'select count(*)::int as value from public.program_assignments where program_id = $1',
        [program],
      ),
    ).toBe(1);
    expect(
      await scalar<number>(
        db,
        'select count(*)::int as value from public.workout_programs where id = $1',
        [program],
      ),
    ).toBe(1);
    expect(
      await scalar<number>(
        db,
        'select count(*)::int as value from public.program_exercises where program_id = $1',
        [program],
      ),
    ).toBe(1);
    expect(
      await scalar(db, 'select public.start_workout($1, gen_random_uuid()) as value', [program]),
    ).toBeTruthy();
    await actor(db, ids.other);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.program_assignments'),
    ).toBe(0);
    expect(
      await scalar<number>(db, 'select count(*)::int as value from public.workout_programs'),
    ).toBe(0);
    await expect(
      db.query('select public.assign_program($1, $2)', [program, ids.other]),
    ).rejects.toThrow(/dovoljenja/);
    await expect(db.exec('delete from public.program_assignments')).rejects.toThrow(
      /permission denied/,
    );
  });
});
