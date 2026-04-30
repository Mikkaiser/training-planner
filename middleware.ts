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
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          request.cookies.set({ name, value, ...(options as object) });
          response.cookies.set({ name, value, ...(options as object) });
        },
        remove: (name: string, options: Record<string, unknown>) => {
          request.cookies.set({ name, value: "", ...(options as object) });
          response.cookies.set({ name, value: "", ...(options as object) });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtected =
    !request.nextUrl.pathname.startsWith(APP_ROUTES.login) &&
    !request.nextUrl.pathname.startsWith("/auth");

  if (!session && isProtected) {
    return NextResponse.redirect(new URL(APP_ROUTES.login, request.url));
  }

  if (session && request.nextUrl.pathname === APP_ROUTES.login) {
    return NextResponse.redirect(new URL(APP_ROUTES.home, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
