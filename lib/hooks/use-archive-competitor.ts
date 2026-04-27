"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { competitorQueryKey } from "@/lib/hooks/use-competitor";
import { competitorsQueryKey } from "@/lib/hooks/use-competitors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useArchiveCompetitor(competitorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("competitors")
        .update({ archived: true })
        .eq("id", competitorId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Competitor archived.");
      queryClient.invalidateQueries({ queryKey: competitorQueryKey(competitorId) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(false) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(true) });
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to archive competitor.";
      toast.error(message);
    },
  });
}
