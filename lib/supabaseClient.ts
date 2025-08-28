import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { getSupabaseKeys } from '@installments/config';
import type { Database } from '@installments/db-types/src/database';

import type { AuthResponse, AuthError, PostgrestError } from '@supabase/supabase-js';

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = getSupabaseKeys();
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export const signUp = async (
  email: string,
  password: string,
): Promise<{ data: AuthResponse['data']; error: AuthError | null; roleError: PostgrestError | null }> => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  let roleError: PostgrestError | null = null;

  if (data.user) {
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role: 'client' });

    roleError = insertError;
    // Initialize pending status and profile
    try {
      await supabase.from('user_status').upsert({ user_id: data.user.id, status: 'pending' });
      await supabase.from('profiles').upsert({ user_id: data.user.id, email });
    } catch {}
  }

  return { data, error, roleError };
};

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();
export const getCurrentUserRole = async (): Promise<string | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

    if (roleError || !data) return null;
  return data.role as string;
};

export const grantAdminRole = (userId: string) =>
  supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' });

export const addUserToComplex = (userId: string, complexId: number) =>
  supabase.from('user_complexes').insert({ user_id: userId, complex_id: complexId });

export const removeUserFromComplex = (userId: string, complexId: number) =>
  supabase
    .from('user_complexes')
    .delete()
    .eq('user_id', userId)
    .eq('complex_id', complexId);
