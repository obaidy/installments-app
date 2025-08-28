import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow public routes
  if (pathname.startsWith('/auth')) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) return NextResponse.next();

  // If we don't have the simple auth cookie, force login
  const access = req.cookies.get('sb-access-token')?.value;
  if (!access) {
    const loginUrl = new URL(`/auth/login?next=${encodeURIComponent(pathname + search)}`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

