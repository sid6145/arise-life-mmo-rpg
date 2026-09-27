import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth routes, static assets, Next internals, offline fallback, and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/signin') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/~offline') ||
    pathname.startsWith('/offline') ||
    pathname.includes('.') // static files like favicon.ico, images, sw.js, manifest.json, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Check for Auth.js session token cookie
  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  // 3. If unauthenticated, redirect to /signin with callbackUrl
  if (!sessionToken) {
    const signInUrl = new URL('/signin', request.url);
    if (pathname !== '/') {
      signInUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
