import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { query, queryOne, TS } from "@/lib/db";
import { APP_ROUTES } from "@/lib/routes";
import type { Block, Gate, Phase, Plan, PlanWithPhases } from "@/lib/types";

const PLAN_COLS = `id, instructor_id, title, student_name, ${TS("created_at", "created_at")}`;
const PHASE_COLS = `id, plan_id, title, order_index, ${TS("created_at", "created_at")}`;
const BLOCK_COLS = `id, phase_id, title, description, verb_level, competence_type, hours::float8 as hours, order_index, ${TS("created_at", "created_at")}`;
const GATE_COLS = `id, plan_id, after_block_id, status, hours_threshold::float8 as hours_threshold, ${TS("created_at", "created_at")}`;

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
  const user = await getCurrentUserOrRedirect();

  const plans = await query<Plan>(
    `select ${PLAN_COLS} from training_plans where instructor_id = $1 order by created_at desc`,
    [user.id],
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

  return mapPlanTree(plans, phases, blocks, gates);
}

export async function getPlanByIdForCurrentInstructor(id: string): Promise<PlanWithPhases> {
  const user = await getCurrentUserOrRedirect();

  const plan = await queryOne<Plan>(
    `select ${PLAN_COLS} from training_plans where id = $1 and instructor_id = $2`,
    [id, user.id],
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

  return mapPlanTree([plan], phases, blocks, gates)[0];
}

function mapPlanTree(plans: Plan[], phases: Phase[], blocks: Block[], gates: Gate[]): PlanWithPhases[] {
  return plans.map((plan) => {
    const planPhases = phases
      .filter((phase) => phase.plan_id === plan.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((phase) => ({
        ...phase,
        blocks: blocks.filter((block) => block.phase_id === phase.id).sort((a, b) => a.order_index - b.order_index),
      }));

    return {
      ...plan,
      phases: planPhases,
      gates: gates.filter((gate) => gate.plan_id === plan.id),
    };
  });
}
