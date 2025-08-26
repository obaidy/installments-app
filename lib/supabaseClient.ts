import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { AuthResponse, AuthError, PostgrestError } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

export const grantManagerRole = (userId: string, complexId: number) =>
  supabase
    .from('complex_roles')
    .upsert({ user_id: userId, complex_id: complexId, role: 'manager' });

export const grantComplexRole = (
  userId: string,
  complexId: number,
  role: string,
) =>
  supabase
    .from('complex_roles')
    .upsert({ user_id: userId, complex_id: complexId, role });

export const revokeComplexRole = (userId: string, complexId: number) =>
  supabase
    .from('complex_roles')
    .delete()
    .eq('user_id', userId)
    .eq('complex_id', complexId);

export const getUserComplexRole = async (
  complexId: number,
): Promise<string | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data, error: roleError } = await supabase
    .from('complex_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('complex_id', complexId)
    .single();

  if (roleError || !data) return null;
  return data.role as string;
};