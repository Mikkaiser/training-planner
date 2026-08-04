/**
 * A synthetic CIS marking scheme, in the same shape as a real one.
 *
 * Deliberately not a copy of a real competition workbook: those are unreleased
 * material and this repository is on GitHub. Everything structural is
 * reproduced — the title rows, the summary table, the repeating section header,
 * criteria, sub-criteria, both aspect types and the 0-3 judgement ladder — so a
 * parser change that would break a real file breaks these tests first.
 */

const HEADER = [
  "Sub Criteria ID",
  "Sub Criteria Name or Description",
  "Aspect Type\nM=Meas J=Judg",
  "Aspect - Description",
  "Judg Score",
  "Extra Aspect Description (Meas or Judg)\nOR Judgement Score",
  "Requirement (how to measure)",
  "",
  "Max Mark",
  "Criterion",
  "",
];

/** Pads a sparse row out to the eleven columns the sheet uses. */
function row(cells: Record<number, string>): string[] {
  const out: string[] = new Array(11).fill("");
  for (const [index, value] of Object.entries(cells)) out[Number(index)] = value;
  return out;
}

const COL = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, I: 8, J: 9, K: 10 };

function sectionHeader(criterion: string, max: number): string[] {
  const cells = [...HEADER];
  cells[COL.J] = `Criterion ${criterion}`;
  cells[COL.K] = String(max);
  return cells;
}

/**
 * Two criteria, 10 marks. Criterion A is measurement only; criterion B carries a
 * judgement aspect with its full ladder.
 */
export function makeSchemeGrid(): string[][] {
  return [
    row({ [COL.A]: "Skill: Test Skill" }),
    row({ [COL.A]: "Test Project: Synthetic Project" }),
    row({}),
    row({ [COL.A]: "Criterion", [COL.B]: "Description", [COL.C]: "Meas (M)", [COL.D]: "Judg (J)", [COL.E]: "Total" }),
    row({ [COL.A]: "A", [COL.B]: "First part", [COL.C]: "4", [COL.D]: "0", [COL.E]: "4" }),
    row({ [COL.A]: "B", [COL.B]: "Second part", [COL.C]: "3", [COL.D]: "3", [COL.E]: "6" }),
    row({ [COL.B]: "Total", [COL.C]: "7", [COL.D]: "3", [COL.E]: "10" }),
    row({}),

    sectionHeader("A", 4),
    row({ [COL.A]: "A", [COL.B]: "First part" }),
    row({ [COL.A]: "A1", [COL.B]: "Setup" }),
    row({ [COL.C]: "M", [COL.D]: "Environment restored", [COL.I]: "1", [COL.J]: "A" }),
    row({ [COL.C]: "M", [COL.D]: "Files in place", [COL.F]: "Deduct 0.5 per missing file", [COL.I]: "1", [COL.J]: "A" }),
    row({ [COL.A]: "A2", [COL.B]: "Queries" }),
    row({ [COL.C]: "M", [COL.D]: "Query one correct", [COL.I]: "1.5", [COL.J]: "A" }),
    row({ [COL.C]: "M", [COL.D]: "Query two correct", [COL.I]: "0.5", [COL.J]: "A" }),

    sectionHeader("B", 6),
    row({ [COL.A]: "B", [COL.B]: "Second part" }),
    row({ [COL.A]: "B1", [COL.B]: "Behaviour" }),
    row({ [COL.C]: "M", [COL.D]: "Application starts", [COL.I]: "2", [COL.J]: "B" }),
    row({ [COL.C]: "M", [COL.D]: "Errors handled", [COL.I]: "1", [COL.J]: "B" }),
    row({ [COL.A]: "B2", [COL.B]: "Presentation" }),
    row({ [COL.C]: "J", [COL.D]: "Overall visual quality", [COL.I]: "3", [COL.J]: "B" }),
    row({ [COL.E]: "0", [COL.F]: "Cluttered and unreadable" }),
    row({ [COL.E]: "1", [COL.F]: "Readable but plain" }),
    row({ [COL.E]: "2", [COL.F]: "Clear and well aligned" }),
    row({ [COL.E]: "3", [COL.F]: "Polished and consistent" }),

    row({ [COL.A]: "Judgement aspects: mark awarded = (judgement score 0-3 / 3) x Max Mark." }),
  ];
}

/** The same scheme with an extra sub-criterion and aspects appended to A. */
export function makeLongerSchemeGrid(): string[][] {
  const grid = makeSchemeGrid();
  const insertAt = grid.findIndex((line) => line[COL.J] === "Criterion B");

  const extra = [
    row({ [COL.A]: "A3", [COL.B]: "Extra work" }),
    row({ [COL.C]: "M", [COL.D]: "An added aspect", [COL.I]: "1", [COL.J]: "A" }),
    row({ [COL.C]: "M", [COL.D]: "Another added aspect", [COL.I]: "2", [COL.J]: "A" }),
  ];

  return [...grid.slice(0, insertAt), ...extra, ...grid.slice(insertAt)];
}

export { row, COL };
