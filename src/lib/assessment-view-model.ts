/**
 * Derives everything a marking screen shows from the scheme plus the marks
 * entered so far.
 *
 * Pure, like plan-view-model.ts, and for the same reason: the totals a person
 * reads off the header must be computed in exactly one place, and computed
 * where they can be tested without a database or a browser.
 */
import { round2 } from "@/lib/marking-scheme/parse";
import type { AssessmentAspect, AssessmentMark, AssessmentScheme } from "@/lib/types";

export type AspectVM = AssessmentAspect & {
  /** What the assessor entered, if anything. */
  mark: AssessmentMark | null;
  /** The mark this aspect contributes right now. */
  awarded: number;
  /** False until a mark has been recorded, which is not the same as scoring 0. */
  isMarked: boolean;
};

export type SubCriterionVM = {
  id: string;
  code: string;
  name: string;
  aspects: AspectVM[];
  awarded: number;
  maxMark: number;
};

export type CriterionVM = {
  id: string;
  letter: string;
  name: string;
  subCriteria: SubCriterionVM[];
  awarded: number;
  maxMark: number;
  measurementAwarded: number;
  measurementMax: number;
  judgementAwarded: number;
  judgementMax: number;
  markedCount: number;
  aspectCount: number;
};

export type AssessmentRunVM = {
  criteria: CriterionVM[];
  awarded: number;
  maxMark: number;
  /** 0-100, rounded. */
  percentage: number;
  measurementAwarded: number;
  measurementMax: number;
  judgementAwarded: number;
  judgementMax: number;
  markedCount: number;
  aspectCount: number;
  isComplete: boolean;
};

/**
 * The rule the sheet states in its own footer:
 *
 *   Judgement aspects: mark awarded = (judgement score 0-3 / 3) x Max Mark.
 *   Measurement aspects: full mark, or the deduction rule in the extra description.
 *
 * A judgement mark is always derived, never stored, so re-scoring an aspect
 * cannot leave a stale number behind.
 */
/** Only the two fields scoring depends on, so a summary need not load the tree. */
export type ScorableAspect = Pick<AssessmentAspect, "id" | "type" | "max_mark">;

export function awardedFor(aspect: Pick<AssessmentAspect, "type" | "max_mark">, mark: AssessmentMark | null): number {
  if (!mark) return 0;

  if (aspect.type === "judgement") {
    if (mark.judgement_score === null) return 0;
    return round2((mark.judgement_score / 3) * aspect.max_mark);
  }

  if (mark.awarded === null) return 0;
  // Clamped: the input caps it too, but a mark above the maximum would quietly
  // inflate every total above it.
  return round2(Math.min(Math.max(mark.awarded, 0), aspect.max_mark));
}

/** True once the aspect has an answer — a deliberate zero counts as marked. */
export function isMarked(aspect: Pick<AssessmentAspect, "type">, mark: AssessmentMark | null): boolean {
  if (!mark) return false;
  return aspect.type === "judgement" ? mark.judgement_score !== null : mark.awarded !== null;
}

export type RunSummary = {
  awarded: number;
  maxMark: number;
  percentage: number;
  markedCount: number;
  aspectCount: number;
  isComplete: boolean;
};

/**
 * A run's headline figures from a flat aspect list.
 *
 * Used where the whole scheme tree is not needed — the panel on a competitor's
 * roadmap, for instance. It goes through the same awardedFor/isMarked as the
 * marking screen rather than repeating the rule in SQL, which is how the two
 * would drift apart.
 */
export function summariseRun(aspects: ScorableAspect[], marks: AssessmentMark[]): RunSummary {
  const markByAspect = new Map(marks.map((mark) => [mark.aspect_id, mark]));

  let awarded = 0;
  let maxMark = 0;
  let markedCount = 0;

  for (const aspect of aspects) {
    const mark = markByAspect.get(aspect.id) ?? null;
    awarded += awardedFor(aspect, mark);
    maxMark += aspect.max_mark;
    if (isMarked(aspect, mark)) markedCount += 1;
  }

  awarded = round2(awarded);
  maxMark = round2(maxMark);

  return {
    awarded,
    maxMark,
    percentage: maxMark === 0 ? 0 : Math.round((awarded / maxMark) * 100),
    markedCount,
    aspectCount: aspects.length,
    isComplete: aspects.length > 0 && markedCount === aspects.length,
  };
}

export function buildAssessmentRunVM(scheme: AssessmentScheme, marks: AssessmentMark[]): AssessmentRunVM {
  const markByAspect = new Map(marks.map((mark) => [mark.aspect_id, mark]));

  const criteria: CriterionVM[] = scheme.criteria.map((criterion) => {
    const subCriteria: SubCriterionVM[] = criterion.subCriteria.map((sub) => {
      const aspects: AspectVM[] = sub.aspects.map((aspect) => {
        const mark = markByAspect.get(aspect.id) ?? null;
        return { ...aspect, mark, awarded: awardedFor(aspect, mark), isMarked: isMarked(aspect, mark) };
      });

      return {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        aspects,
        awarded: round2(aspects.reduce((sum, aspect) => sum + aspect.awarded, 0)),
        maxMark: round2(aspects.reduce((sum, aspect) => sum + aspect.max_mark, 0)),
      };
    });

    const aspects = subCriteria.flatMap((sub) => sub.aspects);
    const measurement = aspects.filter((aspect) => aspect.type === "measurement");
    const judgement = aspects.filter((aspect) => aspect.type === "judgement");
    const sum = (list: AspectVM[], pick: (aspect: AspectVM) => number) =>
      round2(list.reduce((total, aspect) => total + pick(aspect), 0));

    return {
      id: criterion.id,
      letter: criterion.letter,
      name: criterion.name,
      subCriteria,
      awarded: sum(aspects, (aspect) => aspect.awarded),
      maxMark: sum(aspects, (aspect) => aspect.max_mark),
      measurementAwarded: sum(measurement, (aspect) => aspect.awarded),
      measurementMax: sum(measurement, (aspect) => aspect.max_mark),
      judgementAwarded: sum(judgement, (aspect) => aspect.awarded),
      judgementMax: sum(judgement, (aspect) => aspect.max_mark),
      markedCount: aspects.filter((aspect) => aspect.isMarked).length,
      aspectCount: aspects.length,
    };
  });

  const total = (pick: (criterion: CriterionVM) => number) =>
    round2(criteria.reduce((sum, criterion) => sum + pick(criterion), 0));

  const awarded = total((criterion) => criterion.awarded);
  const maxMark = total((criterion) => criterion.maxMark);
  const aspectCount = criteria.reduce((sum, criterion) => sum + criterion.aspectCount, 0);
  const markedCount = criteria.reduce((sum, criterion) => sum + criterion.markedCount, 0);

  return {
    criteria,
    awarded,
    maxMark,
    percentage: maxMark === 0 ? 0 : Math.round((awarded / maxMark) * 100),
    measurementAwarded: total((criterion) => criterion.measurementAwarded),
    measurementMax: total((criterion) => criterion.measurementMax),
    judgementAwarded: total((criterion) => criterion.judgementAwarded),
    judgementMax: total((criterion) => criterion.judgementMax),
    markedCount,
    aspectCount,
    isComplete: aspectCount > 0 && markedCount === aspectCount,
  };
}
