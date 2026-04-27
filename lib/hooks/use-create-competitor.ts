"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { planDetailQueryKey } from "@/lib/plan-detail/use-plan-detail";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { competitorsQueryKey } from "@/lib/hooks/use-competitors";

export type CreateCompetitorInput = {
  fullName: string;
  email?: string;
  avatarColor: string;
  sharedPlanId?: string | null;
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
  if (!firstPhase) return { current_phase_id: null as string | null, current_topic_id: null as string | null };

  const { data: topicRows, error: topicError } = await supabase
    .from("topics")
    .select("id,order_index")
    .eq("phase_id", firstPhase.phase_id)
    .order("order_index", { ascending: true })
    .limit(1);

  if (topicError) throw topicError;

  const firstTopic = (topicRows?.[0] as { id: string } | undefined) ?? null;
  return {
    current_phase_id: firstPhase.phase_id,
    current_topic_id: firstTopic?.id ?? null,
  };
}

export function useCreateCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCompetitorInput) => {
      const supabase = getSupabaseBrowserClient();

      const name = input.fullName.trim();
      if (!name) throw new Error("Competitor name is required.");

      const email = input.email?.trim() ? input.email.trim() : null;

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const { data: competitorRow, error: insertError } = await supabase
        .from("competitors")
        .insert({
          full_name: name,
          email,
          avatar_color: input.avatarColor,
          created_by: authData.user?.id ?? null,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const competitorId = (competitorRow as { id: string }).id;

      if (input.sharedPlanId) {
        const start = await findPlanStart(input.sharedPlanId);

        const { error: progressError } = await supabase
          .from("competitor_progress")
          .insert({
            competitor_id: competitorId,
            training_plan_id: input.sharedPlanId,
            current_phase_id: start.current_phase_id,
            current_topic_id: start.current_topic_id,
            status: "not_started",
            participation_status: "active",
          });

        if (progressError) throw progressError;

        const { error: updateError } = await supabase
          .from("competitors")
          .update({ active_plan_id: input.sharedPlanId })
          .eq("id", competitorId);

        if (updateError) throw updateError;
      }

      return competitorId;
    },
    onSuccess: (_id, variables) => {
      toast.success("Competitor created.");
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(false) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(true) });
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      if (variables.sharedPlanId) {
        queryClient.invalidateQueries({ queryKey: planDetailQueryKey(variables.sharedPlanId) });
      }
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create competitor.";
      toast.error(message);
    },
  });
}
