import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, validSession } from '@/lib/server/auth';

// Optimistic page gate. API routes verify the session themselves.
export function proxy(request: NextRequest) {
  const signedIn = validSession(request.cookies.get(SESSION_COOKIE)?.value);
  const onLogin = request.nextUrl.pathname === '/login';
  if (!signedIn && !onLogin) return NextResponse.redirect(new URL('/login', request.url));
  if (signedIn && onLogin) return NextResponse.redirect(new URL('/', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|icon.png|favicon.ico|logo.png|logo-mark.png).*)'],
};
