"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { competitorQueryKey } from "@/lib/hooks/use-competitor";
import { competitorsQueryKey } from "@/lib/hooks/use-competitors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export class CompetitorHasHistoryError extends Error {
  constructor() {
    super(
      "This competitor has gate attempt history. Archive them instead to preserve records."
    );
    this.name = "CompetitorHasHistoryError";
  }
}

export function useDeleteCompetitor(competitorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseBrowserClient();

      const { count, error: countError } = await supabase
        .from("gate_attempts")
        .select("id", { count: "exact", head: true })
        .eq("competitor_id", competitorId);

      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        throw new CompetitorHasHistoryError();
      }

      const { error } = await supabase.from("competitors").delete().eq("id", competitorId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Competitor deleted.");
      queryClient.removeQueries({ queryKey: competitorQueryKey(competitorId) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(false) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(true) });
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    onError: (error) => {
      if (error instanceof CompetitorHasHistoryError) return;
      const message =
        error instanceof Error ? error.message : "Failed to delete competitor.";
      toast.error(message);
    },
  });
}
