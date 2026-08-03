import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Uses the edge-safe config only: the Postgres adapter cannot run here.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
