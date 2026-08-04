/**
 * Writes a CIS marking scheme workbook from a JSON spec, then proves the system
 * can read it back.
 *
 *   pnpm scheme:build path/to/scheme.json [-o path/to/output.xlsx] [--force]
 *
 * The proof is the point. Anyone can emit a spreadsheet that looks like a
 * marking scheme; this one is opened again with the same reader the upload uses
 * (readWorkbookGrid + parseMarkingScheme) and compared field by field against
 * the spec. If the round trip loses or changes anything the file is deleted
 * rather than left lying around looking finished.
 */
import { readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import ExcelJS from "exceljs";
import { buildSchemeGrid, compareToSpec, type SchemeSpec } from "../src/lib/marking-scheme/build";
import { HEADER_MARKER, parseMarkingScheme } from "../src/lib/marking-scheme/parse";
import { readWorkbookGrid } from "../src/lib/marking-scheme/read-xlsx";

/** Column widths, A through K, chosen so the sheet is readable unedited. */
const WIDTHS = [14, 34, 11, 54, 10, 54, 26, 4, 10, 13, 10];
/** The columns holding prose; they wrap rather than run under their neighbour. */
const WRAPPED = new Set([1, 3, 5, 6]);

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEFEFEF" },
};

/**
 * Exactly the shape `String(someNumber)` produces — no leading zeros, no signs.
 *
 * Anything matching is written as a number, so Excel treats marks as marks;
 * anything else stays text. Restricting it this tightly is what keeps the round
 * trip exact: an aspect described as "007" must not come back as 7.
 */
const PLAIN_NUMBER = /^(0|[1-9]\d*)(\.\d+)?$/;

function fail(message: string, detail: string[] = []): never {
  console.error(`[scheme:build] ${message}`);
  for (const line of detail) console.error(`  - ${line}`);
  process.exit(1);
}

function writeWorkbook(grid: string[][], spec: SchemeSpec): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "training-planner";
  const sheet = workbook.addWorksheet("Marking Scheme");

  WIDTHS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  grid.forEach((cells, rowIndex) => {
    const sheetRow = sheet.getRow(rowIndex + 1);
    const isSectionHeader = (cells[0] ?? "").toLowerCase() === HEADER_MARKER;
    const isSummaryHeader = cells[0] === "Criterion" && cells[1] === "Description";
    const isTitle = rowIndex < 2;
    const isTotal = cells[1] === "Total";

    cells.forEach((value, colIndex) => {
      if (value === "") return;
      const cell = sheetRow.getCell(colIndex + 1);
      cell.value = PLAIN_NUMBER.test(value) ? Number(value) : value;
      cell.alignment = { vertical: "top", wrapText: WRAPPED.has(colIndex) };
      if (isSectionHeader || isSummaryHeader || isTitle || isTotal) {
        cell.font = { bold: true };
        if (!isTitle) cell.fill = HEADER_FILL;
      }
    });

    sheetRow.commit();
  });

  sheet.getRow(1).height = 20;
  // Named after the test project so a downloaded copy is identifiable.
  workbook.title = spec.testProject;

  return workbook.xlsx.writeBuffer();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let force = false;
  let out: string | null = null;
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--force") force = true;
    else if (arg === "-o" || arg === "--out") {
      index += 1;
      out = args[index] ?? null;
      if (!out) fail("-o needs a path.");
    } else positional.push(arg);
  }

  const specPath = positional[0];
  if (!specPath) {
    fail("Usage: pnpm scheme:build <spec.json> [-o <output.xlsx>] [--force]");
  }

  const outPath = resolve(out ?? `${specPath.replace(/\.json$/i, "")}.xlsx`);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(await readFile(resolve(specPath), "utf8"));
  } catch (error) {
    fail(`Could not read ${specPath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const built = buildSchemeGrid(parsedJson);
  if (!built.ok) fail(`The spec has ${built.errors.length} problem(s):`, built.errors);

  // A marking scheme is not a file to clobber by accident, and -o could just as
  // easily be pointed at a real one.
  if (existsSync(outPath) && !force) {
    fail(`${outPath} already exists. Pass --force to overwrite it.`);
  }

  await writeFile(outPath, Buffer.from(await writeWorkbook(built.grid, built.spec)));

  // ── The round trip ──────────────────────────────────────────────────
  const reread = parseMarkingScheme(await readWorkbookGrid(await readFile(outPath)));

  if (!reread.ok) {
    await unlink(outPath).catch(() => undefined);
    fail("The workbook was written but the importer rejected it — nothing was kept:", reread.errors);
  }

  const differences = compareToSpec(built.spec, reread.scheme);
  if (differences.length > 0 || reread.scheme.warnings.length > 0) {
    await unlink(outPath).catch(() => undefined);
    fail("The workbook did not survive the round trip — nothing was kept:", [
      ...differences,
      ...reread.scheme.warnings,
    ]);
  }

  const aspects = built.spec.criteria.flatMap((criterion) =>
    criterion.subCriteria.flatMap((sub) => sub.aspects),
  );
  const judgement = aspects.filter((aspect) => aspect.type === "judgement").length;

  console.log(`[scheme:build] Wrote ${basename(outPath)}`);
  console.log(`[scheme:build] Skill:        ${built.spec.skill}`);
  console.log(`[scheme:build] Test Project: ${built.spec.testProject}`);
  console.log(
    `[scheme:build] ${built.spec.criteria.length} criteria · ${built.spec.criteria.reduce((n, c) => n + c.subCriteria.length, 0)} sub-criteria · ${aspects.length} aspects (${judgement} judgement)`,
  );
  for (const criterion of built.spec.criteria) {
    const own = criterion.subCriteria.flatMap((sub) => sub.aspects);
    const sum = Math.round(own.reduce((n, aspect) => n + aspect.maxMark, 0) * 100) / 100;
    console.log(
      `  ${criterion.letter}  ${criterion.name.padEnd(42).slice(0, 42)} ${String(sum).padStart(6)}  (${own.length} aspects, ${criterion.subCriteria.length} sub)`,
    );
  }
  console.log(`[scheme:build] Total max: ${built.totalMax}`);
  console.log("[scheme:build] Round trip clean — the importer reads back exactly what the spec says.");
  console.log(`[scheme:build] ${outPath}`);
}

main().catch((error: unknown) => {
  console.error(`[scheme:build] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
