"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlanListItem } from "@/lib/hooks/use-training-plans";

async function deletePlan(planId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  // training_plan_phases cascades from training_plans.id, so the junction
  // rows clean themselves up. We still need `.select()` here so Supabase
  // returns the affected rows — without it, RLS-blocked deletes look like
  // success (no error + 0 rows), which is exactly the "delete didn't stick"
  // bug. Admin role is required by the `del_admin` policy on training_plans.
  const { data, error } = await supabase.from("training_plans").delete().eq("id", planId).select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Plan not deleted. Only the instructor who created the plan or an admin can delete it."
    );
  }
}

export function useDeleteTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlan,
    onSuccess: async (_void, planId) => {
      queryClient.setQueryData<PlanListItem[] | undefined>(["training-plans"], (cur) =>
        cur ? cur.filter((p) => p.id !== planId) : cur
      );
      toast.success("Plan deleted");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to delete plan.";
      toast.error(msg);
    },
  });
}

