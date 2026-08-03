/**
 * Screenshots every implemented screen so it can be compared against the
 * design artboards. Output lands in .verify/ (gitignored).
 *
 *   pnpm verify:capture
 *
 * Viewports match the design's artboard widths so a screenshot can be laid
 * next to the corresponding artboard without rescaling.
 */
import { gotoAuthed, shoot, withContext } from "./harness";

type Shot = { name: string; path: string; width: number; height: number };

const SHOTS: Shot[] = [
  // Design artboard: list-v1 "Card grid", 1200x1080
  { name: "list-cards", path: "/?view=cards", width: 1200, height: 1080 },
  // Design artboard: list-v2 "Dense table", 1200x820
  { name: "list-table", path: "/?view=table", width: 1200, height: 820 },
  // Design artboard: detail-v1 "Vertical timeline", 1100x1740
  { name: "detail-timeline", path: "__FIRST_PLAN__?view=timeline", width: 1100, height: 1000 },
  // Design artboard: detail-v2 "Tree / branching", 1280x1000
  { name: "detail-tree", path: "__FIRST_PLAN__?view=tree", width: 1280, height: 1000 },
  // Design artboard: detail-v3 "Subway map", 1100x1260
  { name: "detail-route", path: "__FIRST_PLAN__?view=route", width: 1100, height: 1260 },
  // Design artboard: empty-1 "Empty roadmap", 1100x780
  { name: "empty", path: "__EMPTY_PLAN__", width: 1100, height: 780 },
];

async function main(): Promise<void> {
  await withContext(async (context) => {
    const page = await context.newPage();

    // Resolve the two placeholder routes from whatever the seed produced,
    // rather than hardcoding ids that change on every seed run.
    await gotoAuthed(page, "/");
    const planHrefs = await page.$$eval('a[href^="/plan/"]', (nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href") ?? ""),
    );

    if (planHrefs.length === 0) {
      throw new Error("No plans on the list page — run `pnpm seed:demo` first.");
    }

    const resolved = SHOTS.map((shot) => ({
      ...shot,
      path: shot.path
        .replace("__FIRST_PLAN__", planHrefs[0])
        .replace("__EMPTY_PLAN__", planHrefs[planHrefs.length - 1]),
    }));

    for (const shot of resolved) {
      await page.setViewportSize({ width: shot.width, height: shot.height });
      await gotoAuthed(page, shot.path);
      const file = await shoot(page, shot.name);
      console.log(`[verify] ${shot.name.padEnd(8)} ${shot.path.padEnd(46)} -> ${file}`);
    }
  });
}

main().catch((error: unknown) => {
  console.error(`[verify] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
