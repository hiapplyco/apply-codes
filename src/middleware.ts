import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/job-post',
  '/job-editor',
  '/content-creation',
  '/sourcing',
  '/enrichment',
  '/meeting',
  '/chat',
  '/report',
  '/analytics',
  '/projects',
  '/profile',
  '/documentation',
];

// Clarvida routes that require Clarvida auth
const CLARVIDA_PROTECTED_ROUTES = ['/clarvida/sourcing'];

// Public routes that don't need auth
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/pricing',
  '/checkout',
  '/integrations',
  '/auth/callback',
  '/reset-password-request',
  '/reset-password',
  '/clarvida/login',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is Clarvida protected
  const isClarvidaProtected = CLARVIDA_PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // For now, auth checking happens client-side via ProtectedRoute component
  // and ClarvidaProtectedRoute component (they use Firebase Auth which is client-only)
  // This middleware can be enhanced later with Firebase Admin SDK for server-side auth

  // Let all requests through — auth is handled by client-side wrappers
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
