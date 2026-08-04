/**
 * Asserts that no page overflows its viewport horizontally, at every width the
 * app is expected to work at.
 *
 *   pnpm verify:responsive
 *
 * A page wider than the viewport is the failure that matters on a phone: the
 * top bar stops covering the scrolled area, controls drift off-screen, and
 * fixed-width tables clip their right-hand columns out of reach. When it does
 * overflow this names the widest offending element rather than leaving you to
 * hunt for it.
 *
 * Elements inside a deliberate horizontal scroller (the tree canvas, the route
 * map) are exempt — those scroll on purpose.
 */
import { gotoAuthed, withContext } from "./harness";

const WIDTHS = [390, 768, 1024, 1440];

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
  }
}

async function main(): Promise<void> {
  await withContext(async (context) => {
    const page = await context.newPage();

    await gotoAuthed(page, "/");
    const hrefs = await page.$$eval('a[href^="/plan/"]', (nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href") ?? ""),
    );
    if (hrefs.length === 0) throw new Error("No plans — run `pnpm seed:demo` first.");

    const routes = [
      { label: "list · cards", path: "/?view=cards" },
      { label: "list · table", path: "/?view=table" },
      { label: "detail · timeline", path: `${hrefs[0]}?view=timeline` },
      { label: "detail · tree", path: `${hrefs[0]}?view=tree` },
      { label: "detail · route", path: `${hrefs[0]}?view=route` },
      { label: "empty roadmap", path: hrefs[hrefs.length - 1] },
      { label: "assessments library", path: "/assessments" },
      { label: "login", path: "/login" },
    ];

    for (const width of WIDTHS) {
      console.log(`\n[responsive] ${width}px`);
      await page.setViewportSize({ width, height: 900 });

      for (const route of routes) {
        if (route.path === "/login") {
          await page.goto(`${new URL(page.url()).origin}/login`, { waitUntil: "networkidle" });
        } else {
          await gotoAuthed(page, route.path);
        }

        const result = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const viewport = window.innerWidth;
          if (docWidth <= viewport + 1) return { docWidth, viewport, culprit: null as string | null };

          // Walk everything and report the widest element whose right edge
          // exceeds the viewport, ignoring anything inside a scroller that is
          // meant to scroll.
          let worst: { desc: string; right: number } | null = null;
          for (const node of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
            const scroller = node.closest(".tp-svg-scroll, .tp-table-wrap, [data-scroll-x]");
            if (scroller) continue;

            const rect = node.getBoundingClientRect();
            if (rect.width === 0) continue;
            const right = rect.right + window.scrollX;
            if (right > viewport + 1 && (!worst || right > worst.right)) {
              const cls = typeof node.className === "string" ? node.className.trim().split(/\s+/).join(".") : "";
              worst = {
                desc: `<${node.tagName.toLowerCase()}${cls ? `.${cls}` : ""}> right=${Math.round(right)}`,
                right,
              };
            }
          }
          return { docWidth, viewport, culprit: worst?.desc ?? "no single element — check a grid or table min-width" };
        });

        check(
          `${route.label} fits`,
          result.culprit === null,
          result.culprit ? `document ${result.docWidth}px in a ${result.viewport}px viewport · widest: ${result.culprit}` : "",
        );
      }
    }

    console.log(`\n[responsive] ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
  });
}

main().catch((error: unknown) => {
  console.error(`[responsive] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
