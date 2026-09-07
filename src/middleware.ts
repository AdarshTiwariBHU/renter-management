import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE_NAME = 'renters_auth_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value || bearerToken;

  // Helper to safely parse role from JWT payload in Edge runtime without crypto dependencies
  let userRole: string | null = null;
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        userRole = payload.role ? String(payload.role).toUpperCase() : null;
      }
    } catch {
      userRole = null;
    }
  }

  const isAuthPage =
    pathname === '/login' ||
    pathname.startsWith('/login') ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/forgot-password');
  const isRegisterPage = pathname === '/register' || pathname.startsWith('/register');

  const isAdminProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/renters') ||
    pathname.startsWith('/rooms') ||
    pathname.startsWith('/electricity') ||
    pathname.startsWith('/bills') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/admin');

  const isRenterProtectedPage = pathname.startsWith('/renter');

  const isProtectedPage = isAdminProtectedPage || isRenterProtectedPage;

  const isProtectedApi =
    pathname.startsWith('/api/dashboard') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/renters') ||
    pathname.startsWith('/api/rooms') ||
    pathname.startsWith('/api/meters') ||
    pathname.startsWith('/api/meter-readings') ||
    pathname.startsWith('/api/bills') ||
    pathname.startsWith('/api/payments') ||
    pathname.startsWith('/api/transactions') ||
    pathname.startsWith('/api/reports') ||
    pathname.startsWith('/api/properties') ||
    pathname.startsWith('/api/renter');

  // Allow public access to Home Page "/"
  if (pathname === '/') {
    return NextResponse.next();
  }

  // If visiting login or register while already authenticated
  if ((isAuthPage || isRegisterPage) && token) {
    if (userRole === 'RENTER') return NextResponse.redirect(new URL('/renter/dashboard', request.url));
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If accessing protected page without token, redirect to login
  if (isProtectedPage && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Prevent RENTER from accessing Admin-only pages
  if (isAdminProtectedPage && token && userRole === 'RENTER') {
    return NextResponse.redirect(new URL('/renter/dashboard', request.url));
  }

  // If accessing protected API without token, return 401
  if (isProtectedApi && !token) {
    return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, uploads, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads/).*)',
  ],
};
