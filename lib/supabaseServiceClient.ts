import { createClient } from '@supabase/supabase-js';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

// Always load the repo root .env, and override any empty shell vars.
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  override: true,
});

/**
 * Server-only Supabase service client.
 * Do NOT import this from browser or Expo code.
 */
const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  '';

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ?? // optional alias
  '';

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required (.env at repo root).');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is missing. Paste the *service_role* key from Supabase → Settings → API into your root .env.'
  );
}

export const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Optional alias to match existing imports
export const supabase = supabaseService;

export default supabaseService;
