import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const LOCALE_PREFIX = /^\/(en|vi|zh)(?=\/|$)/;

function localeOf(pathname: string): string {
  const match = pathname.match(LOCALE_PREFIX);
  return match ? match[1] : routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  // 1. next-intl handles locale detection / redirect / rewrite first.
  const response = intlMiddleware(request);

  // 2. Refresh the Supabase auth session, writing any rotated cookies onto
  //    the response that next-intl produced.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Route gating.
  const pathname = request.nextUrl.pathname;
  const locale = localeOf(pathname);
  const isAuthRoute = /^\/(en|vi|zh)\/login(?=\/|$)/.test(pathname);

  const redirectTo = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = '';
    const redirect = NextResponse.redirect(url);
    // Preserve refreshed auth cookies across the redirect.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && !isAuthRoute) {
    return redirectTo(`/${locale}/login`);
  }

  if (user && isAuthRoute) {
    return redirectTo(`/${locale}`);
  }

  return response;
}

export const config = {
  // Run on the home page and all localized pages, skipping Next internals and
  // static assets. API routes manage their own auth.
  matcher: ['/', '/(vi|en|zh)/:path*'],
};
