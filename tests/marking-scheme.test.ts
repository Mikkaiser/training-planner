/**
 * The parser is the load-bearing part of the assessment guide: everything the
 * assessor sees comes from it, and a silent misread would produce a marking
 * sheet that looks right and marks the wrong thing.
 */
import { describe, expect, it } from "vitest";
import { parseMarkingScheme } from "@/lib/marking-scheme/parse";
import { COL, makeLongerSchemeGrid, makeSchemeGrid, row } from "./marking-scheme-fixture";

const parse = (grid: string[][]) => parseMarkingScheme(grid);

function expectOk(grid: string[][]) {
  const result = parse(grid);
  if (!result.ok) throw new Error(`expected a parse, got errors:\n${result.errors.join("\n")}`);
  return result.scheme;
}

describe("titles", () => {
  it("reads the skill and test project, dropping their labels", () => {
    const scheme = expectOk(makeSchemeGrid());
    expect(scheme.skill).toBe("Test Skill");
    expect(scheme.testProject).toBe("Synthetic Project");
  });

  it("rejects a workbook with no title rows", () => {
    const grid = makeSchemeGrid();
    grid[0] = row({});
    grid[1] = row({});
    const result = parse(grid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/Skill|Test Project/);
  });
});

describe("structure", () => {
  it("finds every criterion, sub-criterion and aspect", () => {
    const scheme = expectOk(makeSchemeGrid());
    expect(scheme.criteria.map((criterion) => criterion.letter)).toEqual(["A", "B"]);
    expect(scheme.criteria[0].subCriteria.map((sub) => sub.code)).toEqual(["A1", "A2"]);
    expect(scheme.criteria.flatMap((c) => c.subCriteria.flatMap((s) => s.aspects))).toHaveLength(7);
  });

  it("keeps the deduction rule from column F", () => {
    const scheme = expectOk(makeSchemeGrid());
    const aspect = scheme.criteria[0].subCriteria[0].aspects[1];
    expect(aspect.extraDescription).toBe("Deduct 0.5 per missing file");
  });

  it("leaves the extra description null when the column is empty", () => {
    const scheme = expectOk(makeSchemeGrid());
    expect(scheme.criteria[0].subCriteria[0].aspects[0].extraDescription).toBeNull();
  });

  it("classifies measurement and judgement aspects", () => {
    const scheme = expectOk(makeSchemeGrid());
    const aspects = scheme.criteria.flatMap((c) => c.subCriteria.flatMap((s) => s.aspects));
    expect(aspects.filter((aspect) => aspect.type === "judgement")).toHaveLength(1);
    expect(aspects.filter((aspect) => aspect.type === "measurement")).toHaveLength(6);
  });

  it("attaches the full 0-3 ladder to a judgement aspect", () => {
    const scheme = expectOk(makeSchemeGrid());
    const judgement = scheme.criteria[1].subCriteria[1].aspects[0];
    expect(judgement.descriptors.map((entry) => entry.score)).toEqual([0, 1, 2, 3]);
    expect(judgement.descriptors[3].descriptor).toBe("Polished and consistent");
  });

  it("reads fractional max marks", () => {
    const scheme = expectOk(makeSchemeGrid());
    expect(scheme.criteria[0].subCriteria[1].aspects[0].maxMark).toBe(1.5);
  });

  it("totals every aspect", () => {
    const scheme = expectOk(makeSchemeGrid());
    expect(scheme.totalMax).toBe(10);
    expect(scheme.declaredTotal).toBe(10);
  });

  it("carries the summary table's split onto each criterion", () => {
    const scheme = expectOk(makeSchemeGrid());
    expect(scheme.criteria[1]).toMatchObject({ declaredMeasurement: 3, declaredJudgement: 3, declaredTotal: 6 });
  });
});

describe("extra lines", () => {
  // The whole point of parsing structurally rather than by row number: a bigger
  // marking scheme is simply more rows between the same landmarks.
  it("absorbs a longer scheme without any change", () => {
    const scheme = expectOk(makeLongerSchemeGrid());
    expect(scheme.criteria[0].subCriteria.map((sub) => sub.code)).toEqual(["A1", "A2", "A3"]);
    expect(scheme.criteria[0].subCriteria[2].aspects).toHaveLength(2);
    expect(scheme.totalMax).toBe(13);
  });

  it("warns when the added rows no longer match the summary table", () => {
    // The fixture's summary still claims 4 for criterion A, but A now holds 7.
    const scheme = expectOk(makeLongerSchemeGrid());
    expect(scheme.warnings.join(" ")).toMatch(/Criterion A/);
    expect(scheme.warnings.join(" ")).toMatch(/Total row says 10/);
  });

  it("has nothing to warn about when the sheet agrees with itself", () => {
    expect(expectOk(makeSchemeGrid()).warnings).toEqual([]);
  });
});

describe("rejections", () => {
  it("refuses a workbook with no section header", () => {
    const grid = makeSchemeGrid().filter((line) => line[COL.A] !== "Sub Criteria ID");
    const result = parse(grid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/Sub Criteria ID/);
  });

  it("refuses an aspect with no max mark, naming the row", () => {
    const grid = makeSchemeGrid();
    const at = grid.findIndex((line) => line[COL.D] === "Environment restored");
    grid[at][COL.I] = "";
    const result = parse(grid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toContain(`Row ${at + 1}`);
  });

  it("refuses a judgement aspect missing part of its ladder", () => {
    // Without all four descriptors the assessor would pick a score with nothing
    // to anchor it, so a partial ladder is a hard error rather than a warning.
    const grid = makeSchemeGrid().filter((line) => line[COL.F] !== "Clear and well aligned");
    const result = parse(grid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/descriptors for 0, 1, 2 and 3/);
  });

  it("refuses an aspect with a mark but no description", () => {
    const grid = makeSchemeGrid();
    const at = grid.findIndex((line) => line[COL.D] === "Errors handled");
    grid[at][COL.D] = "";
    const result = parse(grid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/no description/);
  });

  it("refuses an empty grid rather than importing nothing", () => {
    expect(parse([]).ok).toBe(false);
  });
});

describe("tolerances", () => {
  it("accepts a comma decimal separator", () => {
    const grid = makeSchemeGrid();
    const at = grid.findIndex((line) => line[COL.D] === "Query one correct");
    grid[at][COL.I] = "1,5";
    expect(expectOk(grid).criteria[0].subCriteria[1].aspects[0].maxMark).toBe(1.5);
  });

  it("accepts a lower-case aspect marker", () => {
    const grid = makeSchemeGrid();
    const at = grid.findIndex((line) => line[COL.D] === "Overall visual quality");
    grid[at][COL.C] = "j";
    const judgement = expectOk(grid).criteria[1].subCriteria[1].aspects[0];
    expect(judgement.type).toBe("judgement");
  });

  it("tolerates blank rows between sections", () => {
    const grid = makeSchemeGrid();
    grid.splice(12, 0, row({}), row({}));
    expect(expectOk(grid).totalMax).toBe(10);
  });
});
