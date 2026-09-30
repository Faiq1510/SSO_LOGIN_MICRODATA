import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  const isAuthPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login';

  // 1. Authenticated Guest Guard: Jika user sudah login, larang akses ke Landing Page & Login
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Protect Dashboard Routes from unauthenticated users
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/inventory') ||
                           request.nextUrl.pathname.startsWith('/borrowings') ||
                           request.nextUrl.pathname.startsWith('/maintenance') ||
                           request.nextUrl.pathname.startsWith('/approval') ||
                           request.nextUrl.pathname.startsWith('/users') ||
                           request.nextUrl.pathname.startsWith('/audit-logs') ||
                           request.nextUrl.pathname.startsWith('/tracking') ||
                           request.nextUrl.pathname.startsWith('/profile');

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Jalankan middleware untuk semua route kecuali static assets & api
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|gif|webp)).*)',
  ],
};
