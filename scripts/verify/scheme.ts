/**
 * Parses a marking scheme workbook in place and prints what was found.
 *
 *   pnpm verify:scheme "/path/to/TP-Something-MarkingScheme.xlsx"
 *
 * Exists so real competition files can be checked without ever being copied
 * into the repository. Reads only; writes nothing, uploads nothing.
 */
import { readFile } from "node:fs/promises";
import { parseMarkingScheme } from "../../src/lib/marking-scheme/parse";
import { readWorkbookGrid } from "../../src/lib/marking-scheme/read-xlsx";

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: pnpm verify:scheme "<path to .xlsx>"');
    process.exit(1);
  }

  const grid = await readWorkbookGrid(await readFile(path));
  const result = parseMarkingScheme(grid);

  if (!result.ok) {
    console.log(`[scheme] REJECTED (${result.errors.length} problem(s)):`);
    for (const error of result.errors) console.log(`  - ${error}`);
    process.exit(1);
  }

  const { scheme } = result;
  const aspects = scheme.criteria.flatMap((c) => c.subCriteria.flatMap((s) => s.aspects));
  const judgement = aspects.filter((a) => a.type === "judgement");

  console.log(`[scheme] Skill:        ${scheme.skill}`);
  console.log(`[scheme] Test Project: ${scheme.testProject}`);
  console.log(
    `[scheme] ${scheme.criteria.length} criteria · ${scheme.criteria.reduce((n, c) => n + c.subCriteria.length, 0)} sub-criteria · ${aspects.length} aspects (${judgement.length} judgement)`,
  );
  console.log(`[scheme] Total max: ${scheme.totalMax}  (sheet says ${scheme.declaredTotal ?? "—"})`);

  for (const criterion of scheme.criteria) {
    const own = criterion.subCriteria.flatMap((s) => s.aspects);
    const sum = own.reduce((n, a) => n + a.maxMark, 0);
    console.log(
      `  ${criterion.letter}  ${criterion.name.padEnd(42).slice(0, 42)} ${String(Math.round(sum * 100) / 100).padStart(6)} / ${criterion.declaredTotal ?? "—"}  (${own.length} aspects, ${criterion.subCriteria.length} sub)`,
    );
  }

  if (scheme.warnings.length > 0) {
    console.log(`[scheme] ${scheme.warnings.length} warning(s):`);
    for (const warning of scheme.warnings) console.log(`  ! ${warning}`);
  } else {
    console.log("[scheme] No warnings — the summary table and the detail rows agree.");
  }
}

main().catch((error: unknown) => {
  console.error(`[scheme] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
