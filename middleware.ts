import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isOnAddWordPage = request.nextUrl.pathname.startsWith('/add-word');

    // Check for session via cookie
    const sessionToken = request.cookies.get('authjs.session-token') ||
        request.cookies.get('__Secure-authjs.session-token');

    const isLoggedIn = !!sessionToken;

    if (isOnAddWordPage && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
