"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { competitorQueryKey } from "@/lib/hooks/use-competitor";
import { competitorsQueryKey } from "@/lib/hooks/use-competitors";
import { planDetailQueryKey } from "@/lib/plan-detail/use-plan-detail";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CreatePersonalPlanInput = {
  planId: string;
  competitorId: string;
};

async function findPlanStart(planId: string) {
  const supabase = getSupabaseBrowserClient();

  const { data: phaseRows, error: phaseError } = await supabase
    .from("training_plan_phases")
    .select("phase_id,order_index")
    .eq("training_plan_id", planId)
    .order("order_index", { ascending: true })
    .limit(1);

  if (phaseError) throw phaseError;

  const firstPhase = (phaseRows?.[0] as { phase_id: string } | undefined) ?? null;
  if (!firstPhase) {
    return {
      current_phase_id: null as string | null,
      current_topic_id: null as string | null,
    };
  }

  const { data: topicRows, error: topicError } = await supabase
    .from("topics")
    .select("id,order_index")
    .eq("phase_id", firstPhase.phase_id)
    .order("order_index", { ascending: true })
    .limit(1);

  if (topicError) throw topicError;

  return {
    current_phase_id: firstPhase.phase_id,
    current_topic_id: ((topicRows?.[0] as { id: string } | undefined)?.id ?? null) as
      | string
      | null,
  };
}

export function useCreatePersonalPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, competitorId }: CreatePersonalPlanInput) => {
      const supabase = getSupabaseBrowserClient();

      const { error: archiveError } = await supabase
        .from("competitor_progress")
        .update({ participation_status: "archived" })
        .eq("competitor_id", competitorId)
        .eq("participation_status", "active");

      if (archiveError) throw archiveError;

      const start = await findPlanStart(planId);

      const { error: progressError } = await supabase
        .from("competitor_progress")
        .upsert(
          {
            competitor_id: competitorId,
            training_plan_id: planId,
            current_phase_id: start.current_phase_id,
            current_topic_id: start.current_topic_id,
            status: "not_started",
            participation_status: "active",
          },
          { onConflict: "competitor_id,training_plan_id" }
        );

      if (progressError) throw progressError;

      const { error: competitorError } = await supabase
        .from("competitors")
        .update({ active_plan_id: planId })
        .eq("id", competitorId);

      if (competitorError) throw competitorError;
    },
    onSuccess: (_data, variables) => {
      toast.success("Personal plan linked to competitor.");
      queryClient.invalidateQueries({ queryKey: competitorQueryKey(variables.competitorId) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(false) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(true) });
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      queryClient.invalidateQueries({ queryKey: planDetailQueryKey(variables.planId) });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to initialize personal plan.";
      toast.error(message);
    },
  });
}
