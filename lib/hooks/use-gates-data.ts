"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Gate, GatesData, Assessment, Phase } from "@/components/gates/gates-types";

export const GATES_QUERY_KEY = ["dashboard-gates"] as const;

async function fetchGatesData(): Promise<GatesData> {
  const supabase = getSupabaseBrowserClient();
  const [phasesRes, gatesRes, assessmentsRes] = await Promise.all([
    supabase
      .from("phases")
      .select("id,name,order_index")
      .order("order_index", { ascending: true, nullsFirst: false }),
    supabase
      .from("gates")
      .select("id,phase_id,name,description,gate_type,pass_threshold")
      .order("gate_type", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("gate_assessments")
      .select("id,gate_id,title,description,file_url,file_name,file_type")
      .order("title", { ascending: true }),
  ]);

  if (phasesRes.error) throw phasesRes.error;
  if (gatesRes.error) throw gatesRes.error;
  if (assessmentsRes.error) throw assessmentsRes.error;

  const gatesByPhase = new Map<string, Gate[]>();
  // Supabase result typing is broader than this function needs; we constrain it here.
  for (const g of (gatesRes.data ?? []) as Gate[]) {
    const list = gatesByPhase.get(g.phase_id) ?? [];
    list.push(g);
    gatesByPhase.set(g.phase_id, list);
  }

  const assessmentsByGate = new Map<string, Assessment[]>();
  // Supabase result typing is broader than this function needs; we constrain it here.
  for (const a of (assessmentsRes.data ?? []) as Assessment[]) {
    const list = assessmentsByGate.get(a.gate_id) ?? [];
    list.push(a);
    assessmentsByGate.set(a.gate_id, list);
  }

  return {
    // Supabase result typing is broader than this function needs; we constrain it here.
    phases: (phasesRes.data ?? []) as Phase[],
    gatesByPhase,
    assessmentsByGate,
  };
}

export function useGatesData(): UseQueryResult<GatesData> {
  return useQuery({
    queryKey: GATES_QUERY_KEY,
    queryFn: fetchGatesData,
    staleTime: 30_000,
  });
}

