import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_ROUTES } from "@/lib/routes";
import type { Block, Gate, Phase, Plan, PlanWithPhases } from "@/lib/types";

export async function getCurrentUserOrRedirect() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[getCurrentUserOrRedirect] auth.getUser failed", {
      code: error.code,
      message: error.message,
      name: error.name,
      status: error.status,
    });
    redirect(APP_ROUTES.login);
  }

  if (!user) redirect(APP_ROUTES.login);
  return user;
}

export async function getInstructorName() {
  const user = await getCurrentUserOrRedirect();
  const fromMeta = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof fromMeta === "string" && fromMeta.length > 0 ? fromMeta : user.email ?? "Instructor";
}

export async function getPlansForCurrentInstructor(): Promise<PlanWithPhases[]> {
  const user = await getCurrentUserOrRedirect();
  const supabase = createClient();

  const { data: planRows, error: plansError } = await supabase
    .from("training_plans")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  if (plansError) {
    console.error("[getPlansForCurrentInstructor] select training_plans failed", {
      code: plansError.code,
      message: plansError.message,
      details: plansError.details,
      hint: plansError.hint,
    });
    return [];
  }

  if (!planRows) {
    return [];
  }

  const planIds = planRows.map((plan) => plan.id as string);
  if (planIds.length === 0) return [];

  const { data: phasesRows } = await supabase.from("phases").select("*").in("plan_id", planIds).order("order_index");
  const phaseIds = (phasesRows ?? []).map((phase) => phase.id as string);
  const { data: blocksRows } = phaseIds.length
    ? await supabase.from("blocks").select("*").in("phase_id", phaseIds).order("order_index")
    : { data: [] };
  const { data: gatesRows } = await supabase.from("gates").select("*").in("plan_id", planIds);

  return mapPlanTree(
    planRows as Plan[],
    (phasesRows ?? []) as Phase[],
    (blocksRows ?? []) as Block[],
    (gatesRows ?? []) as Gate[],
  );
}

export async function getPlanByIdForCurrentInstructor(id: string): Promise<PlanWithPhases> {
  const user = await getCurrentUserOrRedirect();
  const supabase = createClient();

  const { data: plan, error } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", id)
    .eq("instructor_id", user.id)
    .single();

  if (error) {
    console.error("[getPlanByIdForCurrentInstructor] select training_plans failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    notFound();
  }

  if (!plan) {
    notFound();
  }

  const { data: phasesRows } = await supabase.from("phases").select("*").eq("plan_id", id).order("order_index");
  const phaseIds = (phasesRows ?? []).map((phase) => phase.id as string);
  const { data: blocksRows } = phaseIds.length
    ? await supabase.from("blocks").select("*").in("phase_id", phaseIds).order("order_index")
    : { data: [] };
  const { data: gatesRows } = await supabase.from("gates").select("*").eq("plan_id", id);

  return mapPlanTree([plan as Plan], (phasesRows ?? []) as Phase[], (blocksRows ?? []) as Block[], (gatesRows ?? []) as Gate[])[0];
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
