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
import ExcelJS from "exceljs";
import type { Page } from "playwright";
import { buildSchemeGrid, type SchemeSpec } from "../../src/lib/marking-scheme/build";
import { addMember, authedContext, BASE_URL, dropUser, gotoAuthed, removeMemberRow, seedSecondUser, teamOfPlan, withContext } from "./harness";

/**
 * The same scheme the unit-test fixture describes, built through build.ts.
 *
 * Going through the builder rather than the hand-written fixture grid means
 * this run also proves an authored workbook survives the real upload — which is
 * the one thing the unit tests cannot show, since they never open a file. The
 * parser tests keep using the hand-written grid, so the two are never checked
 * only against each other.
 */
const FIXTURE_SPEC: SchemeSpec = {
  skill: "Test Skill",
  testProject: "Synthetic Project",
  expectedTotal: 10,
  criteria: [
    {
      letter: "A",
      name: "First part",
      subCriteria: [
        {
          code: "A1",
          name: "Setup",
          aspects: [
            { type: "measurement", description: "Environment restored", maxMark: 1 },
            {
              type: "measurement",
              description: "Files in place",
              extraDescription: "Deduct 0.5 per missing file",
              maxMark: 1,
            },
          ],
        },
        {
          code: "A2",
          name: "Queries",
          aspects: [
            { type: "measurement", description: "Query one correct", maxMark: 1.5 },
            { type: "measurement", description: "Query two correct", maxMark: 0.5 },
          ],
        },
      ],
    },
    {
      letter: "B",
      name: "Second part",
      subCriteria: [
        {
          code: "B1",
          name: "Behaviour",
          aspects: [
            { type: "measurement", description: "Application starts", maxMark: 2 },
            { type: "measurement", description: "Errors handled", maxMark: 1 },
          ],
        },
        {
          code: "B2",
          name: "Presentation",
          aspects: [
            {
              type: "judgement",
              description: "Overall visual quality",
              maxMark: 3,
              descriptors: [
                "Cluttered and unreadable",
                "Readable but plain",
                "Clear and well aligned",
                "Polished and consistent",
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** Writes the fixture scheme out as a real .xlsx for the upload path. */
async function writeSchemeWorkbook(path: string): Promise<void> {
  const built = buildSchemeGrid(FIXTURE_SPEC);
  if (!built.ok) throw new Error(`the fixture spec no longer builds:\n${built.errors.join("\n")}`);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("CIS Marking Scheme Import");
  for (const line of built.grid) sheet.addRow(line);
  await workbook.xlsx.writeFile(path);
}

/** A valid workbook that is not a marking scheme, to prove import refuses it. */
async function writeJunkWorkbook(path: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.addRow(["Shopping list"]);
  sheet.addRow(["Milk", "2"]);
  await workbook.xlsx.writeFile(path);
}

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

/**
 * Opens every collapsed phase. Completed and locked phases collapse by design,
 * so anything inside them is genuinely not visible until they are opened —
 * assertions that span phases have to do this first.
 */
async function expandAllPhases(page: Page): Promise<void> {
  for (let i = 0; i < 8; i += 1) {
    const next = page.getByRole("button", { name: /^Expand / }).first();
    if (!(await next.isVisible().catch(() => false))) return;
    await next.click();
    await page.waitForTimeout(300);
  }
}

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

    // ── Brand ────────────────────────────────────────────────────────────
    // The mark is inline SVG, so "is it there" is a DOM question; the icons
    // and the manifest are routes, so those are fetches.
    const markOn = async (path: string) => {
      await gotoAuthed(page, path);
      return (await page.locator(".tp-brand svg").count()) > 0;
    };

    check("the logo is on the plan list", await markOn("/"));
    check("the logo is on a roadmap", await markOn(planPath));

    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    check("the logo is on the login page", (await page.locator(".tp-brand svg").count()) > 0);

    await gotoAuthed(page, "/");
    check(
      "the wordmark reads as the logo spells it",
      (await page.locator(".tp-brand-word").first().innerText()).trim() === "trainingplanner",
    );

    const homeFromLogo = await page
      .getByRole("link", { name: "Training Planner — home" })
      .first()
      .click()
      .then(() => page.waitForURL(`${BASE_URL}/`, { timeout: 15_000 }))
      .then(() => true)
      .catch(() => false);
    check("the logo goes home", homeFromLogo);

    for (const [label, path, type] of [
      ["the tab icon", "/icon.png", "image/png"],
      ["the apple touch icon", "/apple-icon.png", "image/png"],
      ["the link preview image", "/opengraph-image.png", "image/png"],
      ["the manifest", "/manifest.webmanifest", "manifest"],
    ] as const) {
      const response = await page.request.get(`${BASE_URL}${path}`);
      check(
        `${label} is served`,
        response.ok() && (response.headers()["content-type"] ?? "").includes(type),
        `${response.status()} ${response.headers()["content-type"] ?? ""}`,
      );
    }

    // A manifest naming an icon that 404s installs with a blank tile and says
    // nothing about it, which is the whole failure mode worth guarding.
    const manifest = await (await page.request.get(`${BASE_URL}/manifest.webmanifest`)).json();
    const iconResults = await Promise.all(
      (manifest.icons ?? []).map(async (icon: { src: string }) => {
        const response = await page.request.get(`${BASE_URL}${icon.src}`);
        return { src: icon.src, ok: response.ok() };
      }),
    );
    check(
      `every manifest icon resolves (${iconResults.length})`,
      iconResults.length > 0 && iconResults.every((icon) => icon.ok),
      iconResults.filter((icon) => !icon.ok).map((icon) => icon.src).join(", "),
    );

    // Back to the roadmap: the logo check above navigated home, and everything
    // after this point assumes it is still on the plan it just created.
    await gotoAuthed(page, planPath);

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

    // ── A reorder that the server refuses ────────────────────────────────
    // The move is optimistic, so a rejected action used to leave the new order
    // on screen looking saved: the re-seeding effect only fires when the server
    // data changes, and a failure leaves it identical. Forcing the failure is
    // the only way to see that.
    await page.route("**/plan/**", async (route) => {
      const request = route.request();
      if (request.method() === "POST" && request.headers()["next-action"]) {
        await route.abort("failed");
      } else {
        await route.continue();
      }
    });

    const beforeFailure = await blockOrder();
    await page.getByRole("button", { name: /^Reorder block / }).first().focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(400);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(400);
    await page.keyboard.press("Space");
    await page.waitForTimeout(2500);

    const afterFailure = await blockOrder();
    check(
      "a rejected reorder puts the order back",
      afterFailure.join("|") === beforeFailure.join("|"),
      `${beforeFailure.join(" | ")}  ->  ${afterFailure.join(" | ")}`,
    );
    check(
      "a rejected reorder says so",
      (await page.locator('[role="alert"]').first().innerText().catch(() => "")).includes(
        "put back",
      ),
    );

    await page.unroute("**/plan/**");
    await gotoAuthed(page, planPath);

    // ── Move a block into another phase ──────────────────────────────────
    await page.getByRole("button", { name: "Add Phase" }).click();
    await page.getByRole("button", { name: "Advanced", exact: true }).click();
    await page.waitForSelector("text=Not started", { timeout: 15_000 });

    // Open the destination so its rail is a drop target.
    const expandAdvanced = page.getByRole("button", { name: "Expand Advanced" });
    if (await expandAdvanced.isVisible().catch(() => false)) {
      await expandAdvanced.click();
      await page.waitForTimeout(500);
    }

    const lastHandle = page.getByRole("button", { name: /^Reorder block/ }).last();
    await lastHandle.scrollIntoViewIfNeeded();
    await lastHandle.focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(450);
    // Enough presses to leave this phase's list and enter the next one.
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(400);
    }
    await page.keyboard.press("Space");
    await page.waitForTimeout(2000);

    await gotoAuthed(page, planPath);
    check(
      "a block can be moved into another phase",
      !(await page.getByText("Not started").first().isVisible().catch(() => false)),
      "the destination phase still reports 'Not started'",
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

    // ── Attach a link ────────────────────────────────────────────────────
    await page.getByRole("button", { name: "Add Exercise" }).first().click();
    await page.getByLabel("Exercise link").fill("javascript:alert(1)");
    await page.getByRole("button", { name: "Add link" }).click();
    await page.waitForTimeout(600);
    check(
      "a javascript: URL is refused",
      await page.getByText(/Only http and https/).isVisible().catch(() => false),
    );

    await page.getByLabel("Exercise link").fill("https://example.com/rest-pagination");
    await page.getByLabel("Link label").fill("REST pagination notes");
    await page.getByRole("button", { name: "Add link" }).click();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Done" }).click();
    await gotoAuthed(page, planPath);

    check("a link attaches to the block", await page.getByText("REST pagination notes").first().isVisible());
    const linkHref = await page
      .getByRole("link", { name: /Open REST pagination notes/ })
      .getAttribute("href");
    check("the link points where it was set", linkHref === "https://example.com/rest-pagination", String(linkHref));
    const linkRel = await page.getByRole("link", { name: /Open REST pagination notes/ }).getAttribute("rel");
    check("the link opens without leaking the referrer", (linkRel ?? "").includes("noreferrer"), String(linkRel));

    // ── Reuse both onto a second block ───────────────────────────────────
    // The first block now holds one ready file and one ready link, which is
    // exactly what the picker should be offering elsewhere.
    await page.getByRole("button", { name: "Add Block" }).first().click();
    await page.getByLabel("Add Block").fill("Reuse Target");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForSelector("text=Reuse Target", { timeout: 15_000 });

    // Scoped to the card that holds this block: there are two phases by now, so
    // "the last Add Exercise" is not necessarily the block just created.
    await expandAllPhases(page);
    const reuseCard = page.locator(".tp-card", {
      has: page.getByRole("button", { name: /^Block title: Reuse Target/ }),
    });
    await reuseCard.getByRole("button", { name: "Add Exercise" }).first().click();

    // Everything here is scoped to the dialog: the roadmap behind it has its own
    // "verification-brief.pdf" controls, and the backdrop swallows clicks aimed
    // at them.
    const picker = page.getByRole("dialog");
    const librarySearch = picker.getByLabel("Search exercises you have used before");
    await librarySearch.waitFor({ timeout: 15_000 });

    // .first() throughout: two exercises can legitimately share a label and
    // differ only by URL, so the picker showing more than one is correct.
    await librarySearch.fill("verification-brief");
    await page.waitForTimeout(400);
    await picker.getByRole("button", { name: "Reuse verification-brief.pdf" }).first().click();

    await librarySearch.fill("REST pagination");
    await page.waitForTimeout(400);
    await picker.getByRole("button", { name: "Reuse REST pagination notes" }).first().click();

    await picker.getByRole("button", { name: /^Attach 2$/ }).click();
    await page.waitForTimeout(2500);
    await picker.getByRole("button", { name: "Done" }).click();
    await gotoAuthed(page, planPath);
    await expandAllPhases(page);

    const reusedBody = await page.locator("body").innerText();
    check(
      "both exercises are reused onto the second block",
      (reusedBody.match(/verification-brief\.pdf/g) ?? []).length >= 2 &&
        (reusedBody.match(/REST pagination notes/g) ?? []).length >= 2,
    );

    const reusedLinks = await page.$$eval('a[href="https://example.com/rest-pagination"]', (nodes) => nodes.length);
    check("the reused link points at the same URL", reusedLinks >= 2, `${reusedLinks} found`);

    const downloads = await page.$$eval('a[href^="/api/exercises/"]', (nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href") ?? ""),
    );
    check("the reused file has its own download", new Set(downloads).size >= 2, downloads.join(" "));

    // The guarantee the unique storage_key exists to provide: a reused file is
    // a copy, so removing one must leave the other downloadable. Sharing a key
    // would make this fetch 404 after the delete.
    const [firstDownload, secondDownload] = [...new Set(downloads)];
    await reuseCard.getByRole("button", { name: /^Remove verification-brief\.pdf$/ }).first().click();
    await page.getByRole("button", { name: "Remove file", exact: true }).click();
    await page.waitForTimeout(2000);

    const survivor = await page.request.get(`${BASE_URL}${firstDownload}`);
    check(
      "deleting a reused copy leaves the original downloadable",
      survivor.ok(),
      `${firstDownload} -> ${survivor.status()} (other copy was ${secondDownload})`,
    );

    // ── Edit a label and a link ──────────────────────────────────────────
    // Both were fixed at the moment of attaching: correcting either meant
    // deleting the exercise and adding it again. Done on the reused copy, so
    // this also proves an edit does not reach back to the original.
    await reuseCard.getByRole("button", { name: "Edit REST pagination notes" }).click();
    const exerciseDialog = page.getByRole("dialog");

    // The create path refuses a javascript: URL, so the edit path has to as
    // well — an update that skipped the check would be a way straight past it.
    await exerciseDialog.getByLabel("Link").fill("javascript:alert(1)");
    await exerciseDialog.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(600);
    // Read through a catch: if the URL were accepted the dialog would have
    // closed, and innerText would throw rather than report a red check.
    const refused = await exerciseDialog
      .innerText()
      .then((text) => /Only http and https/.test(text))
      .catch(() => false);
    check("editing a link refuses a javascript: URL too", refused);

    await exerciseDialog.getByLabel("Label").fill("Pagination notes v2");
    await exerciseDialog.getByLabel("Link").fill("https://example.com/rest-pagination-v2");
    await exerciseDialog.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1800);
    await gotoAuthed(page, planPath);
    await expandAllPhases(page);

    check("an exercise label can be edited", await page.getByText("Pagination notes v2").first().isVisible());
    const editedHref = await page
      .getByRole("link", { name: /Open Pagination notes v2/ })
      .getAttribute("href");
    check(
      "an exercise link can be repointed",
      editedHref === "https://example.com/rest-pagination-v2",
      String(editedHref),
    );

    // The copies are independent rows, which is what the modal tells the user.
    const originalHref = await page
      .getByRole("link", { name: /Open REST pagination notes/ })
      .first()
      .getAttribute("href");
    check(
      "editing a reused copy leaves the original alone",
      originalHref === "https://example.com/rest-pagination",
      String(originalHref),
    );

    // A file has no address to edit, so the field must not be offered — an
    // empty URL box on a file would look like something to fill in.
    await page.getByRole("button", { name: "Edit verification-brief.pdf" }).first().click();
    const fileDialog = page.getByRole("dialog");
    check(
      "a file offers a label but no link field",
      (await fileDialog.getByLabel("Label").count()) === 1 &&
        (await fileDialog.getByLabel("Link").count()) === 0,
    );
    await fileDialog.getByLabel("Label").fill("Renamed brief.pdf");
    await fileDialog.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1800);
    await gotoAuthed(page, planPath);
    await expandAllPhases(page);
    check("a file can be relabelled", await page.getByText("Renamed brief.pdf").first().isVisible());

    // Put the name back: later checks look this file up by it, and a run that
    // leaves the world as it found it is the convention here.
    await page.getByRole("button", { name: "Edit Renamed brief.pdf" }).first().click();
    const restoreDialog = page.getByRole("dialog");
    await restoreDialog.getByLabel("Label").fill("verification-brief.pdf");
    await restoreDialog.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1800);
    await gotoAuthed(page, planPath);
    await expandAllPhases(page);
    check(
      "the label change round-trips back",
      await page.getByText("verification-brief.pdf").first().isVisible(),
    );

    // ── Remove the attached file ─────────────────────────────────────────
    // Opacity is asserted, not just presence. Playwright clicks an
    // opacity-0 element quite happily, so a "remove works" check can pass on a
    // control no human can see — which is exactly how this shipped once.
    // Written without inner helper functions: tsx compiles named function
    // expressions with an esbuild `__name` shim that does not exist in the page.
    const fileControls = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("[aria-label]"));
      const out: Record<string, { found: boolean; opacity: number }> = {
        remove: { found: false, opacity: 0 },
        download: { found: false, opacity: 0 },
      };
      for (const node of nodes) {
        const label = node.getAttribute("aria-label") ?? "";
        const key = label.startsWith("Remove verification-brief.pdf")
          ? "remove"
          : label.startsWith("Download verification-brief.pdf")
            ? "download"
            : null;
        if (key && !out[key].found) {
          out[key] = { found: true, opacity: Number(getComputedStyle(node as HTMLElement).opacity) };
        }
      }
      return out;
    });

    check("the download control is visible", fileControls.download.found && fileControls.download.opacity > 0.9,
      JSON.stringify(fileControls.download));
    check("the remove control is visible without hovering", fileControls.remove.found && fileControls.remove.opacity > 0.9,
      JSON.stringify(fileControls.remove));

    await page.getByRole("button", { name: /Remove verification-brief.pdf/ }).first().click();
    await page.getByRole("button", { name: "Remove file", exact: true }).click();
    await page.waitForTimeout(1500);
    await gotoAuthed(page, planPath);
    check(
      "removing an attached file takes it off the block",
      !(await page.getByText("verification-brief.pdf").first().isVisible().catch(() => false)),
    );

    // ── Gate pass moves progress ─────────────────────────────────────────
    const progressBefore = await page.locator("header .tp-mono").first().innerText();
    await page.getByRole("button", { name: "Mark Passed" }).first().click();
    await page.waitForSelector("text=Reopen", { timeout: 15_000 });
    const progressAfter = await page.locator("header .tp-mono").first().innerText();
    check("passing a gate moves the progress figure", progressBefore !== progressAfter, `${progressBefore} -> ${progressAfter}`);

    // Pass whatever is still outstanding. Blocks now live in two phases, and a
    // completed phase collapses, so open everything first.
    await expandAllPhases(page);
    for (let i = 0; i < 8; i += 1) {
      await expandAllPhases(page);
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

    await expandAllPhases(page);
    check("the clone copies the block", await page.getByText("Verification Block").first().isVisible());
    const cloneProgress = (await page.locator("header .tp-mono").first().innerText()).trim();
    check("the clone starts with every gate pending", cloneProgress === "0%", cloneProgress);

    // ── Ownership, with a real second identity ───────────────────────────
    // The old version of this opened a *logged-out* context and asserted a
    // redirect to /login, under a comment claiming it proved another instructor
    // could not read the plan. It never did. Teams is the change that makes the
    // difference matter, so this mints a second signed-in user.
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

    const browser = context.browser();
    if (browser) {
      const other = await seedSecondUser(`teammate+${process.pid}@example.test`);
      const otherContext = await authedContext(browser, other);
      const otherPage = await otherContext.newPage();

      // Before any invitation: a different trainer, signed in, sees nothing.
      await otherPage.goto(`${BASE_URL}${planPath}`, { waitUntil: "networkidle" });
      check(
        "a signed-in outsider cannot open someone else's plan",
        !(await otherPage.locator("body").innerText()).includes(STUDENT),
        otherPage.url(),
      );

      await otherPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      check(
        "an outsider's own plan list does not show the other team's plans",
        !(await otherPage.locator("body").innerText()).includes(PLAN_TITLE),
      );

      // Join them to the team that owns the plan, exactly as accepting would.
      const teamId = await teamOfPlan(planPath.split("/").pop() ?? "");
      await addMember(teamId, other.id);
      await otherPage.goto(`${BASE_URL}${planPath}`, { waitUntil: "networkidle" });
      check(
        "a teammate can open the shared plan",
        (await otherPage.locator("body").innerText()).includes(STUDENT),
        otherPage.url(),
      );

      // ...and loses it again the moment they are removed.
      await removeMemberRow(teamId, other.id);
      await otherPage.goto(`${BASE_URL}${planPath}`, { waitUntil: "networkidle" });
      check(
        "a removed member loses access immediately",
        !(await otherPage.locator("body").innerText()).includes(STUDENT),
        otherPage.url(),
      );

      await otherContext.close();
      await dropUser(other.id);
    }

    // ── Assessment guide ─────────────────────────────────────────────────
    // The workbook is generated here from the shared fixture rather than
    // committed: real marking schemes are unreleased competition material.
    const schemePath = join(dir, "synthetic-marking-scheme.xlsx");
    await writeSchemeWorkbook(schemePath);

    await gotoAuthed(page, "/assessments");
    check("the assessments section is reachable from the nav", await page.getByRole("link", { name: "Assessments" }).isVisible());

    await page.setInputFiles('input[type="file"]', schemePath);
    await page.waitForURL(/\/assessments\/[0-9a-f-]{36}/, { timeout: 60_000 });
    const schemeBody = await page.locator("body").innerText();

    check("the imported scheme shows its criteria", schemeBody.includes("First part") && schemeBody.includes("Second part"));
    check("the imported scheme shows a deduction rule", schemeBody.includes("Deduct 0.5 per missing file"));
    check("the imported scheme shows a judgement aspect", schemeBody.includes("Overall visual quality"));

    await page.getByRole("button", { name: "Start marking" }).first().click();
    await page.getByRole("button", { name: "Start marking" }).last().click();
    await page.waitForURL(/\/assessments\/runs\/[0-9a-f-]{36}/, { timeout: 30_000 });
    const runPath = new URL(page.url()).pathname;

    // Full marks on a 1-mark measurement aspect, then judgement 2 of 3 on a
    // 3-mark aspect: 1 + 2 = 3 out of the fixture's 10.
    await page.getByRole("button", { name: "Full" }).first().click();
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /^Score 2:/ }).first().click();
    await page.waitForTimeout(900);

    await gotoAuthed(page, runPath);
    const header = (await page.locator(".tp-card").first().innerText()).replace(/\s+/g, " ");
    check("the running total matches the hand calculation", header.includes("3 / 10"), header.slice(0, 90));
    check("the marked count reflects both entries", header.includes("2 / 7"), header.slice(0, 90));

    // Comments persist independently of the mark.
    await page.getByRole("button", { name: "Add a comment" }).first().click();
    await page.getByRole("textbox", { name: /^Comment on/ }).first().fill("Checked against the brief.");
    await page.waitForTimeout(1200);
    await gotoAuthed(page, runPath);
    // A textarea's value is not part of innerText, so this has to read the
    // control itself — checking the page text would pass on an empty box.
    const savedComment = await page
      .getByRole("textbox", { name: /^Comment on/ })
      .first()
      .inputValue()
      .catch(() => "");
    check("an aspect comment persists", savedComment === "Checked against the brief.", savedComment);

    // A workbook that is not a marking scheme must be refused, not half-imported.
    const junkPath = join(dir, "not-a-scheme.xlsx");
    await writeJunkWorkbook(junkPath);
    await gotoAuthed(page, "/assessments");
    await page.setInputFiles('input[type="file"]', junkPath);
    await page.waitForTimeout(2500);
    check(
      "a workbook that is not a marking scheme is refused",
      (await page.locator("body").innerText()).includes("Sub Criteria ID"),
    );

    // ── The competitor's roadmap surfaces their marks ────────────────────
    await gotoAuthed(page, planPath);
    check(
      "the roadmap has an assessments panel",
      (await page.locator("body").innerText()).includes("No test projects marked yet"),
    );

    await page.getByRole("button", { name: "Mark a test project" }).click();
    await page.getByRole("button", { name: "Start marking" }).click();
    await page.waitForURL(/\/assessments\/runs\/[0-9a-f-]{36}/, { timeout: 30_000 });

    // 1 of 1 on the first measurement aspect, out of the fixture's 10.
    await page.getByRole("button", { name: "Full" }).first().click();
    await page.waitForTimeout(900);

    await gotoAuthed(page, planPath);
    const panel = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    check("the roadmap shows the run's score", panel.includes("1 / 10"), panel.slice(panel.indexOf("Assessments"), panel.indexOf("Assessments") + 120));
    check(
      "a partially marked run is not reported as a percentage",
      panel.includes("In progress"),
      "a partial total is not a score and must not read as one",
    );
    check(
      "the roadmap names the test project marked",
      panel.includes("Synthetic Project"),
    );

    // ── Assessment CRUD from the lists ───────────────────────────────────
    // Renaming a scheme and reassigning a run were both impossible until now:
    // a typo in the workbook's title was permanent, and a run marked against
    // the wrong competitor could only be deleted and marked again.
    await gotoAuthed(page, "/assessments");
    await page.getByRole("button", { name: "Edit Synthetic Project" }).first().click();
    const schemeDialog = page.getByRole("dialog");
    await schemeDialog.getByLabel("Test project").fill("Renamed Project");
    await schemeDialog.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1200);
    await gotoAuthed(page, "/assessments");
    check(
      "a scheme can be renamed from the library",
      (await page.locator("body").innerText()).includes("Renamed Project"),
    );

    // The run list lives on the scheme page — open it through the renamed card,
    // which also proves the card's stretched link still navigates.
    await page.getByRole("link", { name: "Renamed Project" }).first().click();
    await page.waitForURL(/\/assessments\/[0-9a-f-]{36}/, { timeout: 20_000 });

    await page.getByRole("button", { name: /^Edit the run for / }).first().click();
    const runDialog = page.getByRole("dialog");
    await runDialog.getByLabel("Label").fill("Relabelled run");
    await runDialog.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "networkidle" });
    check(
      "a marking run can be relabelled from the scheme",
      (await page.locator("body").innerText()).includes("Relabelled run"),
    );

    // ── Editing and deleting from the list ───────────────────────────────
    // The card was one big <a>; the controls only work because it is now a
    // stretched link with the buttons layered above it. So the thing most
    // likely to have broken is the plainest one: does clicking a card still
    // open the plan.
    for (const view of ["cards", "table"] as const) {
      await gotoAuthed(page, `/?view=${view}`);
      const opened = await page
        .getByRole("link", { name: STUDENT, exact: false })
        .first()
        .click()
        .then(() => page.waitForURL(/\/plan\//, { timeout: 20_000 }))
        .then(() => true)
        .catch(() => false);
      check(`${view} view: a plan still opens from the list`, opened, page.url());

      // The whole card or row is the target, not just the name. Clicking dead
      // space — a progress bar, a gate label — has to navigate too, and only a
      // stretched link does that while leaving middle-click and "open in new
      // tab" intact.
      await gotoAuthed(page, `/?view=${view}`);
      const container = view === "cards" ? ".tp-card-linked" : "tr.tp-row-linked";
      const box = await page.locator(container).first().boundingBox();
      let deadSpace = false;
      if (box) {
        // Right of centre, clear of the name on the left and the controls on
        // the far right.
        await page.mouse.click(box.x + box.width * 0.55, box.y + box.height / 2);
        deadSpace = await page
          .waitForURL(/\/plan\//, { timeout: 20_000 })
          .then(() => true)
          .catch(() => false);
      }
      check(`${view} view: clicking anywhere on it opens the plan`, deadSpace, page.url());

      // ...but not so greedily that it swallows the controls layered above it.
      await gotoAuthed(page, `/?view=${view}`);
      await page.getByRole("button", { name: new RegExp(`^Edit .*${process.pid}.*plan$`) }).first().click();
      const editorOpened = await page
        .getByRole("dialog")
        .waitFor({ timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      check(`${view} view: the row controls still win over the link`, editorOpened);
      await page.keyboard.press("Escape");
    }

    // Both plans carry the pid by now, and the original has also been renamed,
    // so these target the clone — the one name that is still exactly known.
    const CLONE_NAME = `${STUDENT} Clone`;
    const RENAMED = `Verify Renamed ${process.pid}`;

    await gotoAuthed(page, "/?view=cards");
    await page.getByRole("button", { name: `Edit ${CLONE_NAME}'s plan` }).click();
    // Scoped to the dialog: the competitors here are named "Verify Competitor
    // <pid>", so a bare getByLabel("Competitor") also matches every card's
    // "Edit <name>'s plan" aria-label.
    const editDialog = page.getByRole("dialog");
    await editDialog.getByLabel("Competitor").fill(RENAMED);
    await editDialog.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1200);
    await gotoAuthed(page, "/?view=cards");
    check(
      "a plan can be renamed from the list",
      (await page.locator("body").innerText()).includes(RENAMED),
    );

    // The confirmation has to say what is about to be lost, with the right
    // singular or plural — the sentence is the last thing between an
    // instructor and an irreversible delete.
    await page.getByRole("button", { name: `Delete ${RENAMED}'s plan` }).click();
    const confirmText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    const counted = confirmText.slice(confirmText.indexOf("That removes"));
    check(
      "the delete confirmation counts what it will remove",
      /That removes \d+ phases?, \d+ blocks?/.test(confirmText),
      counted.slice(0, 80),
    );
    await page.getByRole("button", { name: "Delete plan", exact: true }).click();
    await page.waitForTimeout(1500);

    await gotoAuthed(page, "/");
    check(
      "deleting from the list clears the plan",
      !(await page.getByText(RENAMED, { exact: false }).first().isVisible().catch(() => false)),
    );

    // ── Clean up: the original still goes through the roadmap ────────────
    for (const path of [planPath]) {
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
