/**
 * The builder's only real promise is that what it writes, the importer reads
 * back unchanged. So most of this file is round trips: build a grid from a
 * spec, parse it with the very parser the upload uses, and assert nothing was
 * lost, moved or silently reinterpreted.
 *
 * A builder that drifts from the parser produces workbooks that look correct in
 * Excel and are rejected — or worse, half-read — on import.
 */
import { describe, expect, it } from "vitest";
import { buildSchemeGrid, compareToSpec, HEADER_ROW, SCORING_RULE, type SchemeSpec } from "@/lib/marking-scheme/build";
import { COL, HEADER_MARKER, parseMarkingScheme } from "@/lib/marking-scheme/parse";

/** A judgement aspect's ladder, so the specs below stay about what they test. */
const LADDER = ["Not attempted", "Attempted", "Largely correct", "Fully correct"];

function spec(overrides: Partial<SchemeSpec> = {}): SchemeSpec {
  return {
    skill: "Test Skill",
    testProject: "Synthetic Project",
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
                maxMark: 1.5,
              },
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
            name: "Presentation",
            aspects: [
              { type: "judgement", description: "Overall visual quality", maxMark: 3, descriptors: LADDER },
              { type: "measurement", description: "Application starts", maxMark: 0.5 },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function build(input: unknown) {
  const result = buildSchemeGrid(input);
  if (!result.ok) throw new Error(`expected a build, got errors:\n${result.errors.join("\n")}`);
  return result;
}

function errorsFrom(input: unknown): string[] {
  const result = buildSchemeGrid(input);
  if (result.ok) throw new Error("expected the spec to be rejected, but it built");
  return result.errors;
}

/** Build, then read back through the real parser. */
function roundTrip(input: SchemeSpec) {
  const built = build(input);
  const parsed = parseMarkingScheme(built.grid);
  if (!parsed.ok) throw new Error(`the built grid did not parse:\n${parsed.errors.join("\n")}`);
  return { built, scheme: parsed.scheme };
}

describe("round trip", () => {
  it("reads back exactly what the spec says", () => {
    const input = spec();
    const { scheme } = roundTrip(input);
    expect(compareToSpec(input, scheme)).toEqual([]);
  });

  it("parses without a single warning, so the summary table never contradicts the detail", () => {
    expect(roundTrip(spec()).scheme.warnings).toEqual([]);
  });

  it("keeps fractional marks intact through the sheet", () => {
    const { scheme } = roundTrip(spec());
    const marks = scheme.criteria.flatMap((c) => c.subCriteria.flatMap((s) => s.aspects.map((a) => a.maxMark)));
    expect(marks).toEqual([1, 1.5, 3, 0.5]);
    expect(scheme.totalMax).toBe(6);
  });

  it("keeps the judgement ladder in score order", () => {
    const { scheme } = roundTrip(spec());
    const aspect = scheme.criteria[1].subCriteria[0].aspects[0];
    expect(aspect.type).toBe("judgement");
    expect(aspect.descriptors.map((entry) => entry.score)).toEqual([0, 1, 2, 3]);
    expect(aspect.descriptors.map((entry) => entry.descriptor)).toEqual(LADDER);
  });

  it("leaves the extra description null when the spec omits it", () => {
    const { scheme } = roundTrip(spec());
    expect(scheme.criteria[0].subCriteria[0].aspects[0].extraDescription).toBeNull();
    expect(scheme.criteria[0].subCriteria[0].aspects[1].extraDescription).toBe("Deduct 0.5 per missing file");
  });

  it("survives a scheme far longer than the example — extra rows are just more rows", () => {
    const big: SchemeSpec = {
      skill: "Test Skill",
      testProject: "Large Project",
      criteria: Array.from({ length: 6 }, (_, criterionIndex) => ({
        letter: String.fromCharCode(65 + criterionIndex),
        name: `Criterion ${criterionIndex}`,
        subCriteria: Array.from({ length: 5 }, (_, subIndex) => ({
          code: `${String.fromCharCode(65 + criterionIndex)}${subIndex + 1}`,
          name: `Sub ${subIndex + 1}`,
          aspects: Array.from({ length: 4 }, (_, aspectIndex) => ({
            type: aspectIndex === 3 ? ("judgement" as const) : ("measurement" as const),
            description: `Aspect ${criterionIndex}-${subIndex}-${aspectIndex}`,
            maxMark: 0.5,
            descriptors: aspectIndex === 3 ? LADDER : undefined,
          })),
        })),
      })),
    };

    const { scheme } = roundTrip(big);
    expect(compareToSpec(big, scheme)).toEqual([]);
    expect(scheme.criteria).toHaveLength(6);
    expect(scheme.criteria.flatMap((c) => c.subCriteria.flatMap((s) => s.aspects))).toHaveLength(120);
    expect(scheme.totalMax).toBe(60);
  });

  it("handles the smallest scheme the format allows — one criterion, one aspect", () => {
    const tiny: SchemeSpec = {
      skill: "S",
      testProject: "T",
      criteria: [
        { letter: "A", name: "Only", subCriteria: [{ code: "A1", name: "Only", aspects: [{ type: "measurement", description: "Only aspect", maxMark: 100 }] }] },
      ],
    };
    expect(compareToSpec(tiny, roundTrip(tiny).scheme)).toEqual([]);
  });

  it("survives descriptions carrying the characters that make a cell ambiguous", () => {
    const awkward = spec();
    awkward.criteria[0].subCriteria[0].aspects[0].description = 'Uses "quotes", commas, 1.5 and a\nnewline';
    awkward.criteria[0].name = "Design & Layout — 50%";
    expect(compareToSpec(awkward, roundTrip(awkward).scheme)).toEqual([]);
  });
});

describe("the layout the parser depends on", () => {
  it("writes the header cell the parser searches for", () => {
    expect(HEADER_ROW[0].toLowerCase()).toBe(HEADER_MARKER);
  });

  it("puts the title rows where the parser looks for them", () => {
    const { grid } = build(spec());
    expect(grid[0][COL.A]).toBe("Skill: Test Skill");
    expect(grid[1][COL.A]).toBe("Test Project: Synthetic Project");
  });

  it("opens one section per criterion, carrying its letter and total", () => {
    const { grid } = build(spec());
    const headers = grid.filter((line) => line[COL.A].toLowerCase() === HEADER_MARKER);
    expect(headers.map((line) => line[COL.J])).toEqual(["Criterion A", "Criterion B"]);
    expect(headers.map((line) => line[COL.K])).toEqual(["2.5", "3.5"]);
  });

  it("splits the summary table into measurement and judgement per criterion", () => {
    const { grid } = build(spec());
    const summary = grid.filter((line) => /^[A-Z]$/.test(line[COL.A]) && line[COL.E] !== "");
    expect(summary.map((line) => [line[COL.A], line[COL.C], line[COL.D], line[COL.E]])).toEqual([
      ["A", "2.5", "0", "2.5"],
      ["B", "0.5", "3", "3.5"],
    ]);
  });

  it("closes with the scoring rule the sheet states in its own footer", () => {
    const { grid } = build(spec());
    const text = grid.map((line) => line[COL.A]).join("\n");
    for (const line of SCORING_RULE) expect(text).toContain(line);
  });

  it("puts each judgement descriptor immediately beneath its aspect", () => {
    const { grid } = build(spec());
    const aspectRow = grid.findIndex((line) => line[COL.D] === "Overall visual quality");
    expect(grid.slice(aspectRow + 1, aspectRow + 5).map((line) => line[COL.E])).toEqual(["0", "1", "2", "3"]);
    // The next aspect must not have been pushed in among them.
    expect(grid[aspectRow + 5][COL.C]).toBe("M");
  });

  it("pads every row to the eleven columns the sheet uses", () => {
    const { grid } = build(spec());
    for (const line of grid) expect(line).toHaveLength(11);
  });
});

describe("rejecting a spec that would produce an unreadable sheet", () => {
  it("names the aspect when a judgement ladder is short", () => {
    const broken = spec();
    broken.criteria[1].subCriteria[0].aspects[0].descriptors = ["a", "b", "c"];
    expect(errorsFrom(broken).join(" ")).toMatch(/exactly four "descriptors"/);
  });

  it("rejects a blank rung in the ladder, naming its score", () => {
    const broken = spec();
    broken.criteria[1].subCriteria[0].aspects[0].descriptors = ["a", "  ", "c", "d"];
    expect(errorsFrom(broken).join(" ")).toMatch(/descriptor for score 1 is blank/);
  });

  it("rejects descriptors on a measurement aspect", () => {
    const broken = spec();
    broken.criteria[0].subCriteria[0].aspects[0].descriptors = LADDER;
    expect(errorsFrom(broken).join(" ")).toMatch(/measurement aspect must not carry/);
  });

  it("rejects an aspect with no mark attached", () => {
    const broken = JSON.parse(JSON.stringify(spec()));
    delete broken.criteria[0].subCriteria[0].aspects[0].maxMark;
    expect(errorsFrom(broken).join(" ")).toMatch(/"maxMark" must be a number greater than zero/);
  });

  it("rejects a zero-mark aspect, which would sit on the sheet doing nothing", () => {
    const broken = spec();
    broken.criteria[0].subCriteria[0].aspects[0].maxMark = 0;
    expect(errorsFrom(broken).join(" ")).toMatch(/greater than zero/);
  });

  it("rejects a sub-criterion code filed under the wrong criterion", () => {
    const broken = spec();
    broken.criteria[1].subCriteria[0].code = "A9";
    expect(errorsFrom(broken).join(" ")).toMatch(/does not start with its criterion letter "B"/);
  });

  it("rejects a repeated sub-criterion code", () => {
    const broken = spec();
    broken.criteria[1].subCriteria[0].code = "A1";
    expect(errorsFrom(broken).join(" ")).toMatch(/appears more than once/);
  });

  it("rejects a repeated criterion letter", () => {
    const broken = spec();
    broken.criteria[1].letter = "A";
    expect(errorsFrom(broken).join(" ")).toMatch(/appears more than once/);
  });

  it("rejects a missing skill or test project", () => {
    expect(errorsFrom({ ...spec(), skill: "   " }).join(" ")).toMatch(/"skill" is required/);
    expect(errorsFrom({ ...spec(), testProject: undefined }).join(" ")).toMatch(/"testProject" is required/);
  });

  it("rejects a criterion with no sub-criteria and a sub-criterion with no aspects", () => {
    const noSubs = spec();
    noSubs.criteria[0].subCriteria = [];
    expect(errorsFrom(noSubs).join(" ")).toMatch(/"subCriteria" must have at least one entry/);

    const noAspects = spec();
    noAspects.criteria[0].subCriteria[0].aspects = [];
    expect(errorsFrom(noAspects).join(" ")).toMatch(/"aspects" must have at least one entry/);
  });

  it("rejects anything that is not the object shape at all", () => {
    expect(errorsFrom("nope").join(" ")).toMatch(/must be a JSON object/);
    expect(errorsFrom({ skill: "S", testProject: "T" }).join(" ")).toMatch(/"criteria" must be an array/);
  });

  it("reports every problem at once rather than the first", () => {
    const broken = spec();
    broken.criteria[0].name = "";
    broken.criteria[1].letter = "bad letter";
    expect(errorsFrom(broken).length).toBeGreaterThan(1);
  });
});

describe("expectedTotal", () => {
  it("blocks a scheme whose marks do not add up to what the author declared", () => {
    const errors = errorsFrom(spec({ expectedTotal: 100 }));
    expect(errors.join(" ")).toMatch(/add up to 6, but "expectedTotal" says 100/);
  });

  it("passes when they agree", () => {
    expect(build(spec({ expectedTotal: 6 })).totalMax).toBe(6);
  });

  it("is optional", () => {
    expect(build(spec()).totalMax).toBe(6);
  });
});

describe("compareToSpec", () => {
  // The round-trip assertion is only worth anything if it can fail.
  it("catches a scheme that lost an aspect", () => {
    const input = spec();
    const { scheme } = roundTrip(input);
    scheme.criteria[0].subCriteria[0].aspects.pop();
    expect(compareToSpec(input, scheme).join(" ")).toMatch(/aspect count/);
  });

  it("catches a changed mark, description or descriptor", () => {
    const input = spec();

    const marked = roundTrip(input).scheme;
    marked.criteria[0].subCriteria[0].aspects[0].maxMark = 2;
    expect(compareToSpec(input, marked).join(" ")).toMatch(/maxMark/);

    const reworded = roundTrip(input).scheme;
    reworded.criteria[0].subCriteria[0].aspects[0].description = "Something else";
    expect(compareToSpec(input, reworded).join(" ")).toMatch(/description/);

    const reladdered = roundTrip(input).scheme;
    reladdered.criteria[1].subCriteria[0].aspects[0].descriptors[2].descriptor = "Different";
    expect(compareToSpec(input, reladdered).join(" ")).toMatch(/descriptor 2/);
  });
});
