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
    const invalid = code.startsWith('22') || code.startsWith('23') || code === 'P0001';
    res.status(forbidden ? 403 : invalid ? 400 : 503).json({
      error:
        forbidden || code === '22023' || code === 'P0001'
          ? result.error.message
          : invalid
            ? 'Preverite vnesene podatke in izbrane zapise.'
            : 'Podatkov trenutno ni mogoče obdelati.',
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
  return router;
}
