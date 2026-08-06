/**
 * An invitation token is a credential that arrives from a URL, and every rule
 * about it fails silently: an expired invite that still works, or a spent one
 * that can be replayed, is indistinguishable from one that worked. These pin
 * the rules that decide who gets into a team.
 */
import { describe, expect, it } from "vitest";
import {
  hashInviteToken,
  INVITE_TTL_DAYS,
  inviteExpiryFrom,
  inviteState,
  isPlausibleEmail,
  mintInviteToken,
  normaliseInviteEmail,
  tokenMatches,
} from "@/lib/invite-token";

const NOW = new Date("2026-08-06T12:00:00.000Z");
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

describe("minting", () => {
  it("never repeats", () => {
    const seen = new Set(Array.from({ length: 500 }, () => mintInviteToken()));
    expect(seen.size).toBe(500);
  });

  it("is long enough to be unguessable", () => {
    // 32 bytes of CSPRNG; base64url of 32 bytes is 43 chars.
    expect(mintInviteToken()).toHaveLength(43);
  });

  it("is URL-safe, so it survives being put in a link and emailed", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(mintInviteToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});

describe("hashing", () => {
  it("never stores the token itself", () => {
    const token = mintInviteToken();
    expect(hashInviteToken(token)).not.toBe(token);
    expect(hashInviteToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable, so a link works more than once before it is accepted", () => {
    const token = mintInviteToken();
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
  });

  it("differs for different tokens", () => {
    expect(hashInviteToken("a")).not.toBe(hashInviteToken("b"));
  });
});

describe("tokenMatches", () => {
  it("accepts the token it was made from", () => {
    const token = mintInviteToken();
    expect(tokenMatches(token, hashInviteToken(token))).toBe(true);
  });

  it("rejects any other token", () => {
    const token = mintInviteToken();
    expect(tokenMatches(mintInviteToken(), hashInviteToken(token))).toBe(false);
  });

  it("rejects a near miss", () => {
    const token = mintInviteToken();
    const almost = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
    expect(tokenMatches(almost, hashInviteToken(token))).toBe(false);
  });

  it("returns false rather than throwing on a malformed stored hash", () => {
    // timingSafeEqual throws on a length mismatch, and an exception here would
    // be a 500 on a public route.
    expect(tokenMatches("anything", "")).toBe(false);
    expect(tokenMatches("anything", "not-hex")).toBe(false);
    expect(tokenMatches("anything", "abcd")).toBe(false);
  });

  it("rejects an empty token", () => {
    expect(tokenMatches("", hashInviteToken(mintInviteToken()))).toBe(false);
  });
});

describe("inviteState", () => {
  const open = { expiresAt: days(3), acceptedAt: null };

  it("is usable while it is open and unspent", () => {
    expect(inviteState(open, NOW)).toBe("usable");
  });

  it("expires once its moment passes", () => {
    expect(inviteState({ expiresAt: days(-1), acceptedAt: null }, NOW)).toBe("expired");
  });

  it("treats the exact expiry instant as expired, not usable", () => {
    expect(inviteState({ expiresAt: NOW, acceptedAt: null }, NOW)).toBe("expired");
  });

  it("cannot be replayed once accepted", () => {
    expect(inviteState({ expiresAt: days(3), acceptedAt: days(-1) }, NOW)).toBe("accepted");
  });

  it("reports a spent invite as accepted even after it would have expired", () => {
    // Otherwise a replay is reported as merely stale, which reads as bad luck
    // rather than as someone presenting a credential that was already used.
    expect(inviteState({ expiresAt: days(-5), acceptedAt: days(-6) }, NOW)).toBe("accepted");
  });

  it("accepts an ISO string as readily as a Date, since that is what the row holds", () => {
    expect(inviteState({ expiresAt: days(3).toISOString(), acceptedAt: null }, NOW)).toBe("usable");
    expect(inviteState({ expiresAt: days(-3).toISOString(), acceptedAt: null }, NOW)).toBe("expired");
  });
});

describe("inviteExpiryFrom", () => {
  it("is the documented number of days out", () => {
    expect(inviteExpiryFrom(NOW).getTime()).toBe(days(INVITE_TTL_DAYS).getTime());
  });

  it("produces an invite that is usable now and not later", () => {
    const expiresAt = inviteExpiryFrom(NOW);
    expect(inviteState({ expiresAt, acceptedAt: null }, NOW)).toBe("usable");
    expect(inviteState({ expiresAt, acceptedAt: null }, days(INVITE_TTL_DAYS + 1))).toBe("expired");
  });
});

describe("email handling", () => {
  it("normalises for comparison, so one address cannot hold two open invites", () => {
    expect(normaliseInviteEmail("  Coach@Example.COM ")).toBe("coach@example.com");
  });

  it("accepts ordinary addresses", () => {
    for (const email of ["a@b.co", "coach.two@sub.example.com", "trainer+squad@example.org"]) {
      expect(isPlausibleEmail(email)).toBe(true);
    }
  });

  it("rejects what obviously cannot be an address", () => {
    for (const email of ["", "   ", "nope", "@example.com", "a@", "a@b", "a b@example.com", "a@@b.com"]) {
      expect(isPlausibleEmail(email)).toBe(false);
    }
  });

  it("rejects a domain with a stray dot at either end", () => {
    expect(isPlausibleEmail("a@.com")).toBe(false);
    expect(isPlausibleEmail("a@example.")).toBe(false);
  });

  it("rejects something too long to be a real address", () => {
    expect(isPlausibleEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
  });
});
