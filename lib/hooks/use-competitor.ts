"use client";

import { useQuery } from "@tanstack/react-query";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CompetitorGateHistoryItem,
  CompetitorPlanHistoryItem,
  CompetitorPlanSummary,
  CompetitorProfile,
  PlanType,
} from "@/lib/types/competitors";

type CompetitorRow = {
  id: string;
  full_name: string;
  email: string | null;
  notes: string | null;
  avatar_color: string | null;
  archived: boolean | null;
  active_plan_id: string | null;
};

type TrainingPlanRow = {
  id: string;
  name: string | null;
  plan_type: PlanType | null;
  owner_competitor_id: string | null;
  color: string | null;
  status: string | null;
  start_date: string | null;
};

function toPlanSummary(row: TrainingPlanRow): CompetitorPlanSummary {
  return {
    id: row.id,
    name: row.name,
    plan_type: row.plan_type === "personal" ? "personal" : "shared",
    owner_competitor_id: row.owner_competitor_id,
    color: row.color,
    status: row.status,
    start_date: row.start_date,
  };
}

async function fetchCompetitor(competitorId: string): Promise<CompetitorProfile> {
  const supabase = getSupabaseBrowserClient();

  const { data: competitorRow, error: competitorError } = await supabase
    .from("competitors")
    .select("id,full_name,email,notes,avatar_color,archived,active_plan_id")
    .eq("id", competitorId)
    .maybeSingle();

  if (competitorError) throw competitorError;
  if (!competitorRow) throw new Error("Competitor not found.");

  const competitor = competitorRow as CompetitorRow;

  const { data: progressRows, error: progressError } = await supabase
    .from("competitor_progress")
    .select(
      "id,training_plan_id,participation_status,status,started_at,completed_at,current_phase_id,current_topic_id"
    )
    .eq("competitor_id", competitorId)
    .order("started_at", { ascending: false, nullsFirst: false });

  if (progressError) throw progressError;

  const historyRows = (progressRows ?? []) as Array<{
    id: string;
    training_plan_id: string;
    participation_status: "active" | "archived" | null;
    status: "not_started" | "in_progress" | "completed";
    started_at: string | null;
    completed_at: string | null;
    current_topic_id: string | null;
  }>;

  const planIds = Array.from(new Set(historyRows.map((item) => item.training_plan_id)));
  if (competitor.active_plan_id && !planIds.includes(competitor.active_plan_id)) {
    planIds.push(competitor.active_plan_id);
  }

  const [plansResult, attemptsResult, gatesResult] = await Promise.all([
    planIds.length
      ? supabase
          .from("training_plans")
          .select("id,name,plan_type,owner_competitor_id,color,status,start_date")
          .in("id", planIds)
      : Promise.resolve({ data: [] as TrainingPlanRow[], error: null }),
    supabase
      .from("gate_attempts")
      .select("id,gate_id,training_plan_id,attempt_date,score,passed,notes,created_at")
      .eq("competitor_id", competitorId)
      .order("created_at", { ascending: false }),
    supabase.from("gates").select("id,name"),
  ]);

  if (plansResult.error) throw plansResult.error;
  if (attemptsResult.error) throw attemptsResult.error;
  if (gatesResult.error) throw gatesResult.error;

  const activeProgress = historyRows.find(
    (item) => item.participation_status !== "archived"
  );

  const activeTopicId = activeProgress?.current_topic_id ?? null;
  let activeBlockName: string | null = null;
  if (activeTopicId) {
    const { data: activeTopicRow, error: topicError } = await supabase
      .from("topics")
      .select("id,name")
      .eq("id", activeTopicId)
      .maybeSingle();
    if (topicError) throw topicError;
    activeBlockName = ((activeTopicRow as { name?: string } | null)?.name ?? null) as string | null;
  }

  const plansById = new Map<string, CompetitorPlanSummary>();
  for (const row of (plansResult.data ?? []) as TrainingPlanRow[]) {
    plansById.set(row.id, toPlanSummary(row));
  }

  const gatesById = new Map<string, string>();
  for (const row of (gatesResult.data ?? []) as Array<{ id: string; name: string }>) {
    gatesById.set(row.id, row.name);
  }

  const attempts = (attemptsResult.data ?? []) as Array<{
    id: string;
    gate_id: string;
    training_plan_id: string | null;
    attempt_date: string;
    score: number;
    passed: boolean;
    notes: string | null;
  }>;

  const passedByPlan = new Map<string, number>();
  const totalsByPlan = new Map<string, number>();
  const totalGatesPassed = attempts.reduce((sum, item) => sum + (item.passed ? 1 : 0), 0);

  for (const attempt of attempts) {
    if (!attempt.training_plan_id) continue;
    totalsByPlan.set(
      attempt.training_plan_id,
      (totalsByPlan.get(attempt.training_plan_id) ?? 0) + 1
    );
    if (attempt.passed) {
      passedByPlan.set(
        attempt.training_plan_id,
        (passedByPlan.get(attempt.training_plan_id) ?? 0) + 1
      );
    }
  }

  const planHistory: CompetitorPlanHistoryItem[] = historyRows
    .map((item) => ({
      id: item.id,
      training_plan_id: item.training_plan_id,
      participation_status: (
        item.participation_status === "archived" ? "archived" : "active"
      ) as "active" | "archived",
      status: item.status,
      started_at: item.started_at,
      completed_at: item.completed_at,
      plan: plansById.get(item.training_plan_id) ?? null,
      gates_passed_count: passedByPlan.get(item.training_plan_id) ?? 0,
      gates_total_count: totalsByPlan.get(item.training_plan_id) ?? 0,
    }))
    .sort((a, b) => {
      const aDate = a.started_at ?? "";
      const bDate = b.started_at ?? "";
      if (aDate === bDate) return a.training_plan_id.localeCompare(b.training_plan_id);
      return aDate < bDate ? 1 : -1;
    });

  const gateHistory: CompetitorGateHistoryItem[] = attempts.map((attempt) => ({
    id: attempt.id,
    gate_id: attempt.gate_id,
    gate_name: gatesById.get(attempt.gate_id) ?? "Gate",
    plan_id: attempt.training_plan_id,
    plan_name: attempt.training_plan_id
      ? plansById.get(attempt.training_plan_id)?.name ?? null
      : null,
    attempt_date: attempt.attempt_date,
    score: attempt.score,
    passed: attempt.passed,
    notes: attempt.notes,
  }));

  return {
    id: competitor.id,
    full_name: competitor.full_name,
    email: competitor.email,
    notes: competitor.notes,
    avatar_color: competitor.avatar_color ?? "#3b82f6",
    archived: Boolean(competitor.archived),
    active_plan_id: competitor.active_plan_id,
    active_plan: competitor.active_plan_id
      ? plansById.get(competitor.active_plan_id) ?? null
      : null,
    active_block_name: activeBlockName,
    total_gates_passed: totalGatesPassed,
    plan_history: planHistory,
    gate_history: gateHistory,
  };
}

export function competitorQueryKey(competitorId: string) {
  return ["competitor", competitorId] as const;
}

export function useCompetitor(competitorId: string) {
  return useQuery({
    queryKey: competitorQueryKey(competitorId),
    queryFn: () => fetchCompetitor(competitorId),
    enabled: Boolean(competitorId),
  });
}
