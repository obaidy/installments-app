// Loads the root .env *before* reading process.env
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

/**
 * Resolve env safely. Server should use SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * We include NEXT_PUBLIC_/EXPO_PUBLIC_ fallbacks only to help local setups,
 * but do not rely on them in production.
 */
function pickEnv(...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim().length > 0) return v.trim();
  }
  return '';
}

const supabaseUrl = pickEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL');
const serviceKey =
  pickEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY'); // allow alternative naming

if (!supabaseUrl) {
  throw new Error(
    'SUPABASE_URL is missing. Add it to your root .env (server). ' +
    'Example: SUPABASE_URL=https://<project-ref>.supabase.co'
  );
}
if (!serviceKey || serviceKey.length < 50) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is missing or invalid. ' +
    'Put the *service_role* key from Supabase Settings → API into your root .env.'
  );
}

/**
 * Admin/service client (bypasses RLS when your Postgres policies allow).
 * NOTE: Never expose this key to the browser/mobile code.
 */
export const supabaseService = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Optional compatibility export if other files import { supabase } from here
export const supabase = supabaseService;

export default supabaseService;
