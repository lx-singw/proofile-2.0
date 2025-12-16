import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route restructuring and auth-aware redirects
 * 
 * Routes:
 * - /dashboard → /feed (redirect for authenticated users)
 * - / → /feed (authenticated) or homepage (anonymous)
 * - /feed → /jobs (if not authenticated, redirect to jobs portal)
 */
export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Check for auth token (simplified - in production, validate properly)
    const authToken = request.cookies.get('auth_token')?.value ||
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('access_token')?.value;

    const isAuthenticated = !!authToken;

    // Redirect /dashboard to /feed
    if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/feed', request.url));
    }

    // If accessing /feed without auth, redirect to /jobs (public jobs portal)
    // Note: Comment out if you want /feed to show login prompt instead
    // if (pathname === '/feed' && !isAuthenticated) {
    //     return NextResponse.redirect(new URL('/jobs', request.url));
    // }

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
