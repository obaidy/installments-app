import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { AuthResponse, AuthError, PostgrestError } from '@supabase/supabase-js';

// const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
// const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient("https://ulfucdrhbmmfqgqpcgsf.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZnVjZHJoYm1tZnFncXBjZ3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzA1NjAsImV4cCI6MjA2NDkwNjU2MH0.Q8i0BiqN_D0IFOBIzF5MLvd564ZO9xeAJokuAWq_lmQ");

export const signUp = async (
  email: string,
  password: string,
): Promise<{ data: AuthResponse['data']; error: AuthError | null; roleError: PostgrestError | null }> => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  let roleError: PostgrestError | null = null;

  if (data.user) {
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role: 'user' });

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