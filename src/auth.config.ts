import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { APP_ROUTES } from "@/lib/routes";

// Edge-safe slice of the config: no database adapter here, so it can run
// inside middleware. The full config lives in src/auth.ts.
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: APP_ROUTES.login,
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/api/auth")) return true;

      if (pathname.startsWith(APP_ROUTES.login)) {
        if (isLoggedIn) {
          return Response.redirect(new URL(APP_ROUTES.home, request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
