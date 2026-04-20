import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)."
    );
  }

  return { url, anonKey };
}

/** Preferred: use the shared singleton client in the browser. */
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, anonKey } = getEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}

/**
 * Backwards compatible export. Kept so existing code keeps working, but it now
 * returns the same singleton instance.
 */
export function createSupabaseBrowserClient() {
  return getSupabaseBrowserClient();
}

