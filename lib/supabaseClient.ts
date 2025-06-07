import 'react-native-url-polyfill/auto';
import { createClient, SignInWithPasswordCredentials, SignUpWithPasswordCredentials, Session, AuthChangeEvent } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signUp(credentials: SignUpWithPasswordCredentials) {
  return await supabase.auth.signUp(credentials);
}

export async function signIn(credentials: SignInWithPasswordCredentials) {
  return await supabase.auth.signInWithPassword(credentials);
}

export function signOut() {
  return supabase.auth.signOut();
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
