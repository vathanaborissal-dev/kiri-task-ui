import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isPublicAuthPath } from '@/lib/auth-routes';

/**
 * Optimistic routing only: it redirects based on the presence of the refresh
 * cookie so signed-out visitors never see the app shell flash. Real
 * authorisation happens in the API on every request.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has('kiri_rt');
  const isPublic = isPublicAuthPath(pathname);

  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasSession ? '/dashboard' : '/login', request.url));
  }

  if (!hasSession && !isPublic) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === '/login' || pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
