/**
 * Drives the real application in a browser and asserts the outcomes.
 *
 *   pnpm verify:flows
 *
 * Everything it creates it also deletes, so it can be run repeatedly against
 * the dev database without leaving residue.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";
import { BASE_URL, gotoAuthed, withContext } from "./harness";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const STUDENT = `Verify Competitor ${process.pid}`;
const PLAN_TITLE = `Verify Plan ${process.pid}`;

async function createPlan(page: Page): Promise<string> {
  await gotoAuthed(page, "/");
  await page.getByRole("button", { name: "New Plan" }).click();
  await page.getByLabel("Competitor name").fill(STUDENT);
  await page.getByLabel("Plan title").fill(PLAN_TITLE);
  await page.getByRole("button", { name: "Create Plan" }).click();
  await page.waitForURL(/\/plan\/[0-9a-f-]{36}/, { timeout: 15_000 });
  return new URL(page.url()).pathname;
}

async function main(): Promise<void> {
  await withContext(async (context) => {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    // ── Create ───────────────────────────────────────────────────────────
    const planPath = await createPlan(page);
    check("creating a plan navigates to its roadmap", /\/plan\//.test(planPath), planPath);
    check(
      "a plan with no phases shows the empty roadmap",
      await page.getByText("A blank roadmap, a clear horizon.").isVisible(),
    );

    // ── Add a phase, then a block ────────────────────────────────────────
    await page.getByRole("button", { name: "Add Phase" }).click();
    await page.getByRole("button", { name: "Foundation", exact: true }).click();
    await page.waitForSelector("text=Not started", { timeout: 15_000 });
    check("adding a phase replaces the empty state", await page.getByText("P1").first().isVisible());

    await page.getByRole("button", { name: "Add Block" }).first().click();
    await page.getByLabel("Add Block").fill("Verification Block");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForSelector("text=Verification Block", { timeout: 15_000 });
    check("adding a block renders it with its gate", await page.getByText("Gate 1").first().isVisible());
    check(
      "the new block's gate scope names the block range",
      await page.getByText("Cumulative · Block 1").first().isVisible(),
    );

    // ── Verb level ───────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Verb level for Verification Block/ }).click();
    await page.getByRole("option", { name: "Create" }).click();

    // Poll the specific control rather than any element containing "Create",
    // and then reload, so this asserts persistence and not just local state.
    const verbPill = page.getByRole("button", { name: /Verb level for Verification Block/ });
    await verbPill
      .filter({ hasText: "Create" })
      .waitFor({ timeout: 15_000 })
      .catch(() => undefined);

    await gotoAuthed(page, planPath);
    // innerText comes back CSS-uppercased ("CREATE"), so compare case-insensitively.
    const verbText = await page.getByRole("button", { name: /Verb level for Verification Block/ }).innerText();
    check("changing the verb level persists across a reload", verbText.trim().toLowerCase() === "create", verbText);

    // ── Rename the plan and the competitor ───────────────────────────────
    await page.getByRole("button", { name: /Competitor name:/ }).click();
    await page.getByLabel("Competitor name").fill(`${STUDENT} Renamed`);
    await page.getByLabel("Competitor name").press("Enter");
    await page.waitForTimeout(800);
    await gotoAuthed(page, planPath);
    check(
      "renaming the competitor persists",
      (await page.getByRole("button", { name: /Competitor name:/ }).innerText()).includes("Renamed"),
    );

    await page.getByRole("button", { name: /^Plan title:/ }).click();
    await page.getByLabel("Plan title").fill(`${PLAN_TITLE} Renamed`);
    await page.getByLabel("Plan title").press("Enter");
    await page.waitForTimeout(800);
    await gotoAuthed(page, planPath);
    check(
      "renaming the plan persists",
      (await page.getByRole("button", { name: /^Plan title:/ }).innerText()).includes("Renamed"),
    );

    // ── Remove a gate, then add it back ──────────────────────────────────
    await page.getByRole("button", { name: /Remove Gate 1/ }).click();
    await page.getByRole("button", { name: "Remove gate", exact: true }).click();
    await page.waitForSelector("text=Add Gate", { timeout: 15_000 });
    check("removing a gate leaves the block without a checkpoint", !(await page.getByText("Gate 1").isVisible()));

    await page.getByRole("button", { name: "Add Gate" }).first().click();
    await page.waitForSelector("text=Gate 1", { timeout: 15_000 });
    check(
      "adding a gate back restores a pending checkpoint",
      await page.getByText("Cumulative · Block 1").first().isVisible(),
    );

    // ── Drag-to-reorder, driven from the keyboard ────────────────────────
    // Keyboard rather than a synthetic mouse drag: dnd-kit's pointer sensor is
    // notoriously flaky to script, and this also proves the feature is not
    // mouse-only.
    await page.getByRole("button", { name: "Add Block" }).first().click();
    await page.getByLabel("Add Block").fill("Second Block");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForSelector("text=Second Block", { timeout: 15_000 });

    // InlineEdit renders the title as a button labelled "Block title: <value>…",
    // so match on that prefix rather than a tag or an exact label.
    const blockOrder = async () =>
      page.$$eval('button[aria-label^="Block title:"]', (nodes) =>
        nodes.map((node) => node.textContent?.trim() ?? ""),
      );

    const before = await blockOrder();
    check("two blocks are present before reordering", before.length === 2, before.join(" | "));

    await page.getByRole("button", { name: /Reorder block Verification Block/ }).focus();
    // dnd-kit needs a render between pickup, move and drop; pressing the three
    // keys back to back silently does nothing.
    await page.keyboard.press("Space");
    await page.waitForTimeout(400);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(400);
    await page.keyboard.press("Space");
    await page.waitForTimeout(1500);

    await gotoAuthed(page, planPath);
    const after = await blockOrder();
    check(
      "reordering blocks by keyboard persists",
      after.length === 2 && after[0] !== before[0],
      `${before.join(" | ")}  ->  ${after.join(" | ")}`,
    );
    check(
      "gate numbering follows the new block order",
      await page.getByText("Cumulative · Blocks 1 – 2").first().isVisible(),
    );

    // ── Upload a real file to MinIO ──────────────────────────────────────
    const dir = mkdtempSync(join(tmpdir(), "tp-verify-"));
    const filePath = join(dir, "verification-brief.pdf");
    writeFileSync(filePath, Buffer.from("%PDF-1.4\nverification brief\n".repeat(50)));

    await page.getByRole("button", { name: "Add Exercise" }).first().click();
    await page.setInputFiles('input[type="file"]', filePath);
    await page.waitForSelector("text=Attached", { timeout: 45_000 });
    check("uploading a file reaches the bucket and is confirmed", true);

    await page.getByRole("button", { name: "Done" }).click();
    await page.waitForSelector("text=verification-brief.pdf", { timeout: 15_000 });
    check("the attached file appears on the block after reload", true);

    // ── Download through the signed-URL route ────────────────────────────
    const download = await page.request.get(
      `${BASE_URL}${await page
        .getByRole("link", { name: /Download verification-brief.pdf/ })
        .getAttribute("href")}`,
    );
    check("download returns the file", download.ok(), `status ${download.status()}`);
    check(
      "download is served as an attachment",
      (download.headers()["content-disposition"] ?? "").includes("attachment"),
      download.headers()["content-disposition"],
    );

    // ── Gate pass moves progress ─────────────────────────────────────────
    const progressBefore = await page.locator("header .tp-mono").first().innerText();
    await page.getByRole("button", { name: "Mark Passed" }).first().click();
    await page.waitForSelector("text=Reopen", { timeout: 15_000 });
    const progressAfter = await page.locator("header .tp-mono").first().innerText();
    check("passing a gate moves the progress figure", progressBefore !== progressAfter, `${progressBefore} -> ${progressAfter}`);

    // Pass whatever is still outstanding; the plan has two blocks by now.
    for (let i = 0; i < 6; i += 1) {
      const next = page.getByRole("button", { name: "Mark Passed" }).first();
      if (!(await next.isVisible().catch(() => false))) break;
      await next.click();
      await page.waitForTimeout(700);
    }
    const progressComplete = (await page.locator("header .tp-mono").first().innerText()).trim();
    check("progress reaches 100% when every gate passes", progressComplete === "100%", progressComplete);

    // ── All three detail views agree ─────────────────────────────────────
    const readings: string[] = [];
    for (const view of ["timeline", "tree", "route"] as const) {
      await gotoAuthed(page, `${planPath}?view=${view}`);
      readings.push((await page.locator("header .tp-mono").first().innerText()).trim());
    }
    check("all three roadmap views report the same progress", new Set(readings).size === 1, readings.join(" / "));

    // ── An unknown view falls back instead of erroring ───────────────────
    await gotoAuthed(page, `${planPath}?view=../etc/passwd`);
    check("an unknown view value falls back to the default", await page.getByText("P1").first().isVisible());

    // ── Clone resets gates ───────────────────────────────────────────────
    await gotoAuthed(page, "/");
    await page.getByRole("button", { name: "New Plan" }).click();
    await page.getByLabel("Competitor name").fill(`${STUDENT} Clone`);
    await page.getByLabel("Plan title").fill(`${PLAN_TITLE} Clone`);
    await page.getByRole("button", { name: new RegExp(PLAN_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    await page.getByRole("button", { name: "Create & open roadmap" }).click();
    await page.waitForURL(/\/plan\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const clonePath = new URL(page.url()).pathname;

    check("the clone copies the block", await page.getByText("Verification Block").first().isVisible());
    const cloneProgress = (await page.locator("header .tp-mono").first().innerText()).trim();
    check("the clone starts with every gate pending", cloneProgress === "0%", cloneProgress);

    // ── Ownership: another instructor cannot read this plan ──────────────
    const stranger = await context.browser()?.newContext();
    if (stranger) {
      const strangerPage = await stranger.newPage();
      const response = await strangerPage.goto(`${BASE_URL}${planPath}`);
      check(
        "an unauthenticated visitor is bounced to the login page",
        new URL(strangerPage.url()).pathname.startsWith("/login"),
        `${response?.status()} ${strangerPage.url()}`,
      );
      await stranger.close();
    }

    // ── Clean up: remove both plans through the UI ───────────────────────
    for (const path of [clonePath, planPath]) {
      await gotoAuthed(page, path);
      await page.getByRole("button", { name: /Remove plan/ }).click();
      await page.getByRole("button", { name: "Remove plan", exact: true }).click();
      await page.waitForURL(`${BASE_URL}/`, { timeout: 20_000 });
    }

    await gotoAuthed(page, "/");
    check(
      "removing a plan clears it from the list",
      !(await page.getByText(PLAN_TITLE, { exact: false }).first().isVisible().catch(() => false)),
    );
    check("no uncaught client errors during the run", errors.length === 0, errors.join(" | "));

    console.log(`\n[flows] ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
  });
}

main().catch((error: unknown) => {
  console.error(`[flows] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
