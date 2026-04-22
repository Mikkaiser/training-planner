"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { planDetailQueryKey } from "@/lib/plan-detail/use-plan-detail";
import type { PlanDetail } from "@/lib/plan-detail/types";
import type { CompetitorAvatarSwatch } from "@/components/plan-detail/competitor-avatar-swatch-picker";

type UseAddCompetitorArgs = {
  planId: string;
  detail: PlanDetail;
  onClose: () => void;
  onReset: () => void;
};

type AddCompetitorInput = {
  fullName: string;
  avatarColor: CompetitorAvatarSwatch;
};

export function useAddCompetitor({ planId, detail, onClose, onReset }: UseAddCompetitorArgs) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fullName, avatarColor }: AddCompetitorInput): Promise<string> => {
      const name = fullName.trim();
      if (!name) throw new Error("Name is required");

      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      const insertRes = await supabase
        .from("competitors")
        .insert({
          full_name: name,
          avatar_color: avatarColor,
          created_by: uid,
        })
        .select("id")
        .single();

      if (insertRes.error) throw insertRes.error;

      const firstPhase = detail.phases[0];
      const firstBlockId = detail.orderedBlockIds[0] ?? null;

      const { error: progressErr } = await supabase.from("competitor_progress").insert({
        competitor_id: insertRes.data.id,
        training_plan_id: planId,
        current_phase_id: firstPhase?.id ?? null,
        current_topic_id: firstBlockId,
        status: "not_started",
      });

      if (progressErr) throw progressErr;

      return name;
    },
    onSuccess: (name) => {
      toast.success(`${name} added`);
      queryClient.invalidateQueries({ queryKey: planDetailQueryKey(planId) });
      onReset();
      onClose();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to add competitor";
      toast.error(msg);
    },
  });
}

