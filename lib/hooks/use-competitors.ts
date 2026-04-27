"use client";

import { useQuery } from "@tanstack/react-query";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CompetitorListItem, CompetitorPlanSummary, PlanType } from "@/lib/types/competitors";

type CompetitorsOptions = {
  includeArchived?: boolean;
};

type CompetitorRow = {
  id: string;
  full_name: string;
  email: string | null;
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

async function fetchCompetitors({
  includeArchived = false,
}: CompetitorsOptions): Promise<CompetitorListItem[]> {
  const supabase = getSupabaseBrowserClient();

  let query = supabase
    .from("competitors")
    .select("id,full_name,email,avatar_color,archived,active_plan_id")
    .order("created_at", { ascending: true });

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const { data, error } = await query;
  if (error) throw error;

  const competitors = (data ?? []) as CompetitorRow[];
  if (!competitors.length) return [];

  const competitorIds = competitors.map((item) => item.id);
  const activePlanIds = Array.from(
    new Set(
      competitors
        .map((item) => item.active_plan_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const [{ data: plansRows, error: plansError }, { data: progressRows, error: progressError }] =
    await Promise.all([
      activePlanIds.length
        ? supabase
            .from("training_plans")
            .select("id,name,plan_type,owner_competitor_id,color,status,start_date")
            .in("id", activePlanIds)
        : Promise.resolve({ data: [] as TrainingPlanRow[], error: null }),
      supabase
        .from("competitor_progress")
        .select("competitor_id,training_plan_id")
        .in("competitor_id", competitorIds),
    ]);

  if (plansError) throw plansError;
  if (progressError) throw progressError;

  const plansById = new Map<string, CompetitorPlanSummary>();
  for (const row of (plansRows ?? []) as TrainingPlanRow[]) {
    plansById.set(row.id, toPlanSummary(row));
  }

  const distinctPlansByCompetitor = new Map<string, Set<string>>();
  for (const row of (progressRows ?? []) as Array<{ competitor_id: string; training_plan_id: string }>) {
    const set = distinctPlansByCompetitor.get(row.competitor_id) ?? new Set<string>();
    set.add(row.training_plan_id);
    distinctPlansByCompetitor.set(row.competitor_id, set);
  }

  const { data: attemptsRows, error: attemptsError } = await supabase
    .from("gate_attempts")
    .select("competitor_id,passed")
    .in("competitor_id", competitorIds);

  if (attemptsError) throw attemptsError;

  const passedByCompetitor = new Map<string, number>();
  const attemptsByCompetitor = new Map<string, number>();

  for (const row of (attemptsRows ?? []) as Array<{ competitor_id: string; passed: boolean }>) {
    attemptsByCompetitor.set(
      row.competitor_id,
      (attemptsByCompetitor.get(row.competitor_id) ?? 0) + 1
    );
    if (row.passed) {
      passedByCompetitor.set(
        row.competitor_id,
        (passedByCompetitor.get(row.competitor_id) ?? 0) + 1
      );
    }
  }

  return competitors.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    avatar_color: row.avatar_color ?? "#6385FF",
    archived: Boolean(row.archived),
    active_plan_id: row.active_plan_id,
    active_plan: row.active_plan_id ? plansById.get(row.active_plan_id) ?? null : null,
    gates_passed_count: passedByCompetitor.get(row.id) ?? 0,
    plans_count: distinctPlansByCompetitor.get(row.id)?.size ?? 0,
    gate_attempts_count: attemptsByCompetitor.get(row.id) ?? 0,
  }));
}

export function competitorsQueryKey(includeArchived: boolean) {
  return ["competitors", { includeArchived }] as const;
}

export function useCompetitors(options: CompetitorsOptions = {}) {
  const includeArchived = options.includeArchived ?? false;
  return useQuery({
    queryKey: competitorsQueryKey(includeArchived),
    queryFn: () => fetchCompetitors({ includeArchived }),
  });
}
