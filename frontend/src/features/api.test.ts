import { afterEach, expect, it, vi } from 'vitest';
import { ApiError, createApi, errorMessage } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('ohrani kodo napake API-ja in jo v razvoju pokaže ob sporočilu', async () => {
  vi.stubEnv('DEV', true);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Podatkov trenutno ni mogoče obdelati.', code: '42703' }),
    }),
  );
  const api = createApi('test-token');
  let failure: unknown;
  try {
    await api('/sessions', 'POST', {});
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(ApiError);
  expect(errorMessage(failure)).toBe('Podatkov trenutno ni mogoče obdelati. (koda: 42703)');
});

it('v produkciji ohrani uporabniško sporočilo brez razvojne kode', () => {
  vi.stubEnv('DEV', false);
  expect(errorMessage(new ApiError('Zahteva ni uspela.', '42703'))).toBe('Zahteva ni uspela.');
});
