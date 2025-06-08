import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line import/no-unresolved
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants.manifest?.extra || {};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();
