import { createClient, type WebSocketLikeConstructor } from '@supabase/supabase-js';
import WebSocket from 'ws';

type TransportDiagnostic = {
  network_error: string | null;
  response_status: number | null;
  response_type: string | null;
};
const diagnostics = new WeakMap<object, TransportDiagnostic>();
export function clientTransportDiagnostic(client: object) {
  return diagnostics.get(client);
}

export async function checkAuthConnection(url: string, key: string) {
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(8000),
    });
    return {
      reachable: response.ok,
      upstream_status: response.status,
      network_error: null,
      runtime: process.version,
    };
  } catch (error) {
    const failure = error as { name?: string; code?: string; cause?: { code?: string } };
    return {
      reachable: false,
      upstream_status: 0,
      network_error: failure.cause?.code ?? failure.code ?? failure.name ?? 'UNKNOWN',
      runtime: process.version,
    };
  }
}

export function createBackendClient(url: string, key: string, token: string) {
  const diagnostic: TransportDiagnostic = {
    network_error: null,
    response_status: null,
    response_type: null,
  };
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: async (input, init) => {
        try {
          const response = await fetch(input, init);
          diagnostic.network_error = null;
          diagnostic.response_status = response.status;
          diagnostic.response_type = response.headers.get('content-type');
          return response;
        } catch (error) {
          const failure = error as { name?: string; code?: string; cause?: { code?: string } };
          diagnostic.network_error =
            failure.cause?.code ?? failure.code ?? failure.name ?? 'UNKNOWN';
          throw error;
        }
      },
    },
    // ws uporablja drugačne tipe dogodkov kot DOM, vendar podpira zahtevani vmesnik.
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  });
  diagnostics.set(client, diagnostic);
  return client;
}
