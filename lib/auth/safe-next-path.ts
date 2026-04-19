/**
 * Prevent open redirects: only allow same-origin relative paths.
 */
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw || typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
