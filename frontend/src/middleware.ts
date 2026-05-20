import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route restructuring and legacy redirects
 * 
 * Routes:
 * - /dashboard → /home (redirect)
 * - /feed → /home (redirect)
 * - /jobs/* → /opportunities/* (legacy redirect)
 */
export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Redirect /dashboard to /opportunities
    if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/opportunities', request.url));
    }

    // Redirect /feed to /opportunities
    if (pathname === '/feed') {
        return NextResponse.redirect(new URL('/opportunities', request.url));
    }

    // Redirect legacy /jobs routes to /opportunities
    if (pathname.startsWith('/jobs')) {
        const newPath = pathname.replace('/jobs', '/opportunities');
        return NextResponse.redirect(new URL(newPath, request.url));
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
