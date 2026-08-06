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

/**
 * A second signed-in identity, with its own personal team.
 *
 * The suite had no way to make one, so the "another instructor cannot read
 * this" check only ever opened a logged-out context. Teams makes the difference
 * between "not signed in" and "signed in as someone else" the thing under test.
 */
export async function seedSecondUser(email: string): Promise<SeedUser> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    const user = await pool.query<SeedUser>(
      `insert into users (email, name) values ($1, $2)
       on conflict (email) do update set name = excluded.name
       returning id, email, name`,
      [email, "Verify Teammate"],
    );
    const id = user.rows[0].id;

    const team = await pool.query<{ id: string }>(
      `insert into teams (name, is_personal, created_by) values ($1, true, $2) returning id`,
      ["Verify Teammate's plans", id],
    );
    await pool.query(
      `insert into team_members (team_id, user_id, role) values ($1, $2, 'owner') on conflict do nothing`,
      [team.rows[0].id, id],
    );
    await pool.query("update users set active_team_id = $2 where id = $1", [id, team.rows[0].id]);

    return user.rows[0];
  } finally {
    await pool.end();
  }
}

/** Which team owns a plan, so a test can join someone to exactly that team. */
export async function teamOfPlan(planId: string): Promise<string> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    const { rows } = await pool.query<{ team_id: string }>(
      "select team_id from training_plans where id = $1",
      [planId],
    );
    if (!rows[0]) throw new Error(`No plan ${planId}`);
    return rows[0].team_id;
  } finally {
    await pool.end();
  }
}

export async function addMember(teamId: string, userId: string): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    await pool.query(
      "insert into team_members (team_id, user_id, role) values ($1, $2, 'member') on conflict do nothing",
      [teamId, userId],
    );
    // acceptInvite also makes the team active; joining without switching leaves
    // them looking at their own plans, which is not what the test means to check.
    await pool.query("update users set active_team_id = $2 where id = $1", [userId, teamId]);
  } finally {
    await pool.end();
  }
}

export async function removeMemberRow(teamId: string, userId: string): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    await pool.query("delete from team_members where team_id = $1 and user_id = $2", [teamId, userId]);
  } finally {
    await pool.end();
  }
}

/** Everything this suite creates it also removes. */
export async function dropUser(userId: string): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    await pool.query("delete from users where id = $1", [userId]);
  } finally {
    await pool.end();
  }
}
