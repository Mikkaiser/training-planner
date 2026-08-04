import { notFound } from "next/navigation";
import { query, queryOne, TS } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/plan-data";
import type {
  AssessmentAspect,
  AssessmentCriterion,
  AssessmentJudgementDescriptor,
  AssessmentMark,
  AssessmentRun,
  AssessmentRunSummary,
  AssessmentScheme,
  AssessmentSchemeSummary,
  AssessmentSubCriterion,
} from "@/lib/types";

/**
 * Reads for the assessment guide. Every query joins back to instructor_id, the
 * same ownership pattern the plan queries use — there is no RLS behind this.
 */

export async function getSchemesForCurrentInstructor(): Promise<AssessmentSchemeSummary[]> {
  const user = await getCurrentUserOrRedirect();

  return query<AssessmentSchemeSummary>(
    `select s.id, s.skill, s.test_project, s.source_file_name,
            s.total_max::float8 as total_max,
            ${TS("s.created_at", "created_at")},
            (select count(*) from assessment_criteria c where c.scheme_id = s.id)::int as criterion_count,
            (select count(*)
               from assessment_aspects a
               join assessment_sub_criteria sc on sc.id = a.sub_criterion_id
               join assessment_criteria c on c.id = sc.criterion_id
              where c.scheme_id = s.id)::int as aspect_count,
            (select count(*) from assessment_runs r where r.scheme_id = s.id)::int as run_count
       from assessment_schemes s
      where s.instructor_id = $1
      order by s.created_at desc`,
    [user.id],
  );
}

/** The whole scheme tree in four queries rather than one per node. */
export async function getSchemeById(id: string): Promise<AssessmentScheme> {
  const user = await getCurrentUserOrRedirect();

  const scheme = await queryOne<Omit<AssessmentScheme, "criteria">>(
    `select id, instructor_id, skill, test_project, source_file_name, storage_key,
            total_max::float8 as total_max, ${TS("created_at", "created_at")}
       from assessment_schemes
      where id = $1 and instructor_id = $2`,
    [id, user.id],
  );

  if (!scheme) notFound();

  const criteria = await query<Omit<AssessmentCriterion, "subCriteria">>(
    `select id, scheme_id, letter, name,
            max_measurement::float8 as max_measurement,
            max_judgement::float8 as max_judgement,
            max_total::float8 as max_total,
            order_index
       from assessment_criteria where scheme_id = $1 order by order_index`,
    [id],
  );

  const criterionIds = criteria.map((criterion) => criterion.id);

  const subCriteria = criterionIds.length
    ? await query<Omit<AssessmentSubCriterion, "aspects">>(
        `select id, criterion_id, code, name, order_index
           from assessment_sub_criteria where criterion_id = any($1::uuid[]) order by order_index`,
        [criterionIds],
      )
    : [];

  const subIds = subCriteria.map((sub) => sub.id);

  const aspects = subIds.length
    ? await query<Omit<AssessmentAspect, "descriptors">>(
        `select id, sub_criterion_id, type, description, extra_description,
                max_mark::float8 as max_mark, order_index
           from assessment_aspects where sub_criterion_id = any($1::uuid[]) order by order_index`,
        [subIds],
      )
    : [];

  const aspectIds = aspects.map((aspect) => aspect.id);

  const descriptors = aspectIds.length
    ? await query<AssessmentJudgementDescriptor & { aspect_id: string }>(
        `select id, aspect_id, score, descriptor
           from assessment_judgement_descriptors where aspect_id = any($1::uuid[]) order by score`,
        [aspectIds],
      )
    : [];

  const descriptorsByAspect = new Map<string, AssessmentJudgementDescriptor[]>();
  for (const row of descriptors) {
    const list = descriptorsByAspect.get(row.aspect_id) ?? [];
    list.push({ id: row.id, score: row.score, descriptor: row.descriptor });
    descriptorsByAspect.set(row.aspect_id, list);
  }

  const aspectsBySub = new Map<string, AssessmentAspect[]>();
  for (const aspect of aspects) {
    const list = aspectsBySub.get(aspect.sub_criterion_id) ?? [];
    list.push({ ...aspect, descriptors: descriptorsByAspect.get(aspect.id) ?? [] });
    aspectsBySub.set(aspect.sub_criterion_id, list);
  }

  const subsByCriterion = new Map<string, AssessmentSubCriterion[]>();
  for (const sub of subCriteria) {
    const list = subsByCriterion.get(sub.criterion_id) ?? [];
    list.push({ ...sub, aspects: aspectsBySub.get(sub.id) ?? [] });
    subsByCriterion.set(sub.criterion_id, list);
  }

  return {
    ...scheme,
    criteria: criteria.map((criterion) => ({
      ...criterion,
      subCriteria: subsByCriterion.get(criterion.id) ?? [],
    })),
  };
}

export async function getRunsForScheme(schemeId: string): Promise<AssessmentRunSummary[]> {
  const user = await getCurrentUserOrRedirect();

  return query<AssessmentRunSummary>(
    `select r.id, r.scheme_id, r.plan_id, r.label,
            ${TS("r.created_at", "created_at")}, ${TS("r.updated_at", "updated_at")},
            tp.student_name, tp.title as plan_title,
            (select count(*) from assessment_marks m where m.run_id = r.id)::int as marked_count
       from assessment_runs r
       left join training_plans tp on tp.id = r.plan_id
      where r.scheme_id = $1 and r.instructor_id = $2
      order by r.created_at desc`,
    [schemeId, user.id],
  );
}

export async function getRunById(
  id: string,
): Promise<{ run: AssessmentRunSummary; scheme: AssessmentScheme; marks: AssessmentMark[] }> {
  const user = await getCurrentUserOrRedirect();

  const run = await queryOne<AssessmentRunSummary>(
    `select r.id, r.scheme_id, r.plan_id, r.label,
            ${TS("r.created_at", "created_at")}, ${TS("r.updated_at", "updated_at")},
            tp.student_name, tp.title as plan_title,
            0 as marked_count
       from assessment_runs r
       left join training_plans tp on tp.id = r.plan_id
      where r.id = $1 and r.instructor_id = $2`,
    [id, user.id],
  );

  if (!run) notFound();

  const [scheme, marks] = await Promise.all([
    getSchemeById(run.scheme_id),
    query<AssessmentMark>(
      `select id, run_id, aspect_id, awarded::float8 as awarded, judgement_score, comment
         from assessment_marks where run_id = $1`,
      [id],
    ),
  ]);

  return { run, scheme, marks };
}
