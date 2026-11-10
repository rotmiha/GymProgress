import { createClient } from '@supabase/supabase-js';
import { createApp } from './app.js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Nastavite SUPABASE_URL in SUPABASE_PUBLISHABLE_KEY v backend/.env.');
const app = createApp(token => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { Authorization: `Bearer ${token}` } },
}));
app.listen(Number(process.env.PORT ?? 3001), '127.0.0.1', () => console.log('GymProgress API je pripravljen.'));
