"use server";

import { signOut as authSignOut } from "@/auth";
import { APP_ROUTES } from "@/lib/routes";

export async function signOut() {
  await authSignOut({ redirectTo: APP_ROUTES.login });
}
