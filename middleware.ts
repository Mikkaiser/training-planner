import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

/** Auth pages that signed-in users should leave (not reset-password: recovery session). */
const AUTH_ROUTES_REDIRECT_WHEN_AUTHENTICATED = ["/login", "/signup", "/forgot-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/plans", "/phases", "/exercises", "/competitors"] as const;

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES_REDIRECT_WHEN_AUTHENTICATED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/plans";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
    "/plans/:path*",
    "/phases/:path*",
    "/exercises/:path*",
    "/competitors/:path*",
  ],
};

