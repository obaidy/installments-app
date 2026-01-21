import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export async function GET() {
  const cookieStore = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value; },
      set(name, value, options) { cookieStore.set({ name, value, ...options }); },
      remove(name, options) { cookieStore.set({ name, value: '', ...options, maxAge: 0 }); },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ user: null });
  const { data: roleRow } = await sb.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  return NextResponse.json({ user: { id: user.id, email: user.email }, role: roleRow?.role ?? null });
}
