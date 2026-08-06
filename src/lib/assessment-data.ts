import { notFound } from "next/navigation";
import { query, queryOne, TS } from "@/lib/db";
import { getActiveTeam } from "@/lib/team-data";
import { summariseRun, type RunSummary, type ScorableAspect } from "@/lib/assessment-view-model";
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
 * Reads for the assessment guide. Every query filters on team_id, the same
 * scoping the plan queries use — there is no RLS behind this.
 *
 * Note the runs queries now also constrain the joined training_plan and scheme
 * to the team. Scoping on the run alone was enough while one person owned all
 * three; once a plan can be shared, a run pointing at another team's plan would
 * have joined its competitor's name straight in.
 */

export async function getSchemesForCurrentInstructor(): Promise<AssessmentSchemeSummary[]> {
  const { teamId } = await getActiveTeam();

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
      where s.team_id = $1
      order by s.created_at desc`,
    [teamId],
  );
}

/** The whole scheme tree in four queries rather than one per node. */
export async function getSchemeById(id: string): Promise<AssessmentScheme> {
  const { teamId } = await getActiveTeam();

  const scheme = await queryOne<Omit<AssessmentScheme, "criteria">>(
    `select id, team_id, created_by, skill, test_project, source_file_name, storage_key,
            total_max::float8 as total_max, ${TS("created_at", "created_at")}
       from assessment_schemes
      where id = $1 and team_id = $2`,
    [id, teamId],
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
  const { teamId } = await getActiveTeam();

  return query<AssessmentRunSummary>(
    `select r.id, r.scheme_id, r.plan_id, r.label,
            ${TS("r.created_at", "created_at")}, ${TS("r.updated_at", "updated_at")},
            tp.student_name, tp.title as plan_title,
            (select count(*) from assessment_marks m where m.run_id = r.id)::int as marked_count
       from assessment_runs r
       left join training_plans tp on tp.id = r.plan_id and tp.team_id = $2
      where r.scheme_id = $1 and r.team_id = $2
      order by r.created_at desc`,
    [schemeId, teamId],
  );
}

export type PlanAssessment = {
  runId: string;
  schemeId: string;
  testProject: string;
  label: string | null;
  createdAt: string;
} & RunSummary;

/**
 * A competitor's marking runs, with their headline figures.
 *
 * The totals are computed with summariseRun rather than in SQL: the judgement
 * rule (score / 3 x max) lives in one place, and a second copy in a query is
 * how the roadmap and the marking screen would come to disagree.
 */
export async function getAssessmentsForPlan(planId: string): Promise<PlanAssessment[]> {
  const { teamId } = await getActiveTeam();

  const runs = await query<{
    id: string;
    scheme_id: string;
    test_project: string;
    label: string | null;
    created_at: string;
  }>(
    `select r.id, r.scheme_id, s.test_project, r.label, ${TS("r.created_at", "created_at")}
       from assessment_runs r
       join assessment_schemes s on s.id = r.scheme_id and s.team_id = $2
       join training_plans tp on tp.id = r.plan_id and tp.team_id = $2
      where r.plan_id = $1 and r.team_id = $2
      order by r.created_at desc`,
    [planId, teamId],
  );

  if (runs.length === 0) return [];

  const schemeIds = [...new Set(runs.map((run) => run.scheme_id))];
  const runIds = runs.map((run) => run.id);

  const [aspects, marks] = await Promise.all([
    query<ScorableAspect & { scheme_id: string }>(
      `select a.id, a.type, a.max_mark::float8 as max_mark, c.scheme_id
         from assessment_aspects a
         join assessment_sub_criteria sc on sc.id = a.sub_criterion_id
         join assessment_criteria c on c.id = sc.criterion_id
        where c.scheme_id = any($1::uuid[])`,
      [schemeIds],
    ),
    query<AssessmentMark>(
      `select id, run_id, aspect_id, awarded::float8 as awarded, judgement_score, comment
         from assessment_marks where run_id = any($1::uuid[])`,
      [runIds],
    ),
  ]);

  const aspectsByScheme = new Map<string, ScorableAspect[]>();
  for (const aspect of aspects) {
    const list = aspectsByScheme.get(aspect.scheme_id) ?? [];
    list.push({ id: aspect.id, type: aspect.type, max_mark: aspect.max_mark });
    aspectsByScheme.set(aspect.scheme_id, list);
  }

  const marksByRun = new Map<string, AssessmentMark[]>();
  for (const mark of marks) {
    const list = marksByRun.get(mark.run_id) ?? [];
    list.push(mark);
    marksByRun.set(mark.run_id, list);
  }

  return runs.map((run) => ({
    runId: run.id,
    schemeId: run.scheme_id,
    testProject: run.test_project,
    label: run.label,
    createdAt: run.created_at,
    ...summariseRun(aspectsByScheme.get(run.scheme_id) ?? [], marksByRun.get(run.id) ?? []),
  }));
}

/** Schemes offered when starting a run from a competitor's roadmap. */
export async function getSchemeOptions(): Promise<{ id: string; testProject: string; totalMax: number }[]> {
  const { teamId } = await getActiveTeam();

  const rows = await query<{ id: string; test_project: string; total_max: number }>(
    `select id, test_project, total_max::float8 as total_max
       from assessment_schemes where team_id = $1 order by created_at desc`,
    [teamId],
  );

  return rows.map((row) => ({ id: row.id, testProject: row.test_project, totalMax: row.total_max }));
}

export async function getRunById(
  id: string,
): Promise<{ run: AssessmentRunSummary; scheme: AssessmentScheme; marks: AssessmentMark[] }> {
  const { teamId } = await getActiveTeam();

  const run = await queryOne<AssessmentRunSummary>(
    `select r.id, r.scheme_id, r.plan_id, r.label,
            ${TS("r.created_at", "created_at")}, ${TS("r.updated_at", "updated_at")},
            tp.student_name, tp.title as plan_title,
            0 as marked_count
       from assessment_runs r
       left join training_plans tp on tp.id = r.plan_id and tp.team_id = $2
      where r.id = $1 and r.team_id = $2`,
    [id, teamId],
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
