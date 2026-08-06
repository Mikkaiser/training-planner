/**
 * Invitation tokens: minting, hashing, and deciding whether one is usable.
 *
 * Pure, and separate from the database, because this is a security boundary
 * reached from a URL — the same reason `exercise-files.ts` and `view-modes.ts`
 * are pure. The rules here decide who joins a team, and every one of them is
 * silent when wrong: an expired invite that still works, or a used one that can
 * be replayed, looks exactly like an invite that worked.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * 32 bytes of CSPRNG. The token is the whole credential — anyone holding it
 * joins the team — so it has to be long enough that guessing is hopeless, and
 * base64url so it survives a URL and a mail client's line wrapping.
 */
export function mintInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * What gets stored. The plaintext token goes in the link and nowhere else:
 * `team_invites` is a table of live credentials, and a database dump should not
 * be a set of working invitations.
 */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Constant-time comparison, so a stored hash cannot be recovered by timing how
 * long a wrong guess takes to be rejected.
 */
export function tokenMatches(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashInviteToken(token), "hex");
  let stored: Buffer;

  try {
    stored = Buffer.from(storedHash, "hex");
  } catch {
    return false;
  }

  // timingSafeEqual throws on a length mismatch, which would itself leak.
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

/** How long an invitation stays open. */
export const INVITE_TTL_DAYS = 7;

export function inviteExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export type InviteRecord = {
  expiresAt: string | Date;
  acceptedAt: string | Date | null;
};

export type InviteState = "usable" | "expired" | "accepted";

/**
 * Whether an invitation can still be used.
 *
 * "accepted" is checked before "expired": a replayed invite is somebody
 * presenting a credential that was already spent, and that is worth naming
 * accurately rather than reporting as merely stale.
 */
export function inviteState(invite: InviteRecord, now: Date): InviteState {
  if (invite.acceptedAt !== null) return "accepted";
  return new Date(invite.expiresAt).getTime() <= now.getTime() ? "expired" : "usable";
}

/** Normalises an address for comparison and for the one-open-invite index. */
export function normaliseInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Deliberately permissive — the mail server is the real authority on whether an
 * address exists. This only rejects what obviously cannot be one, so a typo
 * fails at the form rather than being silently accepted and never delivered.
 */
export function isPlausibleEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (/\s/.test(trimmed)) return false;

  const at = trimmed.indexOf("@");
  if (at <= 0 || at !== trimmed.lastIndexOf("@")) return false;

  const domain = trimmed.slice(at + 1);
  return domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}
