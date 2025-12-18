import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route restructuring and auth-aware redirects
 * 
 * Routes:
 * - /dashboard → /home (redirect for authenticated users)
 * - /feed → /home (redirect for authenticated users)
 * - / → /home (authenticated or anonymous homepage)
 */
export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Check for auth token (simplified - in production, validate properly)
    const authToken = request.cookies.get('auth_token')?.value ||
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('access_token')?.value;

    const isAuthenticated = !!authToken;

    // Redirect /dashboard to /home
    if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    // Redirect /feed to /home
    if (pathname === '/feed') {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
    matcher: [
        // Match /dashboard
        '/dashboard',
        // Match /feed
        '/feed',
        // Match root
        '/',
        // Exclude static files and API routes
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
