/**
 * Reads a WorldSkills "CIS Marking Scheme Import" sheet into a structure.
 *
 * Pure on purpose: a grid of strings in, a scheme out. No workbook library, no
 * database, so every rule below is unit-testable and the file can be imported
 * from anywhere.
 *
 * Nothing is addressed by absolute row number except the two title rows.
 * Sections are found by locating the repeating header row, and each row is
 * classified by which columns carry values. That is what makes a longer scheme
 * work without changes: more rows between the same landmarks.
 */

/** Column letters, as they appear in the sheet. */
const COL = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, I: 8, J: 9, K: 10 } as const;

const HEADER_MARKER = "sub criteria id";
const TOTAL_MARKER = "total";

export type ParsedJudgementDescriptor = { score: number; descriptor: string };

export type ParsedAspect = {
  type: "measurement" | "judgement";
  description: string;
  /** Column F — the deduction rule, or extra context for judging. */
  extraDescription: string | null;
  maxMark: number;
  descriptors: ParsedJudgementDescriptor[];
  /** 1-based row in the source sheet, for error messages. */
  sourceRow: number;
};

export type ParsedSubCriterion = { code: string; name: string; aspects: ParsedAspect[] };

export type ParsedCriterion = {
  letter: string;
  name: string;
  /** From the summary table at the top, when present. */
  declaredMeasurement: number | null;
  declaredJudgement: number | null;
  declaredTotal: number | null;
  subCriteria: ParsedSubCriterion[];
};

export type ParsedScheme = {
  skill: string;
  testProject: string;
  criteria: ParsedCriterion[];
  /** Sum of every aspect's max mark. */
  totalMax: number;
  declaredTotal: number | null;
  /** Non-fatal disagreements between the summary table and the detail rows. */
  warnings: string[];
};

export type ParseResult = { ok: true; scheme: ParsedScheme } | { ok: false; errors: string[] };

const cell = (grid: string[][], row: number, col: number): string => (grid[row]?.[col] ?? "").trim();

const isBlank = (value: string) => value.length === 0;

/** Excel gives us "1.5" or "1,5" depending on locale; both must parse. */
function toNumber(raw: string): number | null {
  if (isBlank(raw)) return null;
  const normalised = raw.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}

/** Strips a leading label such as "Skill:" or "Test Project:". */
function afterLabel(value: string, label: string): string {
  const lower = value.toLowerCase();
  const at = lower.indexOf(label.toLowerCase());
  return at === -1 ? value.trim() : value.slice(at + label.length).replace(/^[:\s]+/, "").trim();
}

/** A sub-criterion code: a criterion letter followed by digits, like "A1" or "B12". */
const SUB_CRITERION_CODE = /^[A-Z]{1,2}\d{1,3}$/;
/** A criterion letter on its own. */
const CRITERION_LETTER = /^[A-Z]{1,2}$/;

export function parseMarkingScheme(grid: string[][]): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── Titles ──────────────────────────────────────────────────────────
  let skill = "";
  let testProject = "";
  for (let row = 0; row < Math.min(grid.length, 10); row += 1) {
    const value = cell(grid, row, COL.A);
    if (!skill && /^skill\s*:/i.test(value)) skill = afterLabel(value, "Skill");
    if (!testProject && /^test\s*project\s*:/i.test(value)) testProject = afterLabel(value, "Test Project");
  }
  if (!skill) errors.push('No "Skill:" row found in the first ten rows.');
  if (!testProject) errors.push('No "Test Project:" row found in the first ten rows.');

  // ── Summary table ───────────────────────────────────────────────────
  // Rows between the "Criterion | Description | …" header and the "Total"
  // row. Used to cross-check the detail, never as the source of the aspects.
  const declared = new Map<string, { meas: number | null; judg: number | null; total: number | null }>();
  let declaredTotal: number | null = null;

  for (let row = 0; row < grid.length; row += 1) {
    const a = cell(grid, row, COL.A);
    const b = cell(grid, row, COL.B);

    if (b.toLowerCase() === TOTAL_MARKER && isBlank(a)) {
      declaredTotal = toNumber(cell(grid, row, COL.E));
      break;
    }
    if (CRITERION_LETTER.test(a) && !isBlank(b) && b.toLowerCase() !== "description") {
      const total = toNumber(cell(grid, row, COL.E));
      // The summary rows are the only place a criterion letter sits beside a
      // Total column value; detail rows have no column E.
      if (total !== null) {
        declared.set(a, {
          meas: toNumber(cell(grid, row, COL.C)),
          judg: toNumber(cell(grid, row, COL.D)),
          total,
        });
      }
    }
  }

  // ── Section headers ─────────────────────────────────────────────────
  const headerRows: number[] = [];
  for (let row = 0; row < grid.length; row += 1) {
    if (cell(grid, row, COL.A).toLowerCase() === HEADER_MARKER) headerRows.push(row);
  }
  if (headerRows.length === 0) {
    errors.push('No "Sub Criteria ID" header row found — this does not look like a CIS marking scheme.');
    return { ok: false, errors };
  }

  // ── Detail ──────────────────────────────────────────────────────────
  const criteria: ParsedCriterion[] = [];

  headerRows.forEach((headerRow, index) => {
    const endRow = index + 1 < headerRows.length ? headerRows[index + 1] : grid.length;

    let criterion: ParsedCriterion | null = null;
    let subCriterion: ParsedSubCriterion | null = null;
    let lastJudgementAspect: ParsedAspect | null = null;

    for (let row = headerRow + 1; row < endRow; row += 1) {
      const a = cell(grid, row, COL.A);
      const b = cell(grid, row, COL.B);
      const c = cell(grid, row, COL.C).toUpperCase();
      const d = cell(grid, row, COL.D);
      const e = cell(grid, row, COL.E);
      const f = cell(grid, row, COL.F);
      const rowNumber = row + 1;

      // Judgement descriptor: a score in E with no aspect marker in C.
      if (isBlank(c) && !isBlank(e)) {
        const score = toNumber(e);
        if (score !== null && score >= 0 && score <= 3 && lastJudgementAspect) {
          lastJudgementAspect.descriptors.push({ score, descriptor: f });
          continue;
        }
      }

      // Aspect: C carries M or J.
      if (c === "M" || c === "J") {
        if (!subCriterion) {
          // An aspect before any sub-criterion still belongs somewhere; give it
          // an unnamed group rather than dropping it on the floor.
          if (!criterion) {
            errors.push(`Row ${rowNumber}: an aspect appears before any criterion.`);
            continue;
          }
          subCriterion = { code: criterion.letter, name: criterion.name, aspects: [] };
          criterion.subCriteria.push(subCriterion);
        }

        const maxMark = toNumber(cell(grid, row, COL.I));
        if (maxMark === null) {
          errors.push(`Row ${rowNumber}: aspect "${d.slice(0, 40)}" has no Max Mark.`);
          continue;
        }
        if (isBlank(d)) {
          errors.push(`Row ${rowNumber}: aspect has a Max Mark but no description.`);
          continue;
        }

        const aspect: ParsedAspect = {
          type: c === "J" ? "judgement" : "measurement",
          description: d,
          extraDescription: isBlank(f) ? null : f,
          maxMark,
          descriptors: [],
          sourceRow: rowNumber,
        };
        subCriterion.aspects.push(aspect);
        lastJudgementAspect = aspect.type === "judgement" ? aspect : null;
        continue;
      }

      // Sub-criterion: "A1" in column A.
      if (SUB_CRITERION_CODE.test(a) && !isBlank(b)) {
        if (!criterion) {
          errors.push(`Row ${rowNumber}: sub-criterion "${a}" appears before any criterion.`);
          continue;
        }
        subCriterion = { code: a, name: b, aspects: [] };
        criterion.subCriteria.push(subCriterion);
        lastJudgementAspect = null;
        continue;
      }

      // Criterion: a bare letter in column A.
      if (CRITERION_LETTER.test(a) && !isBlank(b)) {
        const summary = declared.get(a);
        criterion = {
          letter: a,
          name: b,
          declaredMeasurement: summary?.meas ?? null,
          declaredJudgement: summary?.judg ?? null,
          // The header row's column K repeats the criterion max; prefer it when
          // the summary table is absent.
          declaredTotal: summary?.total ?? toNumber(cell(grid, headerRow, COL.K)),
          subCriteria: [],
        };
        criteria.push(criterion);
        subCriterion = null;
        lastJudgementAspect = null;
      }
    }
  });

  if (criteria.length === 0) errors.push("No criteria found beneath the section headers.");

  // ── Consistency ─────────────────────────────────────────────────────
  let totalMax = 0;

  for (const criterion of criteria) {
    const aspects = criterion.subCriteria.flatMap((sub) => sub.aspects);
    if (aspects.length === 0) {
      warnings.push(`Criterion ${criterion.letter} has no aspects.`);
    }

    for (const aspect of aspects) {
      totalMax += aspect.maxMark;

      if (aspect.type === "judgement") {
        const scores = aspect.descriptors.map((entry) => entry.score).sort();
        // A judgement aspect is meaningless without its 0-3 ladder: the assessor
        // would be picking a number with nothing to anchor it.
        if (scores.length !== 4 || scores.join(",") !== "0,1,2,3") {
          errors.push(
            `Row ${aspect.sourceRow}: judgement aspect "${aspect.description.slice(0, 40)}" needs descriptors for 0, 1, 2 and 3 (found ${scores.length}).`,
          );
        }
      }
    }

    const sum = round2(aspects.reduce((acc, aspect) => acc + aspect.maxMark, 0));
    if (criterion.declaredTotal !== null && Math.abs(sum - criterion.declaredTotal) > 0.001) {
      warnings.push(
        `Criterion ${criterion.letter}: aspects add up to ${sum} but the summary says ${criterion.declaredTotal}.`,
      );
    }
  }

  totalMax = round2(totalMax);
  if (declaredTotal !== null && Math.abs(totalMax - declaredTotal) > 0.001) {
    warnings.push(`Aspects add up to ${totalMax} but the sheet's Total row says ${declaredTotal}.`);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    scheme: { skill, testProject, criteria, totalMax, declaredTotal, warnings },
  };
}

/** Marks are quarter-points at their finest, so two decimals is ample. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
