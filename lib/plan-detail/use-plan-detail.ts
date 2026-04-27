"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";

import { resolvePlanColor } from "@/lib/constants/plan-colors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Subcompetence } from "@/lib/training-plans/types";
import {
  latestAttemptKey,
  type BlockItem,
  type Competitor,
  type CompetitorProgress,
  type Exercise,
  type GateAssessment,
  type GateAttempt,
  type PhaseWithChildren,
  type PlanDetail,
  type PlanDetailPlan,
} from "@/lib/plan-detail/types";

type RawTrainingPlanPhase = {
  phase_id: string;
  order_index: number | null;
  start_offset_weeks: number | null;
};

type RawPhase = {
  id: string;
  name: string;
  description: string | null;
  order_index: number | null;
  duration_weeks: number | null;
};

type RawTopic = {
  id: string;
  phase_id: string;
  subcompetence_id: string | null;
  gate_id: string | null;
  name: string;
  description: string | null;
  order_index: number | null;
};

type RawGate = {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  gate_type: "block_gate" | "phase_gate";
  pass_threshold: number | null;
};

type RawTopicWithGate = RawTopic & { gate: RawGate | null };

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (error && typeof error === "object") {
    const message =
      "message" in error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : null;
    if (message) return new Error(message);
  }
  return new Error(fallbackMessage);
}

async function fetchPlanDetail(planId: string): Promise<PlanDetail> {
  const supabase = getSupabaseBrowserClient();

  const [planRes, tppRes, competitorsRes, progressRes, attemptsRes, subsRes] =
    await Promise.all([
      supabase
        .from("training_plans")
        .select("id,name,description,status,start_date,color,plan_type,owner_competitor_id")
        .eq("id", planId)
        .maybeSingle(),
      supabase
        .from("training_plan_phases")
        .select("phase_id,order_index,start_offset_weeks")
        .eq("training_plan_id", planId),
      supabase
        .from("competitors")
        .select("id,full_name,avatar_color,email,archived")
        .order("created_at", { ascending: true }),
      supabase
        .from("competitor_progress")
        .select(
          "id,competitor_id,training_plan_id,current_topic_id,current_phase_id,status,started_at,completed_at,participation_status"
        )
        .eq("training_plan_id", planId),
      supabase
        .from("gate_attempts")
        .select(
          "id,gate_id,competitor_id,training_plan_id,attempt_date,score,passed,notes,file_url,file_name,file_type,recorded_by,created_at"
        )
        .eq("training_plan_id", planId)
        .order("created_at", { ascending: false }),
      supabase
        .from("subcompetences")
        .select("id,name,description,color,icon"),
    ]);

  if (planRes.error) {
    console.error("[usePlanDetail] training_plans query failed:", planRes.error);
    throw toError(planRes.error, "Failed to load plan.");
  }
  if (!planRes.data) throw new Error("Plan not found");
  if (tppRes.error) {
    console.error(
      "[usePlanDetail] training_plan_phases query failed:",
      tppRes.error
    );
    throw toError(tppRes.error, "Failed to load plan phases.");
  }
  if (competitorsRes.error) {
    console.error("[usePlanDetail] competitors query failed:", competitorsRes.error);
    throw toError(competitorsRes.error, "Failed to load competitors.");
  }
  if (progressRes.error) {
    console.error(
      "[usePlanDetail] competitor_progress query failed:",
      progressRes.error
    );
    throw toError(progressRes.error, "Failed to load competitor progress.");
  }
  if (attemptsRes.error) {
    console.error("[usePlanDetail] gate_attempts query failed:", attemptsRes.error);
    throw toError(attemptsRes.error, "Failed to load gate attempts.");
  }
  if (subsRes.error) {
    console.error("[usePlanDetail] subcompetences query failed:", subsRes.error);
    throw toError(subsRes.error, "Failed to load subcompetences.");
  }

  // Supabase result typing is broader than this function needs; we constrain it here.
  const tpp = (tppRes.data ?? []) as RawTrainingPlanPhase[];
  const phaseIds = tpp.map((r) => r.phase_id);

  // Now fetch phase rows + topics (including gate) in parallel (depends on phaseIds).
  const [phasesRes, topicsRes] = await Promise.all([
    phaseIds.length
      ? supabase
          .from("phases")
          .select("id,name,description,order_index,duration_weeks")
          .in("id", phaseIds)
      : Promise.resolve({
          // Empty fallback preserves the expected `data` item shape.
          data: [] as RawPhase[],
          error: null,
        }),
    phaseIds.length
      ? supabase
          .from("topics")
          .select(
            "id,phase_id,subcompetence_id,gate_id,name,description,order_index, gate:gates(id,phase_id,name,description,gate_type,pass_threshold)"
          )
          .in("phase_id", phaseIds)
          .order("order_index", { ascending: true, nullsFirst: false })
      : Promise.resolve({
          // Empty fallback preserves the expected `data` item shape.
          data: [] as RawTopic[],
          error: null,
        }),
  ]);

  if (phasesRes.error) {
    console.error("[usePlanDetail] phases query failed:", phasesRes.error);
    throw toError(phasesRes.error, "Failed to load phases.");
  }
  if (topicsRes.error) {
    console.error("[usePlanDetail] topics query failed:", topicsRes.error);
    throw toError(topicsRes.error, "Failed to load topics.");
  }

  // Supabase result typing is broader than this function needs; we constrain it here.
  const phasesRaw = (phasesRes.data ?? []) as RawPhase[];
  // Supabase join alias `gate:...` is known at query time but not inferred here.
  const topicsRaw = (topicsRes.data ?? []) as RawTopicWithGate[];

  // Fetch exercises + gate_assessments in parallel (depend on blockIds/gateIds).
  const blockIds = topicsRaw.map((t) => t.id);
  const gateIds = topicsRaw.map((t) => t.gate?.id).filter((x): x is string => Boolean(x));

  const [exercisesRes, assessmentsRes] = await Promise.all([
    blockIds.length
      ? supabase
          .from("exercises")
          .select(
            "id,topic_id,subcompetence_id,title,description,difficulty,file_url,file_name,file_type,preview_url,preview_file_name,created_at"
          )
          .in("topic_id", blockIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({
          // Empty fallback preserves the expected `data` item shape.
          data: [] as Exercise[],
          error: null,
        }),
    gateIds.length
      ? supabase
          .from("gate_assessments")
          .select(
            "id,gate_id,title,description,file_url,file_name,file_type"
          )
          .in("gate_id", gateIds)
      : Promise.resolve({
          // Empty fallback preserves the expected `data` item shape.
          data: [] as GateAssessment[],
          error: null,
        }),
  ]);

  if (exercisesRes.error) {
    console.error("[usePlanDetail] exercises query failed:", exercisesRes.error);
    throw toError(exercisesRes.error, "Failed to load exercises.");
  }
  if (assessmentsRes.error) {
    console.error(
      "[usePlanDetail] gate_assessments query failed:",
      assessmentsRes.error
    );
    throw toError(assessmentsRes.error, "Failed to load gate assessments.");
  }

  // Build phase order using training_plan_phases.order_index.
  const orderByPhaseId = new Map<string, number>();
  for (const row of tpp) {
    orderByPhaseId.set(row.phase_id, row.order_index ?? 0);
  }
  const phasesSorted = [...phasesRaw].sort((a, b) => {
    const ao = orderByPhaseId.get(a.id) ?? 0;
    const bo = orderByPhaseId.get(b.id) ?? 0;
    if (ao !== bo) return ao - bo;
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });

  const subsById = new Map<string, Subcompetence>();
  // Supabase result typing is broader than this function needs; we constrain it here.
  for (const sc of (subsRes.data ?? []) as Subcompetence[]) {
    subsById.set(sc.id, sc);
  }

  // Topics grouped by phase, preserving order_index asc.
  const topicsByPhase = new Map<string, RawTopicWithGate[]>();
  for (const t of topicsRaw) {
    const list = topicsByPhase.get(t.phase_id) ?? [];
    list.push(t);
    topicsByPhase.set(t.phase_id, list);
  }
  for (const list of topicsByPhase.values()) {
    list.sort(
      (a, b) =>
        (a.order_index ?? Number.MAX_SAFE_INTEGER) -
        (b.order_index ?? Number.MAX_SAFE_INTEGER)
    );
  }

  // Build final phases with global block indices.
  const phases: PhaseWithChildren[] = [];
  const blocksById = new Map<string, BlockItem>();
  const orderedBlockIds: string[] = [];
  let globalIdx = 0;

  for (const p of phasesSorted) {
    const phaseBlocks: BlockItem[] = [];
    const phaseTopics = topicsByPhase.get(p.id) ?? [];
    for (const t of phaseTopics) {
      const rawGate = t.gate ?? null;
      if (!rawGate) {
        throw new Error(`Block ${t.id} is missing gate`);
      }

      globalIdx += 1;
      const block: BlockItem = {
        id: t.id,
        phase_id: t.phase_id,
        subcompetence_id: t.subcompetence_id,
        subcompetence: t.subcompetence_id
          ? subsById.get(t.subcompetence_id) ?? null
          : null,
        name: t.name,
        description: t.description,
        order_index: t.order_index,
        global_index: globalIdx,
        gate: {
          id: rawGate.id,
          phase_id: rawGate.phase_id,
          name: rawGate.name,
          description: rawGate.description,
          gate_type: rawGate.gate_type,
          pass_threshold: rawGate.pass_threshold,
        },
      };
      phaseBlocks.push(block);
      blocksById.set(block.id, block);
      orderedBlockIds.push(block.id);
    }

    phases.push({
      id: p.id,
      name: p.name,
      description: p.description,
      order_index: p.order_index,
      duration_weeks: p.duration_weeks,
      blocks: phaseBlocks,
    });
  }

  // Progress + attempts lookups.
  const progressByCompetitor = new Map<string, CompetitorProgress>();
  // Supabase result typing is broader than this function needs; we constrain it here.
  for (const row of (progressRes.data ?? []) as CompetitorProgress[]) {
    progressByCompetitor.set(row.competitor_id, row);
  }

  // Supabase result typing is broader than this function needs; we constrain it here.
  const attemptsSorted = [...((attemptsRes.data ?? []) as GateAttempt[])].sort(
    (a, b) => (a.created_at < b.created_at ? 1 : -1)
  );
  const attemptsByGate = new Map<string, GateAttempt[]>();
  const latestAttemptByGateAndCompetitor = new Map<string, GateAttempt>();
  for (const a of attemptsSorted) {
    const list = attemptsByGate.get(a.gate_id) ?? [];
    list.push(a);
    attemptsByGate.set(a.gate_id, list);
    const key = latestAttemptKey(a.gate_id, a.competitor_id);
    if (!latestAttemptByGateAndCompetitor.has(key)) {
      latestAttemptByGateAndCompetitor.set(key, a);
    }
  }

  const exercisesByBlock = new Map<string, Exercise[]>();
  // Supabase result typing is broader than this function needs; we constrain it here.
  for (const ex of (exercisesRes.data ?? []) as Exercise[]) {
    if (!ex.topic_id) continue;
    const list = exercisesByBlock.get(ex.topic_id) ?? [];
    list.push(ex);
    exercisesByBlock.set(ex.topic_id, list);
  }

  const assessmentsByGate = new Map<string, GateAssessment[]>();
  // Supabase result typing is broader than this function needs; we constrain it here.
  for (const a of (assessmentsRes.data ?? []) as GateAssessment[]) {
    const list = assessmentsByGate.get(a.gate_id) ?? [];
    list.push(a);
    assessmentsByGate.set(a.gate_id, list);
  }

  const plan: PlanDetailPlan = {
    // `training_plans.id` is a DB primary key; it is always present when row exists.
    id: planRes.data.id as string,
    // Nullable DB columns; enforce null instead of undefined.
    name: (planRes.data.name ?? null) as string | null,
    // Nullable DB columns; enforce null instead of undefined.
    description: (planRes.data.description ?? null) as string | null,
    // Supabase enum typing isn't fully inferred here; constrain to our union.
    status: (planRes.data.status ?? "draft") as PlanDetailPlan["status"],
    // Nullable DB columns; enforce null instead of undefined.
    start_date: (planRes.data.start_date ?? null) as string | null,
    color: resolvePlanColor(planRes.data.color),
    plan_type:
      ((planRes.data.plan_type ?? "shared") as "shared" | "personal"),
    owner_competitor_id: (planRes.data.owner_competitor_id ?? null) as string | null,
  };

  const progressRows = (progressRes.data ?? []) as Array<
    CompetitorProgress & { participation_status?: "active" | "archived" | null }
  >;
  const activeProgressRows = progressRows.filter(
    (row) => (row.participation_status ?? "active") === "active"
  );

  const activeCompetitorIds = new Set(activeProgressRows.map((row) => row.competitor_id));
  const competitors = ((competitorsRes.data ?? []) as Competitor[])
    .filter((row) => {
      if (plan.plan_type === "personal" && plan.owner_competitor_id) {
        return row.id === plan.owner_competitor_id;
      }
      return activeCompetitorIds.has(row.id);
    });

  return {
    plan,
    competitors,
    phases,
    progressByCompetitor,
    attemptsByGate,
    latestAttemptByGateAndCompetitor,
    exercisesByBlock,
    assessmentsByGate,
    orderedBlockIds,
    blocksById,
  };
}

export function planDetailQueryKey(planId: string) {
  return ["plan-detail", planId] as const;
}

export function usePlanDetail(planId: string): UseQueryResult<PlanDetail, Error> {
  return useQuery({
    queryKey: planDetailQueryKey(planId),
    queryFn: () => fetchPlanDetail(planId),
    staleTime: 30_000,
  });
}

/**
 * Convenience: fully flat list of blocks in plan order with their parent
 * phase id — used by the "advance to next block on gate pass" logic.
 */
export function useFlatBlocks(detail: PlanDetail | undefined): BlockItem[] {
  return useMemo(() => {
    if (!detail) return [];
    return detail.orderedBlockIds
      .map((id) => detail.blocksById.get(id))
      .filter((b): b is BlockItem => Boolean(b));
  }, [detail]);
}
