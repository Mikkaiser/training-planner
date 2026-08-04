/**
 * Builds a CIS marking scheme grid from a plain spec — the inverse of parse.ts.
 *
 * It lives beside the parser on purpose. The two are one contract, and the only
 * way to keep an authored scheme importable is for the writer and the reader to
 * share their landmarks (COL, HEADER_MARKER) and to be checked against each
 * other by a round-trip test rather than by eye.
 *
 * Pure: a spec in, a string[][] out. Turning that grid into a workbook is a
 * separate step (scripts/build-scheme.ts), so every rule below is testable
 * without a file on disk.
 */
import { COL, round2, type ParsedScheme } from "./parse";

export type AspectSpec = {
  type: "measurement" | "judgement";
  /** Column D — what the assessor is looking for. */
  description: string;
  /** Column F — the deduction rule for a measurement, or context for a judgement. */
  extraDescription?: string | null;
  maxMark: number;
  /** Judgement only: the 0-3 ladder in order, lowest first. Exactly four. */
  descriptors?: string[];
};

export type SubCriterionSpec = { code: string; name: string; aspects: AspectSpec[] };

export type CriterionSpec = { letter: string; name: string; subCriteria: SubCriterionSpec[] };

export type SchemeSpec = {
  skill: string;
  testProject: string;
  criteria: CriterionSpec[];
  /**
   * What the marks are meant to add up to. Optional, but a WorldSkills scheme
   * totals 100, and an author who says so should be told when it does not.
   */
  expectedTotal?: number | null;
};

export type BuildResult =
  | { ok: true; grid: string[][]; spec: SchemeSpec; totalMax: number }
  | { ok: false; errors: string[] };

/** The eleven columns the sheet uses, A through K. */
const WIDTH = 11;

/**
 * The repeating section header, verbatim from a real workbook.
 *
 * Column A is the landmark the parser searches for; the rest is what a person
 * reads. Columns G and H carry no data — G is a label only.
 */
export const HEADER_ROW: readonly string[] = [
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

/** The scoring rule, as the sheets state it in their own footer. */
export const SCORING_RULE = [
  "Judgement aspects: mark awarded = (judgement score 0-3 / 3) x Max Mark.",
  "Measurement aspects: full mark, or the deduction rule given in the extra description.",
] as const;

const CRITERION_LETTER = /^[A-Z]{1,2}$/;
const SUB_CRITERION_CODE = /^[A-Z]{1,2}\d{1,3}$/;

function row(cells: Record<number, string>): string[] {
  const out = new Array<string>(WIDTH).fill("");
  for (const [index, value] of Object.entries(cells)) out[Number(index)] = value;
  return out;
}

/** Trimmed, because the parser trims: an untrimmed spec would not round-trip. */
function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Marks are quarter-points at their finest; anything longer is a float artefact. */
const num = (value: number): string => String(round2(value));

/**
 * Validates a spec and lays it out as a grid.
 *
 * Takes `unknown` rather than a SchemeSpec because the real caller is a
 * hand-authored JSON file: a bad key should produce a sentence naming it, not a
 * TypeError from somewhere further down.
 */
export function buildSchemeGrid(input: unknown): BuildResult {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["The spec must be a JSON object."] };
  }

  const raw = input as Record<string, unknown>;
  const skill = asText(raw.skill);
  const testProject = asText(raw.testProject);

  if (!skill) errors.push('"skill" is required and must be a non-empty string.');
  if (!testProject) errors.push('"testProject" is required and must be a non-empty string.');

  const expectedTotal = raw.expectedTotal === undefined || raw.expectedTotal === null ? null : asNumber(raw.expectedTotal);
  if (raw.expectedTotal !== undefined && raw.expectedTotal !== null && expectedTotal === null) {
    errors.push('"expectedTotal" must be a number when present.');
  }

  if (!Array.isArray(raw.criteria) || raw.criteria.length === 0) {
    errors.push('"criteria" must be an array with at least one criterion.');
    return { ok: false, errors };
  }

  const criteria: CriterionSpec[] = [];
  const seenLetters = new Set<string>();
  const seenCodes = new Set<string>();

  raw.criteria.forEach((entry, criterionIndex) => {
    const at = `criteria[${criterionIndex}]`;
    if (typeof entry !== "object" || entry === null) {
      errors.push(`${at}: must be an object.`);
      return;
    }

    const criterionRaw = entry as Record<string, unknown>;
    const letter = asText(criterionRaw.letter)?.toUpperCase() ?? null;
    const name = asText(criterionRaw.name);

    if (!letter || !CRITERION_LETTER.test(letter)) {
      errors.push(`${at}: "letter" must be one or two capital letters, like "A" or "AB".`);
      return;
    }
    if (seenLetters.has(letter)) errors.push(`${at}: criterion "${letter}" appears more than once.`);
    seenLetters.add(letter);

    if (!name) {
      errors.push(`Criterion ${letter}: "name" is required.`);
      return;
    }

    if (!Array.isArray(criterionRaw.subCriteria) || criterionRaw.subCriteria.length === 0) {
      errors.push(`Criterion ${letter}: "subCriteria" must have at least one entry.`);
      return;
    }

    const subCriteria: SubCriterionSpec[] = [];

    criterionRaw.subCriteria.forEach((subEntry, subIndex) => {
      const subAt = `Criterion ${letter}, subCriteria[${subIndex}]`;
      if (typeof subEntry !== "object" || subEntry === null) {
        errors.push(`${subAt}: must be an object.`);
        return;
      }

      const subRaw = subEntry as Record<string, unknown>;
      const code = asText(subRaw.code)?.toUpperCase() ?? null;
      const subName = asText(subRaw.name);

      if (!code || !SUB_CRITERION_CODE.test(code)) {
        errors.push(`${subAt}: "code" must be a criterion letter followed by digits, like "${letter}1".`);
        return;
      }
      // A code under the wrong criterion still parses, but it makes the sheet
      // lie about where the marks live.
      if (!code.startsWith(letter)) {
        errors.push(`${subAt}: code "${code}" does not start with its criterion letter "${letter}".`);
      }
      if (seenCodes.has(code)) errors.push(`${subAt}: sub-criterion "${code}" appears more than once.`);
      seenCodes.add(code);

      if (!subName) {
        errors.push(`${subAt} (${code}): "name" is required.`);
        return;
      }

      if (!Array.isArray(subRaw.aspects) || subRaw.aspects.length === 0) {
        errors.push(`Sub-criterion ${code}: "aspects" must have at least one entry.`);
        return;
      }

      const aspects: AspectSpec[] = [];

      subRaw.aspects.forEach((aspectEntry, aspectIndex) => {
        const aspectAt = `Sub-criterion ${code}, aspect ${aspectIndex + 1}`;
        if (typeof aspectEntry !== "object" || aspectEntry === null) {
          errors.push(`${aspectAt}: must be an object.`);
          return;
        }

        const aspectRaw = aspectEntry as Record<string, unknown>;
        const type = asText(aspectRaw.type)?.toLowerCase();
        if (type !== "measurement" && type !== "judgement") {
          errors.push(`${aspectAt}: "type" must be "measurement" or "judgement".`);
          return;
        }

        const description = asText(aspectRaw.description);
        if (!description) {
          errors.push(`${aspectAt}: "description" is required.`);
          return;
        }

        const maxMark = asNumber(aspectRaw.maxMark);
        if (maxMark === null || maxMark <= 0) {
          errors.push(`${aspectAt}: "maxMark" must be a number greater than zero.`);
          return;
        }

        const extraDescription = aspectRaw.extraDescription == null ? null : asText(aspectRaw.extraDescription);
        if (aspectRaw.extraDescription != null && extraDescription === null) {
          errors.push(`${aspectAt}: "extraDescription" must be a non-empty string when present.`);
          return;
        }

        let descriptors: string[] | undefined;

        if (type === "judgement") {
          const list = aspectRaw.descriptors;
          if (!Array.isArray(list) || list.length !== 4) {
            // Without the full ladder the assessor picks a number with nothing
            // to anchor it, and the parser rejects the workbook outright.
            errors.push(`${aspectAt}: a judgement aspect needs exactly four "descriptors", for scores 0, 1, 2 and 3.`);
            return;
          }
          const texts = list.map((value) => asText(value));
          const blank = texts.findIndex((value) => value === null);
          if (blank !== -1) {
            errors.push(`${aspectAt}: descriptor for score ${blank} is blank.`);
            return;
          }
          descriptors = texts as string[];
        } else if (aspectRaw.descriptors !== undefined) {
          errors.push(`${aspectAt}: a measurement aspect must not carry "descriptors".`);
          return;
        }

        aspects.push({ type, description, extraDescription, maxMark: round2(maxMark), descriptors });
      });

      if (aspects.length > 0) subCriteria.push({ code, name: subName, aspects });
    });

    if (subCriteria.length > 0) criteria.push({ letter, name, subCriteria });
  });

  if (errors.length > 0 || !skill || !testProject) return { ok: false, errors };

  const spec: SchemeSpec = { skill, testProject, criteria, expectedTotal };

  // ── Totals ──────────────────────────────────────────────────────────
  // Computed from the aspects, never declared separately: the summary table is
  // written from the same numbers the detail rows carry, so the parser's
  // "summary disagrees with detail" warning cannot fire on a built sheet.
  const perCriterion = criteria.map((criterion) => {
    const aspects = criterion.subCriteria.flatMap((sub) => sub.aspects);
    const sumOf = (type: AspectSpec["type"]) =>
      round2(aspects.filter((aspect) => aspect.type === type).reduce((total, aspect) => total + aspect.maxMark, 0));
    const measurement = sumOf("measurement");
    const judgement = sumOf("judgement");
    return { criterion, measurement, judgement, total: round2(measurement + judgement) };
  });

  const totalMax = round2(perCriterion.reduce((total, entry) => total + entry.total, 0));

  if (expectedTotal !== null && Math.abs(totalMax - expectedTotal) > 0.001) {
    return {
      ok: false,
      errors: [`The aspects add up to ${totalMax}, but "expectedTotal" says ${expectedTotal}.`],
    };
  }

  // ── Layout ──────────────────────────────────────────────────────────
  const grid: string[][] = [
    row({ [COL.A]: `Skill: ${spec.skill}` }),
    row({ [COL.A]: `Test Project: ${spec.testProject}` }),
    row({}),
    row({ [COL.A]: "Criterion", [COL.B]: "Description", [COL.C]: "Meas (M)", [COL.D]: "Judg (J)", [COL.E]: "Total" }),
  ];

  for (const entry of perCriterion) {
    grid.push(
      row({
        [COL.A]: entry.criterion.letter,
        [COL.B]: entry.criterion.name,
        [COL.C]: num(entry.measurement),
        [COL.D]: num(entry.judgement),
        [COL.E]: num(entry.total),
      }),
    );
  }

  grid.push(
    row({
      [COL.B]: "Total",
      [COL.C]: num(round2(perCriterion.reduce((total, entry) => total + entry.measurement, 0))),
      [COL.D]: num(round2(perCriterion.reduce((total, entry) => total + entry.judgement, 0))),
      [COL.E]: num(totalMax),
    }),
  );

  for (const entry of perCriterion) {
    const { criterion } = entry;

    grid.push(row({}));

    const header = [...HEADER_ROW];
    header[COL.J] = `Criterion ${criterion.letter}`;
    header[COL.K] = num(entry.total);
    grid.push(header);

    grid.push(row({ [COL.A]: criterion.letter, [COL.B]: criterion.name }));

    for (const sub of criterion.subCriteria) {
      grid.push(row({ [COL.A]: sub.code, [COL.B]: sub.name }));

      for (const aspect of sub.aspects) {
        grid.push(
          row({
            [COL.C]: aspect.type === "judgement" ? "J" : "M",
            [COL.D]: aspect.description,
            [COL.F]: aspect.extraDescription ?? "",
            [COL.I]: num(aspect.maxMark),
            [COL.J]: criterion.letter,
          }),
        );

        // Immediately beneath their aspect: the parser attaches descriptors to
        // the last judgement aspect it saw, and any row between the two ends
        // that association.
        for (const [score, descriptor] of (aspect.descriptors ?? []).entries()) {
          grid.push(row({ [COL.E]: String(score), [COL.F]: descriptor }));
        }
      }
    }
  }

  grid.push(row({}));
  for (const line of SCORING_RULE) grid.push(row({ [COL.A]: line }));

  return { ok: true, grid, spec, totalMax };
}

/**
 * Every way a parsed scheme differs from the spec it was built from.
 *
 * The compatibility check itself, shared by the unit tests and by the build
 * script so that what the tests prove is what the script enforces. Empty means
 * the workbook the system will import says exactly what the author wrote.
 */
export function compareToSpec(spec: SchemeSpec, parsed: ParsedScheme): string[] {
  const differences: string[] = [];
  const note = (where: string, expected: unknown, actual: unknown) =>
    differences.push(`${where}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

  if (parsed.skill !== spec.skill) note("skill", spec.skill, parsed.skill);
  if (parsed.testProject !== spec.testProject) note("testProject", spec.testProject, parsed.testProject);

  if (parsed.criteria.length !== spec.criteria.length) {
    note("criterion count", spec.criteria.length, parsed.criteria.length);
  }

  spec.criteria.forEach((criterion, criterionIndex) => {
    const parsedCriterion = parsed.criteria[criterionIndex];
    if (!parsedCriterion) {
      differences.push(`criterion ${criterion.letter}: missing from the parsed scheme`);
      return;
    }

    if (parsedCriterion.letter !== criterion.letter) note(`criteria[${criterionIndex}].letter`, criterion.letter, parsedCriterion.letter);
    if (parsedCriterion.name !== criterion.name) note(`criterion ${criterion.letter} name`, criterion.name, parsedCriterion.name);

    if (parsedCriterion.subCriteria.length !== criterion.subCriteria.length) {
      note(`criterion ${criterion.letter} sub-criterion count`, criterion.subCriteria.length, parsedCriterion.subCriteria.length);
    }

    criterion.subCriteria.forEach((sub, subIndex) => {
      const parsedSub = parsedCriterion.subCriteria[subIndex];
      if (!parsedSub) {
        differences.push(`sub-criterion ${sub.code}: missing from the parsed scheme`);
        return;
      }

      if (parsedSub.code !== sub.code) note(`criterion ${criterion.letter} sub ${subIndex + 1} code`, sub.code, parsedSub.code);
      if (parsedSub.name !== sub.name) note(`sub-criterion ${sub.code} name`, sub.name, parsedSub.name);

      if (parsedSub.aspects.length !== sub.aspects.length) {
        note(`sub-criterion ${sub.code} aspect count`, sub.aspects.length, parsedSub.aspects.length);
      }

      sub.aspects.forEach((aspect, aspectIndex) => {
        const parsedAspect = parsedSub.aspects[aspectIndex];
        const where = `${sub.code} aspect ${aspectIndex + 1}`;
        if (!parsedAspect) {
          differences.push(`${where}: missing from the parsed scheme`);
          return;
        }

        if (parsedAspect.type !== aspect.type) note(`${where} type`, aspect.type, parsedAspect.type);
        if (parsedAspect.description !== aspect.description) note(`${where} description`, aspect.description, parsedAspect.description);
        if (parsedAspect.maxMark !== round2(aspect.maxMark)) note(`${where} maxMark`, round2(aspect.maxMark), parsedAspect.maxMark);

        const extra = aspect.extraDescription ?? null;
        if (parsedAspect.extraDescription !== extra) note(`${where} extraDescription`, extra, parsedAspect.extraDescription);

        const expectedDescriptors = aspect.descriptors ?? [];
        const actualDescriptors = parsedAspect.descriptors.map((entry) => entry.descriptor);
        if (actualDescriptors.length !== expectedDescriptors.length) {
          note(`${where} descriptor count`, expectedDescriptors.length, actualDescriptors.length);
          return;
        }
        expectedDescriptors.forEach((descriptor, score) => {
          if (parsedAspect.descriptors[score].score !== score) {
            note(`${where} descriptor ${score} score`, score, parsedAspect.descriptors[score].score);
          }
          if (actualDescriptors[score] !== descriptor) note(`${where} descriptor ${score}`, descriptor, actualDescriptors[score]);
        });
      });
    });
  });

  return differences;
}
