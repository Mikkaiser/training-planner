"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Exercise, ExerciseCategory } from "@/lib/plan-detail/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RawBlockCategoryRow = {
  exercise_categories: (ExerciseCategory & { exercises?: Exercise[] }) | null;
};

export function blockCategoriesQueryKey(topicId: string) {
  return ["block-categories", topicId] as const;
}

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  return new Error(fallback);
}

async function fetchBlockCategories(topicId: string): Promise<ExerciseCategory[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("topic_exercise_categories")
    .select(
      "exercise_categories(id,name,description,order_index, exercises(id,topic_id,subcompetence_id,exercise_category_id,title,description,difficulty,file_url,file_name,file_type,preview_url,preview_file_name,created_at))"
    )
    .eq("topic_id", topicId);

  if (error) {
    console.error("[useBlockCategories] query failed:", error);
    throw toError(error, "Failed to load block categories.");
  }

  const categories: ExerciseCategory[] = [];
  for (const row of (data ?? []) as RawBlockCategoryRow[]) {
    if (!row.exercise_categories) continue;
    const category = row.exercise_categories;
    categories.push({
      id: category.id,
      name: category.name,
      description: category.description,
      order_index: category.order_index,
      exercises: (category.exercises ?? [])
        .slice()
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    });
  }

  return categories.sort((a, b) => a.order_index - b.order_index);
}

export function useBlockCategories(topicId: string | null) {
  return useQuery({
    queryKey: topicId ? blockCategoriesQueryKey(topicId) : ["block-categories", "empty"],
    queryFn: () => {
      if (!topicId) return Promise.resolve([] as ExerciseCategory[]);
      return fetchBlockCategories(topicId);
    },
    enabled: Boolean(topicId),
    staleTime: 30_000,
  });
}

export function useAssignCategoryToBlock(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string): Promise<void> => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("topic_exercise_categories").upsert(
        {
          topic_id: topicId,
          exercise_category_id: categoryId,
        },
        { onConflict: "topic_id,exercise_category_id", ignoreDuplicates: true }
      );

      if (error) {
        console.error("[useAssignCategoryToBlock] upsert failed:", error);
        throw toError(error, "Could not assign category to block.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockCategoriesQueryKey(topicId) });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not assign category to block."
      );
    },
  });
}

export function useRemoveCategoryFromBlock(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string): Promise<void> => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("topic_exercise_categories")
        .delete()
        .eq("topic_id", topicId)
        .eq("exercise_category_id", categoryId);

      if (error) {
        console.error("[useRemoveCategoryFromBlock] delete failed:", error);
        throw toError(error, "Could not remove category from block.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockCategoriesQueryKey(topicId) });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not remove category from block."
      );
    },
  });
}
