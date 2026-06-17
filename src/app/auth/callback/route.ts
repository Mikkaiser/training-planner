import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { APP_ROUTES } from "@/lib/routes";

/** Only allow same-origin relative redirects (a single leading "/", never "//"). */
function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return APP_ROUTES.home;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(APP_ROUTES.login, request.url));
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          cookieStore.set({ name, value, ...(options as object) });
        },
        remove: (name: string, options: Record<string, unknown>) => {
          cookieStore.set({ name, value: "", ...(options as object) });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed", {
      code: error.code,
      message: error.message,
      name: error.name,
      status: error.status,
    });
    return NextResponse.redirect(new URL(APP_ROUTES.login, request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
