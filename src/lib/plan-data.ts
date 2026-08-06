import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { query, queryOne, TS } from "@/lib/db";
import type { LibraryRow } from "@/lib/exercise-library";
import { getActiveTeam } from "@/lib/team-data";
import { compareByOrder } from "@/lib/plan-view-model";
import { APP_ROUTES } from "@/lib/routes";
import type { Block, Exercise, Gate, Phase, Plan, PlanWithPhases } from "@/lib/types";

const PLAN_COLS = `id, team_id, created_by, title, student_name, ${TS("created_at", "created_at")}`;
const PHASE_COLS = `id, plan_id, title, order_index, ${TS("created_at", "created_at")}`;
const BLOCK_COLS = `id, phase_id, title, description, verb_level, competence_type, hours::float8 as hours, order_index, ${TS("created_at", "created_at")}`;
const GATE_COLS = `id, plan_id, after_block_id, status, hours_threshold::float8 as hours_threshold, ${TS("created_at", "created_at")}`;
const EXERCISE_COLS = `id, block_id, file_name, kind, storage_key, content_type, url, size_bytes, status, uploaded_by, ${TS("created_at", "created_at")}, ${TS("uploaded_at", "uploaded_at")}`;

/**
 * Only 'ready' rows are returned: a reserved-but-not-uploaded row has no bytes
 * behind it, so surfacing it would offer the instructor a broken download.
 */
async function getExercisesForBlocks(blockIds: string[]): Promise<Exercise[]> {
  if (blockIds.length === 0) return [];

  return query<Exercise>(
    `select ${EXERCISE_COLS}
       from exercises
      where block_id = any($1::uuid[])
        and status = 'ready'
      order by created_at`,
    [blockIds],
  );
}

/**
 * Every exercise the instructor has attached anywhere, for the reuse picker.
 *
 * The only query that spans plans rather than walking one plan's tree — hence
 * the CTE, matching getInstructorStats. `exercises` has no team_id, so scope
 * comes from block -> phase -> plan, the same chain every write path uses.
 *
 * 'ready' only, for the reason getExercisesForBlocks gives: a reserved row has
 * no bytes behind it, and copying one would produce an exercise that looks
 * attached and downloads nothing. The cap is generous for one instructor's
 * material and keeps the payload small enough to search in the browser, which
 * is what spares this a request per keystroke.
 */
export async function getReusableExercises(limit = 500): Promise<LibraryRow[]> {
  const { teamId } = await getActiveTeam();

  return query<LibraryRow>(
    `with my_plans as (select id from training_plans where team_id = $1)
     select e.id, e.file_name, e.kind, e.url, e.content_type, e.size_bytes,
            ${TS("e.created_at", "created_at")}
       from exercises e
       join blocks b on b.id = e.block_id
       join phases ph on ph.id = b.phase_id
      where ph.plan_id in (select id from my_plans)
        and e.status = 'ready'
      order by e.created_at desc
      limit $2`,
    [teamId, limit],
  );
}

export type SessionUser = { id: string; email: string; name: string | null };

export async function getCurrentUserOrRedirect(): Promise<SessionUser> {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) {
    redirect(APP_ROUTES.login);
  }

  return {
    id,
    email: session?.user?.email ?? "",
    name: session?.user?.name ?? null,
  };
}

export async function getInstructorName(): Promise<string> {
  const user = await getCurrentUserOrRedirect();
  return user.name && user.name.length > 0 ? user.name : user.email || "Instructor";
}

export async function getPlansForCurrentInstructor(): Promise<PlanWithPhases[]> {
  const { teamId } = await getActiveTeam();

  const plans = await query<Plan>(
    `select ${PLAN_COLS} from training_plans where team_id = $1 order by created_at desc`,
    [teamId],
  );

  if (plans.length === 0) return [];

  const planIds = plans.map((plan) => plan.id);

  const phases = await query<Phase>(
    `select ${PHASE_COLS} from phases where plan_id = any($1::uuid[]) order by order_index`,
    [planIds],
  );

  const phaseIds = phases.map((phase) => phase.id);

  const blocks = phaseIds.length
    ? await query<Block>(
        `select ${BLOCK_COLS} from blocks where phase_id = any($1::uuid[]) order by order_index`,
        [phaseIds],
      )
    : [];

  const gates = await query<Gate>(
    `select ${GATE_COLS} from gates where plan_id = any($1::uuid[])`,
    [planIds],
  );

  const exercises = await getExercisesForBlocks(blocks.map((block) => block.id));

  return mapPlanTree(plans, phases, blocks, gates, exercises);
}

export type InstructorStats = {
  activeCompetitors: number;
  blocksCompleted30d: number;
  gatesPassedFirstTry: number;
  gatesDecided: number;
  inRemediation: number;
};

/**
 * Numbers for the table view's stat strip. Every one is read from real rows —
 * "first try" and the 30-day window are only answerable because gate_events
 * records outcomes; gates.status alone holds no history.
 */
export async function getInstructorStats(): Promise<InstructorStats> {
  const { teamId } = await getActiveTeam();

  const row = await queryOne<{
    active_competitors: string;
    blocks_completed_30d: string;
    gates_passed_first_try: string;
    gates_decided: string;
    in_remediation: string;
  }>(
    `with my_plans as (
       select id from training_plans where team_id = $1
     ),
     -- One row per gate, holding only its earliest recorded outcome, so a gate
     -- that was failed then later passed is not counted as a first-try pass.
     first_outcome as (
       select distinct on (gate_id) gate_id, status
         from gate_events
        where plan_id in (select id from my_plans)
        order by gate_id, created_at, id
     )
     select
       (select count(*) from my_plans p
         where exists (select 1 from phases ph where ph.plan_id = p.id))            as active_competitors,
       -- distinct gate: re-passing the same gate inside the window is still one
       -- block completed, not two.
       (select count(distinct gate_id) from gate_events
         where plan_id in (select id from my_plans)
           and status = 'passed'
           and created_at >= now() - interval '30 days')                            as blocks_completed_30d,
       (select count(*) from first_outcome where status = 'passed')                 as gates_passed_first_try,
       (select count(*) from first_outcome)                                         as gates_decided,
       (select count(distinct g.plan_id) from gates g
         where g.plan_id in (select id from my_plans) and g.status = 'failed')      as in_remediation`,
    [teamId],
  );

  return {
    activeCompetitors: Number(row?.active_competitors ?? 0),
    blocksCompleted30d: Number(row?.blocks_completed_30d ?? 0),
    gatesPassedFirstTry: Number(row?.gates_passed_first_try ?? 0),
    gatesDecided: Number(row?.gates_decided ?? 0),
    inRemediation: Number(row?.in_remediation ?? 0),
  };
}

export async function getPlanByIdForCurrentInstructor(id: string): Promise<PlanWithPhases> {
  const { teamId } = await getActiveTeam();

  const plan = await queryOne<Plan>(
    `select ${PLAN_COLS} from training_plans where id = $1 and team_id = $2`,
    [id, teamId],
  );

  if (!plan) {
    notFound();
  }

  const phases = await query<Phase>(
    `select ${PHASE_COLS} from phases where plan_id = $1 order by order_index`,
    [id],
  );

  const phaseIds = phases.map((phase) => phase.id);

  const blocks = phaseIds.length
    ? await query<Block>(
        `select ${BLOCK_COLS} from blocks where phase_id = any($1::uuid[]) order by order_index`,
        [phaseIds],
      )
    : [];

  const gates = await query<Gate>(`select ${GATE_COLS} from gates where plan_id = $1`, [id]);

  const exercises = await getExercisesForBlocks(blocks.map((block) => block.id));

  return mapPlanTree([plan], phases, blocks, gates, exercises)[0];
}

function mapPlanTree(
  plans: Plan[],
  phases: Phase[],
  blocks: Block[],
  gates: Gate[],
  exercises: Exercise[],
): PlanWithPhases[] {
  return plans.map((plan) => {
    const planPhases = phases
      .filter((phase) => phase.plan_id === plan.id)
      .sort(compareByOrder)
      .map((phase) => ({
        ...phase,
        blocks: blocks
          .filter((block) => block.phase_id === phase.id)
          .sort(compareByOrder)
          .map((block) => ({
            ...block,
            exercises: exercises.filter((exercise) => exercise.block_id === block.id),
          })),
      }));

    return {
      ...plan,
      phases: planPhases,
      gates: gates.filter((gate) => gate.plan_id === plan.id),
    };
  });
}
