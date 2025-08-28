import { createClient } from '@supabase/supabase-js';
import { getSupabaseKeys } from '@installments/config';
import type { Database } from '@installments/db-types/src/database';

const { url, anonKey } = getSupabaseKeys();
export const supabase = createClient<Database>(url, anonKey);
