import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Uses the edge-safe config only: the Postgres adapter cannot run here.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // invite/ is excluded so an invited trainer reaches the landing page while
  // logged out; the page itself sends them to sign in and back again.
  matcher: ["/((?!api/auth|invite|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image.png|manifest.webmanifest|brand).*)"],
};
