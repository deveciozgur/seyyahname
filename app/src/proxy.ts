// Page gate: without a valid session every page redirects to /unlock (the anonymous PIN screen);
// with one, /unlock goes back to the app. API routes check the session themselves.
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/server/session';

const APP_PATHS = new Set(['/', '/curriculum', '/vault', '/archive', '/coach']);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (pathname === '/unlock') {
    if (!authed) return NextResponse.next();
    const back = req.nextUrl.searchParams.get('next');
    return NextResponse.redirect(new URL(back && APP_PATHS.has(back) ? back : '/', req.url));
  }
  if (authed) return NextResponse.next();
  const url = new URL('/unlock', req.url);
  if (APP_PATHS.has(pathname) && pathname !== '/') url.searchParams.set('next', pathname);
  return NextResponse.redirect(url, { headers: { 'Cache-Control': 'no-store' } });
}

export const config = {
  // Everything except the API, build assets and public metadata files.
  matcher: ['/((?!api/|_next/static|_next/image|icon.svg|robots.txt|opengraph-image|twitter-image|favicon.ico).*)'],
};
