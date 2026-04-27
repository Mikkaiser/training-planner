"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { competitorQueryKey } from "@/lib/hooks/use-competitor";
import { competitorsQueryKey } from "@/lib/hooks/use-competitors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type UpdateCompetitorInput = {
  fullName: string;
  email?: string;
  avatarColor: string;
};

export function useUpdateCompetitor(competitorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCompetitorInput) => {
      const supabase = getSupabaseBrowserClient();

      const name = input.fullName.trim();
      if (!name) throw new Error("Competitor name is required.");

      const email = input.email?.trim() ? input.email.trim() : null;

      const { error } = await supabase
        .from("competitors")
        .update({
          full_name: name,
          email,
          avatar_color: input.avatarColor,
        })
        .eq("id", competitorId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Competitor updated.");
      queryClient.invalidateQueries({ queryKey: competitorQueryKey(competitorId) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(false) });
      queryClient.invalidateQueries({ queryKey: competitorsQueryKey(true) });
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to update competitor.";
      toast.error(message);
    },
  });
}
