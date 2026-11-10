import { afterEach, expect, it, vi } from 'vitest';
import { createBackendClient } from '../src/supabase';

afterEach(() => vi.unstubAllGlobals());

it('ustvari dejanski Supabase odjemalec tudi brez native WebSocket na Node.js 20', async () => {
  const client = createBackendClient(
    'https://example.supabase.co',
    'test-public-key',
    'test-token',
  );
  expect(client.auth).toBeDefined();
  expect(client.from('users')).toBeDefined();
  await client.removeAllChannels();
});

it('pošlje isti uporabniški žeton tudi podatkovnemu API-ju po preverjanju prijave', async () => {
  const requests: { url: string; authorization: string | null }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, authorization: new Headers(init?.headers).get('authorization') });
      return new Response(
        JSON.stringify(url.includes('/auth/v1/user') ? { id: 'test-user' } : []),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }),
  );
  const client = createBackendClient(
    'https://example.supabase.co',
    'test-public-key',
    'test-user-token',
  );
  await client.auth.getUser('test-user-token');
  await client.from('users').select('id');
  expect(requests).toHaveLength(2);
  expect(requests.every((request) => request.authorization === 'Bearer test-user-token')).toBe(
    true,
  );
  await client.removeAllChannels();
});
