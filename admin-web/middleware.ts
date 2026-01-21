import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic =
    path.startsWith('/auth') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/api/health') ||
    path.startsWith('/api/whoami'); // keep simple diagnostics reachable

  const res = NextResponse.next();

  // This both reads AND refreshes Supabase session cookies for all routes (pages + API)
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return req.cookies.get(name)?.value;
      },
      set(name, value, options) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        res.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', path + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  return res; // Important: return the response that carries refreshed cookies
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
