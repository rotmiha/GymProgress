import express from 'express';
import helmet from 'helmet';
import type { SupabaseClient } from '@supabase/supabase-js';
import { featureRoutes } from './features.js';

export function createApp(clientForToken: (token: string) => SupabaseClient) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(express.json({ limit: '64kb' }));
  app.use('/api', async (req, res, next) => {
    const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '');
    if (!match) {
      res.status(401).json({ error: 'Za dostop se prijavite.' });
      return;
    }
    try {
      const client = clientForToken(match[1]);
      const {
        data: { user },
        error,
      } = await client.auth.getUser(match[1]);
      if (error || !user) {
        res.status(401).json({ error: 'Seja ni veljavna. Ponovno se prijavite.' });
        return;
      }
      // Identiteta izvira iz preverjenega žetona. RLS dodatno preveri aktivno sejo.
      const { data: profile, error: profileError } = await client
        .from('users')
        .select('id,email,ime,priimek,role,created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (profileError) {
        res.status(503).json({ error: 'Profila trenutno ni mogoče prebrati.' });
        return;
      }
      if (!profile) {
        res.status(403).json({ error: 'Profil ni dostopen ali pa je seja zaključena.' });
        return;
      }
      res.locals.client = client;
      res.locals.profile = profile;
      next();
    } catch {
      res.status(503).json({ error: 'Storitev trenutno ni dosegljiva.' });
    }
  });
  app.get('/api/me', (_req, res) => {
    res.json(res.locals.profile);
  });
  app.use('/api', featureRoutes());
  app.use(
    (
      error: { status?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const invalid = error.status === 400 || error.status === 413;
      res.status(invalid ? error.status! : 503).json({
        error: invalid ? 'Neveljavna ali prevelika zahteva.' : 'Storitev trenutno ni dosegljiva.',
      });
    },
  );
  return app;
}
