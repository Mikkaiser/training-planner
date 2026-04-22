"use client";

import { useQuery } from "@tanstack/react-query";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * One training plan row enriched with aggregated counts and creator info.
 * We fetch this client-side so delete/refresh works without full-page reloads.
 */
export type PlanListItem = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  start_date: string | null;
  created_at: string | null;
  color: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  phase_count: number;
  block_count: number;
  gate_count: number;
};

async function fetchPlans(): Promise<PlanListItem[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!authData.user) return [];

  const userId = authData.user.id;

  // Base plans for this user.
  const { data: plans, error } = await supabase
    .from("training_plans")
    .select("id,name,description,status,start_date,created_at,color,created_by")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!plans?.length) return [];

  // Supabase result typing is broader than this function needs; we constrain it here.
  const planIds = (plans as Array<{ id: string }>).map((p) => p.id);

  // Gather all training_plan_phases rows for these plans in one query.
  const { data: tpp, error: tppErr } = await supabase
    .from("training_plan_phases")
    .select("training_plan_id,phase_id")
    .in("training_plan_id", planIds);
  if (tppErr) throw tppErr;

  const phaseIdsByPlan = new Map<string, Set<string>>();
  const allPhaseIds = new Set<string>();
  for (const row of tpp ?? []) {
    // Supabase result typing is broader than this function needs; we constrain it here.
    const planId = (row as { training_plan_id: string }).training_plan_id;
    // Supabase result typing is broader than this function needs; we constrain it here.
    const phaseId = (row as { phase_id: string }).phase_id;
    const set = phaseIdsByPlan.get(planId) ?? new Set<string>();
    set.add(phaseId);
    phaseIdsByPlan.set(planId, set);
    allPhaseIds.add(phaseId);
  }

  // Fetch block + gate counts per phase via two lookup queries.
  const phaseIdArr = Array.from(allPhaseIds);
  const blocksByPhase = new Map<string, number>();
  const gatesByPhase = new Map<string, number>();

  if (phaseIdArr.length) {
    const { data: topics, error: topicsErr } = await supabase
      .from("topics")
      .select("phase_id")
      .in("phase_id", phaseIdArr);
    if (topicsErr) throw topicsErr;
    for (const t of topics ?? []) {
      // Supabase result typing is broader than this function needs; we constrain it here.
      const pid = (t as { phase_id: string }).phase_id;
      blocksByPhase.set(pid, (blocksByPhase.get(pid) ?? 0) + 1);
    }

    const { data: gates, error: gatesErr } = await supabase
      .from("gates")
      .select("phase_id")
      .in("phase_id", phaseIdArr);
    if (gatesErr) throw gatesErr;
    for (const g of gates ?? []) {
      // Supabase result typing is broader than this function needs; we constrain it here.
      const pid = (g as { phase_id: string }).phase_id;
      gatesByPhase.set(pid, (gatesByPhase.get(pid) ?? 0) + 1);
    }
  }

  // Creator profile (single row for this user).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url")
    .eq("id", userId)
    .maybeSingle();

  type PlanRow = {
    id: string;
    name: string | null;
    description: string | null;
    status: string | null;
    start_date: string | null;
    created_at: string | null;
    color: string | null;
  };

  return (plans as PlanRow[]).map((p) => {
    const phases = phaseIdsByPlan.get(p.id) ?? new Set<string>();
    let blockCount = 0;
    let gateCount = 0;
    for (const pid of phases) {
      blockCount += blocksByPhase.get(pid) ?? 0;
      gateCount += gatesByPhase.get(pid) ?? 0;
    }
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      start_date: p.start_date,
      created_at: p.created_at,
      color: p.color,
      creator_name:
        // Supabase typing for `.maybeSingle()` is broader than needed; we constrain to our shape.
        ((profile as { full_name?: string | null } | null)?.full_name ?? null) as
          | string
          | null,
      creator_avatar:
        // Supabase typing for `.maybeSingle()` is broader than needed; we constrain to our shape.
        ((profile as { avatar_url?: string | null } | null)?.avatar_url ?? null) as
          | string
          | null,
      phase_count: phases.size,
      block_count: blockCount,
      gate_count: gateCount,
    };
  });
}

export function useTrainingPlans() {
  return useQuery({
    queryKey: ["training-plans"],
    queryFn: fetchPlans,
  });
}

