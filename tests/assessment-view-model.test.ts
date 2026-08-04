/**
 * The totals an assessor reads off the header. A slip here misreports a
 * competitor's score without anything looking wrong on screen.
 */
import { describe, expect, it } from "vitest";
import { awardedFor, buildAssessmentRunVM, isMarked } from "@/lib/assessment-view-model";
import type { AssessmentAspect, AssessmentMark, AssessmentScheme } from "@/lib/types";

const aspect = (over: Partial<AssessmentAspect> = {}): AssessmentAspect => ({
  id: over.id ?? "aspect-1",
  sub_criterion_id: "sub-1",
  type: "measurement",
  description: "An aspect",
  extra_description: null,
  max_mark: 1,
  order_index: 1,
  descriptors: [],
  ...over,
});

const mark = (over: Partial<AssessmentMark> = {}): AssessmentMark => ({
  id: "mark-1",
  run_id: "run-1",
  aspect_id: over.aspect_id ?? "aspect-1",
  awarded: null,
  judgement_score: null,
  comment: null,
  ...over,
});

/** Two criteria: A is 4 marks of measurement, B is 3 of measurement + 3 judgement. */
function makeScheme(): AssessmentScheme {
  return {
    id: "scheme-1",
    instructor_id: "user-1",
    skill: "Test Skill",
    test_project: "Synthetic",
    source_file_name: "synthetic.xlsx",
    storage_key: null,
    total_max: 10,
    created_at: "2026-01-01T00:00:00.000Z",
    criteria: [
      {
        id: "c-a",
        scheme_id: "scheme-1",
        letter: "A",
        name: "First part",
        max_measurement: 4,
        max_judgement: 0,
        max_total: 4,
        order_index: 1,
        subCriteria: [
          {
            id: "s-a1",
            criterion_id: "c-a",
            code: "A1",
            name: "Setup",
            order_index: 1,
            aspects: [
              aspect({ id: "a1", max_mark: 1 }),
              aspect({ id: "a2", max_mark: 3 }),
            ],
          },
        ],
      },
      {
        id: "c-b",
        scheme_id: "scheme-1",
        letter: "B",
        name: "Second part",
        max_measurement: 3,
        max_judgement: 3,
        max_total: 6,
        order_index: 2,
        subCriteria: [
          {
            id: "s-b1",
            criterion_id: "c-b",
            code: "B1",
            name: "Behaviour",
            order_index: 1,
            aspects: [
              aspect({ id: "b1", max_mark: 3 }),
              aspect({
                id: "b2",
                type: "judgement",
                max_mark: 3,
                descriptors: [0, 1, 2, 3].map((score) => ({ id: `d${score}`, score, descriptor: `Level ${score}` })),
              }),
            ],
          },
        ],
      },
    ],
  };
}

describe("awardedFor", () => {
  it("gives a measurement aspect exactly what was entered", () => {
    expect(awardedFor(aspect({ max_mark: 2 }), mark({ awarded: 1.25 }))).toBe(1.25);
  });

  it("scores a judgement aspect as score over three of the maximum", () => {
    // The rule printed at the foot of the sheet.
    const judgement = aspect({ type: "judgement", max_mark: 3 });
    expect(awardedFor(judgement, mark({ judgement_score: 0 }))).toBe(0);
    expect(awardedFor(judgement, mark({ judgement_score: 1 }))).toBe(1);
    expect(awardedFor(judgement, mark({ judgement_score: 2 }))).toBe(2);
    expect(awardedFor(judgement, mark({ judgement_score: 3 }))).toBe(3);
  });

  it("rounds a judgement mark that does not divide evenly", () => {
    // 2/3 of 1.5 is 1.0; 1/3 of 1.5 is 0.5; 2/3 of 2 is 1.33…
    expect(awardedFor(aspect({ type: "judgement", max_mark: 1.5 }), mark({ judgement_score: 2 }))).toBe(1);
    expect(awardedFor(aspect({ type: "judgement", max_mark: 1.5 }), mark({ judgement_score: 1 }))).toBe(0.5);
    expect(awardedFor(aspect({ type: "judgement", max_mark: 2 }), mark({ judgement_score: 2 }))).toBe(1.33);
  });

  it("is zero when nothing has been marked", () => {
    expect(awardedFor(aspect(), null)).toBe(0);
    expect(awardedFor(aspect(), mark())).toBe(0);
  });

  it("clamps a mark above the maximum", () => {
    // The input caps it too, but an over-max value would inflate every total
    // above it, so the derivation refuses it as well.
    expect(awardedFor(aspect({ max_mark: 1 }), mark({ awarded: 5 }))).toBe(1);
  });

  it("clamps a negative mark to zero", () => {
    expect(awardedFor(aspect({ max_mark: 1 }), mark({ awarded: -3 }))).toBe(0);
  });

  it("ignores a judgement score sitting on a measurement aspect", () => {
    expect(awardedFor(aspect({ type: "measurement", max_mark: 2 }), mark({ judgement_score: 3 }))).toBe(0);
  });
});

describe("isMarked", () => {
  it("counts a deliberate zero as marked", () => {
    // Awarding nothing is an answer; leaving it blank is not, and the two must
    // not look the same in the progress count.
    expect(isMarked(aspect(), mark({ awarded: 0 }))).toBe(true);
    expect(isMarked(aspect({ type: "judgement" }), mark({ judgement_score: 0 }))).toBe(true);
  });

  it("does not count an absent mark", () => {
    expect(isMarked(aspect(), null)).toBe(false);
    expect(isMarked(aspect(), mark())).toBe(false);
  });

  it("does not count a comment on its own as a mark", () => {
    expect(isMarked(aspect(), mark({ comment: "looked at this" }))).toBe(false);
  });
});

describe("buildAssessmentRunVM", () => {
  it("starts at zero with nothing marked", () => {
    const vm = buildAssessmentRunVM(makeScheme(), []);
    expect(vm.awarded).toBe(0);
    expect(vm.maxMark).toBe(10);
    expect(vm.percentage).toBe(0);
    expect(vm.markedCount).toBe(0);
    expect(vm.aspectCount).toBe(4);
    expect(vm.isComplete).toBe(false);
  });

  it("rolls marks up through sub-criteria and criteria", () => {
    const vm = buildAssessmentRunVM(makeScheme(), [
      mark({ aspect_id: "a1", awarded: 1 }),
      mark({ aspect_id: "a2", awarded: 1.5 }),
      mark({ aspect_id: "b1", awarded: 3 }),
      mark({ aspect_id: "b2", judgement_score: 2 }),
    ]);

    expect(vm.criteria[0].awarded).toBe(2.5);
    expect(vm.criteria[0].maxMark).toBe(4);
    expect(vm.criteria[1].awarded).toBe(5);
    expect(vm.criteria[1].subCriteria[0].awarded).toBe(5);
    expect(vm.awarded).toBe(7.5);
    expect(vm.percentage).toBe(75);
  });

  it("splits measurement from judgement", () => {
    const vm = buildAssessmentRunVM(makeScheme(), [
      mark({ aspect_id: "b1", awarded: 3 }),
      mark({ aspect_id: "b2", judgement_score: 1 }),
    ]);
    expect(vm.measurementMax).toBe(7);
    expect(vm.judgementMax).toBe(3);
    expect(vm.measurementAwarded).toBe(3);
    expect(vm.judgementAwarded).toBe(1);
  });

  it("is complete only when every aspect has an answer", () => {
    const scheme = makeScheme();
    const all = ["a1", "a2", "b1"].map((id) => mark({ aspect_id: id, awarded: 0 }));
    expect(buildAssessmentRunVM(scheme, all).isComplete).toBe(false);

    all.push(mark({ aspect_id: "b2", judgement_score: 0 }));
    const vm = buildAssessmentRunVM(scheme, all);
    expect(vm.isComplete).toBe(true);
    expect(vm.markedCount).toBe(4);
    expect(vm.awarded).toBe(0);
  });

  it("ignores marks for aspects that are not in the scheme", () => {
    const vm = buildAssessmentRunVM(makeScheme(), [mark({ aspect_id: "not-here", awarded: 99 })]);
    expect(vm.awarded).toBe(0);
    expect(vm.markedCount).toBe(0);
  });

  it("reaches exactly full marks rather than a rounding artefact", () => {
    const vm = buildAssessmentRunVM(makeScheme(), [
      mark({ aspect_id: "a1", awarded: 1 }),
      mark({ aspect_id: "a2", awarded: 3 }),
      mark({ aspect_id: "b1", awarded: 3 }),
      mark({ aspect_id: "b2", judgement_score: 3 }),
    ]);
    expect(vm.awarded).toBe(10);
    expect(vm.percentage).toBe(100);
  });

  it("does not divide by zero on a scheme with no aspects", () => {
    const empty: AssessmentScheme = { ...makeScheme(), criteria: [] };
    const vm = buildAssessmentRunVM(empty, []);
    expect(vm.percentage).toBe(0);
    expect(vm.isComplete).toBe(false);
  });
});
