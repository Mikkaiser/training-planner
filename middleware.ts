import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { APP_ROUTES } from "@/lib/routes";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...(options ?? {}) });
            response.cookies.set({ name, value, ...(options ?? {}) });
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected =
    !request.nextUrl.pathname.startsWith(APP_ROUTES.login) &&
    !request.nextUrl.pathname.startsWith("/auth");

  // Carry any cookies the Supabase client refreshed onto a redirect response,
  // otherwise a token rotation during getUser() would be lost on redirect.
  const redirectTo = (path: string) => {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  };

  if (!user && isProtected) {
    return redirectTo(APP_ROUTES.login);
  }

  if (user && request.nextUrl.pathname === APP_ROUTES.login) {
    return redirectTo(APP_ROUTES.home);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
