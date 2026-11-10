import { Router, type Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

export function databaseResponse(
  res: Response,
  result: { data: unknown; error: { code?: string; message: string } | null },
  status = 200,
) {
  if (result.error) {
    const code = result.error.code ?? '';
    const forbidden = code === '42501';
    const schemaMissing = [
      'PGRST202',
      'PGRST200',
      'PGRST204',
      'PGRST205',
      '42P01',
      '42703',
      '42883',
    ].includes(code);
    const invalid = code.startsWith('22') || code.startsWith('23') || code === 'P0001';
    res.status(forbidden ? 403 : invalid ? 400 : 503).json({
      error:
        forbidden || code === '22023' || code === 'P0001'
          ? result.error.message
          : invalid
            ? 'Preverite vnesene podatke in izbrane zapise.'
            : schemaMissing
              ? 'Podatkovna baza še ni posodobljena za to dejanje.'
              : 'Podatkov trenutno ni mogoče obdelati.',
      code: code || 'DATABASE_UNAVAILABLE',
    });
  } else {
    res.status(status).json(result.data);
  }
}

export function featureRoutes() {
  const router = Router();
  const client = (res: Response) => res.locals.client as SupabaseClient;

  router.get('/exercises', async (_req, res) => {
    databaseResponse(res, await client(res).from('exercises').select('*').order('name'));
  });
  router.get('/programs', async (_req, res) => {
    databaseResponse(
      res,
      await client(res)
        .from('workout_programs')
        .select('*,program_exercises(*,exercises(*))')
        .order('created_at', { ascending: false }),
    );
  });
  router.post('/programs', async (req, res) => {
    databaseResponse(res, await client(res).rpc('save_program', { payload: req.body }), 201);
  });
  router.put('/programs/:id', async (req, res) => {
    databaseResponse(
      res,
      await client(res).rpc('save_program', { payload: req.body, program: req.params.id }),
    );
  });
  router.get('/connections', async (_req, res) => {
    databaseResponse(res, await client(res).rpc('list_connections'));
  });
  router.post('/connections', async (req, res) => {
    databaseResponse(
      res,
      await client(res).rpc('invite_client', { email_address: req.body?.email }),
      201,
    );
  });
  router.patch('/connections/:id', async (req, res) => {
    databaseResponse(
      res,
      await client(res).rpc('respond_invitation', {
        invitation: req.params.id,
        decision: req.body?.status,
      }),
    );
  });
  router.get('/clients/:id', async (req, res) => {
    databaseResponse(res, await client(res).rpc('get_client_profile', { client: req.params.id }));
  });
  router.get('/assignments', async (_req, res) => {
    databaseResponse(
      res,
      await client(res)
        .from('program_assignments')
        .select('*,workout_programs(*,program_exercises(*,exercises(*)))')
        .order('assigned_at', { ascending: false }),
    );
  });
  router.post('/assignments', async (req, res) => {
    databaseResponse(
      res,
      await client(res).rpc('assign_program', {
        program: req.body?.program_id,
        trainee: req.body?.trainee_id,
      }),
      201,
    );
  });
  router.get('/sessions', async (_req, res) => {
    databaseResponse(
      res,
      await client(res)
        .from('workout_sessions')
        .select('*,workout_sets(*),workout_records(*,exercises(name))')
        .eq('trainee_id', res.locals.profile.id)
        .order('started_at', { ascending: false })
        .limit(50),
    );
  });
  router.get('/clients/:id/sessions', async (req, res) => {
    const permission = await client(res).rpc('get_client_profile', { client: req.params.id });
    if (permission.error) {
      databaseResponse(res, permission);
      return;
    }
    databaseResponse(
      res,
      await client(res)
        .from('workout_sessions')
        .select('*,workout_sets(*),workout_records(*,exercises(name))')
        .eq('trainee_id', req.params.id)
        .order('started_at', { ascending: false })
        .limit(50),
    );
  });
  router.post('/sessions', async (req, res) => {
    databaseResponse(
      res,
      await client(res).rpc('start_workout', {
        program: req.body?.program_id,
        request_id: req.body?.request_id,
      }),
      201,
    );
  });
  router.post('/sessions/:id/sets', async (req, res) => {
    databaseResponse(
      res,
      await client(res).rpc('save_workout_set', {
        p_session: req.params.id,
        p_position: req.body?.exercise_position,
        p_reps: req.body?.reps,
        p_weight: req.body?.weight_kg,
      }),
      201,
    );
  });
  router.put('/sessions/:id/sets/:setId', async (req, res) => {
    databaseResponse(
      res,
      await client(res).rpc('save_workout_set', {
        p_session: req.params.id,
        p_set: req.params.setId,
        p_position: req.body?.exercise_position,
        p_reps: req.body?.reps,
        p_weight: req.body?.weight_kg,
      }),
    );
  });
  router.delete('/sessions/:id/sets/:setId', async (req, res) => {
    databaseResponse(
      res,
      await client(res).rpc('delete_workout_set', {
        p_session: req.params.id,
        p_set: req.params.setId,
      }),
    );
  });
  router.post('/sessions/:id/complete', async (req, res) => {
    databaseResponse(res, await client(res).rpc('complete_workout', { p_session: req.params.id }));
  });
  return router;
}
