import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

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
  const supabase = createMiddlewareClient({ req, res });
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
