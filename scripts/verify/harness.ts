/**
 * Shared plumbing for the browser verification scripts.
 *
 * Authentication note: Google's consent screen cannot be driven reliably by a
 * script, so these checks mint an Auth.js session cookie directly using
 * AUTH_SECRET. That is a test-side shortcut only — the application ships no dev
 * login bypass, and the real Google handshake is verified separately by signing
 * in by hand. If AUTH_SECRET is wrong the cookie simply fails to decode and
 * every page redirects to /login, which is an obvious failure rather than a
 * silent pass.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export const BASE_URL = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
export const OUT_DIR = join(process.cwd(), ".verify");

// Chrome for Testing that is already on this machine. Pointing at it directly
// avoids a second multi-hundred-MB browser download for the same binary.
const EXECUTABLE_PATH =
  process.env.VERIFY_CHROME ??
  join(process.env.HOME ?? "", ".cache/ms-playwright/chromium-1228/chrome-linux64/chrome");

// Auth.js derives the encryption key from the cookie name, so the salt must be
// exactly the cookie the app reads. https URLs use the __Secure- prefix.
const COOKIE_NAME = BASE_URL.startsWith("https")
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export type SeedUser = { id: string; email: string; name: string | null };

export async function getSeedUser(email = process.env.SEED_EMAIL ?? "demo@training-planner.local"): Promise<SeedUser> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    const { rows } = await pool.query<SeedUser>("select id, email, name from users where email = $1", [email]);
    if (!rows[0]) throw new Error(`No user ${email}. Run: pnpm seed:demo`);
    return rows[0];
  } finally {
    await pool.end();
  }
}

export async function launch(): Promise<Browser> {
  return chromium.launch({ executablePath: EXECUTABLE_PATH });
}

export async function authedContext(browser: Browser, user: SeedUser, viewport = { width: 1280, height: 900 }) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");

  const maxAge = 60 * 60;
  const token = await encode({
    token: { sub: user.id, name: user.name, email: user.email },
    secret,
    salt: COOKIE_NAME,
    maxAge,
  });

  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: token,
      domain: new URL(BASE_URL).hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + maxAge,
    },
  ]);

  return context;
}

/**
 * Navigates and fails loudly if the session cookie was not accepted. Without
 * this a broken cookie would quietly screenshot the login page for every route
 * and the run would look green.
 */
export async function gotoAuthed(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname.startsWith("/login")) {
    throw new Error(`Redirected to /login for ${path} — the minted session cookie was rejected.`);
  }
}

export async function shoot(page: Page, name: string, fullPage = true): Promise<string> {
  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  return file;
}

export async function withContext<T>(
  fn: (context: BrowserContext, user: SeedUser) => Promise<T>,
  viewport?: { width: number; height: number },
): Promise<T> {
  const user = await getSeedUser();
  const browser = await launch();
  try {
    const context = await authedContext(browser, user, viewport);
    return await fn(context, user);
  } finally {
    await browser.close();
  }
}

/**
 * A tally of assertions, shared so each script does not keep its own copy.
 *
 * flows.ts and responsive.ts each grew their own `check` with slightly
 * different detail formatting; this is that function, once.
 */
export function createChecker() {
  let passed = 0;
  let failed = 0;

  const check = (name: string, ok: boolean, detail = ""): void => {
    if (ok) {
      passed += 1;
      console.log(`  ok    ${name}`);
    } else {
      failed += 1;
      console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
    }
  };

  /** Prints the tally and sets a non-zero exit code if anything failed. */
  const report = (label: string): void => {
    console.log(`\n[${label}] ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
  };

  return { check, report, counts: () => ({ passed, failed }) };
}
