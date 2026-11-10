import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createApp } from '../src/app';

function setup(
  options: { invalid?: boolean; missing?: boolean; dbError?: boolean; offline?: boolean } = {},
) {
  const profile = { id: 'user-a', email: 'a@example.com', role: 'stranka' };
  const eq = vi.fn().mockReturnValue({
    maybeSingle: async () => ({
      data: options.missing ? null : profile,
      error: options.dbError ? {} : null,
    }),
  });
  const getUser = vi.fn(async () => {
    if (options.offline) throw new Error('unavailable');
    return {
      data: { user: options.invalid ? null : { id: 'user-a' } },
      error: options.invalid ? {} : null,
    };
  });
  const from = vi.fn().mockReturnValue({ select: () => ({ eq }) });
  const factory = vi.fn(() => ({ auth: { getUser }, from }) as unknown as SupabaseClient);
  return { app: createApp(factory), factory, eq, from };
}

describe('US-01 zaščiten API', () => {
  it.each([undefined, 'Basic abc', 'Bearer ', 'Bearer a b'])(
    'zavrne manjkajočo ali napačno avtentikacijo: %s',
    async (header) => {
      const { app, factory } = setup();
      const req = request(app).get('/api/me');
      if (header) req.set('Authorization', header);
      expect((await req).status).toBe(401);
      expect(factory).not.toHaveBeenCalled();
    },
  );
  it('zavrne neveljaven oziroma pretečen žeton pred branjem podatkov', async () => {
    const { app, from } = setup({ invalid: true });
    expect((await request(app).get('/api/me').auth('expired', { type: 'bearer' })).status).toBe(
      401,
    );
    expect(from).not.toHaveBeenCalled();
  });
  it('uporabi preverjeno identiteto in prezre podtaknjen ID', async () => {
    const { app, eq } = setup();
    const response = await request(app)
      .get('/api/me?id=user-b&role=administrator')
      .auth('valid', { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe('user-a');
    expect(eq).toHaveBeenCalledWith('id', 'user-a');
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('ne vrne profila, ki ga RLS zavrne (npr. po odjavi)', async () => {
    const { app } = setup({ missing: true });
    expect((await request(app).get('/api/me').auth('revoked', { type: 'bearer' })).status).toBe(
      403,
    );
  });
  it.each([{ dbError: true }, { offline: true }])(
    'varno obravnava nedostopno storitev %j',
    async (options) => {
      const { app } = setup(options);
      expect((await request(app).get('/api/me').auth('valid', { type: 'bearer' })).status).toBe(
        503,
      );
    },
  );
});
