import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PIRSCH_API = 'https://api.pirsch.io/api/v1/hit';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return response;
  }

  const accessToken = process.env.PIRSCH_ACCESS_TOKEN;
  if (!accessToken) return response;

  const host = request.headers.get('host') || request.nextUrl.host;
  const url = `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const referrer = request.headers.get('referer') || '';

  await fetch(PIRSCH_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url,
      ip,
      user_agent: userAgent,
      accept_language: acceptLanguage,
      referrer,
    }),
  }).catch(() => {});

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
