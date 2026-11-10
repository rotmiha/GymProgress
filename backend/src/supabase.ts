import { createClient, type WebSocketLikeConstructor } from '@supabase/supabase-js';
import WebSocket from 'ws';

export function createBackendClient(url: string, key: string, token: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
    // ws uporablja drugačne tipe dogodkov kot DOM, vendar podpira zahtevani vmesnik.
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  });
}
