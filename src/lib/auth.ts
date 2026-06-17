import { createClient } from "@/lib/supabase/server";

/**
 * Returns the authenticated user or throws. Use in Server Actions for
 * defense-in-depth on top of RLS (so a misconfigured policy can't silently
 * expose a mutation). Mirrors the inline check in `createPlan`.
 */
export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[requireUser] auth.getUser failed", {
      code: error.code,
      message: error.message,
      name: error.name,
      status: error.status,
    });
    throw new Error("Could not verify your session. Please sign in again.");
  }

  if (!user) {
    throw new Error("You need to sign in to continue.");
  }

  return user;
}
