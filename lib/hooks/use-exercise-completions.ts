"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ExerciseCompletion } from "@/lib/plan-detail/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function exerciseCompletionsQueryKey(planId: string, competitorId: string) {
  return ["exercise-completions", planId, competitorId] as const;
}

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  return new Error(fallback);
}

async function fetchExerciseCompletions(
  planId: string,
  competitorId: string
): Promise<Map<string, ExerciseCompletion>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("exercise_completions")
    .select("id,exercise_id,competitor_id,plan_id,completed,completed_at,marked_by")
    .eq("plan_id", planId)
    .eq("competitor_id", competitorId);

  if (error) {
    console.error("[useExerciseCompletions] query failed:", error);
    throw toError(error, "Failed to load exercise completions.");
  }

  const completionMap = new Map<string, ExerciseCompletion>();
  for (const row of (data ?? []) as ExerciseCompletion[]) {
    completionMap.set(row.exercise_id, row);
  }
  return completionMap;
}

export function useExerciseCompletions(planId: string | null, competitorId: string | null) {
  return useQuery({
    queryKey:
      planId && competitorId
        ? exerciseCompletionsQueryKey(planId, competitorId)
        : ["exercise-completions", "empty"],
    queryFn: () => {
      if (!planId || !competitorId) return Promise.resolve(new Map<string, ExerciseCompletion>());
      return fetchExerciseCompletions(planId, competitorId);
    },
    enabled: Boolean(planId && competitorId),
    staleTime: 15_000,
  });
}

export function useMarkExerciseComplete(
  exerciseId: string,
  competitorId: string,
  planId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to mark completion.");

      const nowIso = new Date().toISOString();
      const { error } = await supabase.from("exercise_completions").upsert(
        {
          exercise_id: exerciseId,
          competitor_id: competitorId,
          plan_id: planId,
          completed: true,
          completed_at: nowIso,
          marked_by: user.id,
        },
        { onConflict: "exercise_id,competitor_id,plan_id" }
      );

      if (error) {
        console.error("[useMarkExerciseComplete] upsert failed:", error);
        throw toError(error, "Could not mark exercise as complete.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: exerciseCompletionsQueryKey(planId, competitorId),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not mark exercise as complete."
      );
    },
  });
}

export function useUnmarkExerciseComplete(
  exerciseId: string,
  competitorId: string,
  planId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("exercise_completions")
        .update({ completed: false, completed_at: null })
        .eq("exercise_id", exerciseId)
        .eq("competitor_id", competitorId)
        .eq("plan_id", planId);

      if (error) {
        console.error("[useUnmarkExerciseComplete] update failed:", error);
        throw toError(error, "Could not unmark exercise completion.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: exerciseCompletionsQueryKey(planId, competitorId),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not unmark exercise completion."
      );
    },
  });
}
