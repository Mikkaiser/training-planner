"use server";

import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Failed to sign out. Please try again.");
  }

  redirect(APP_ROUTES.login);
}

