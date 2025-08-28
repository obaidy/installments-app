import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseService = createClient(url, serviceRole);

