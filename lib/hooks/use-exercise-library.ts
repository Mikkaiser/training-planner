"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Exercise, ExerciseCategory } from "@/lib/plan-detail/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const exerciseLibraryQueryKey = ["exercise-library"] as const;

type CreateExerciseCategoryInput = {
  name: string;
  description?: string;
  order_index?: number;
};

type CreateExerciseInput = {
  title: string;
  description?: string;
  difficulty: "foundation" | "intermediate" | "advanced";
  exercise_category_id: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  preview_url?: string | null;
  preview_file_name?: string | null;
};

type UpdateExerciseInput = {
  exerciseId: string;
  title: string;
  description?: string;
  difficulty: "foundation" | "intermediate" | "advanced";
  exercise_category_id: string;
};

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  return new Error(fallback);
}

async function fetchExerciseLibrary(): Promise<ExerciseCategory[]> {
  const supabase = getSupabaseBrowserClient();
  const [categoriesRes, exercisesRes] = await Promise.all([
    supabase
      .from("exercise_categories")
      .select("id,name,description,order_index")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("exercises")
      .select(
        "id,topic_id,subcompetence_id,exercise_category_id,title,description,difficulty,file_url,file_name,file_type,preview_url,preview_file_name,created_at"
      )
      .not("exercise_category_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  if (categoriesRes.error) {
    console.error("[useExerciseLibrary] categories query failed:", categoriesRes.error);
    throw toError(categoriesRes.error, "Failed to load exercise categories.");
  }
  if (exercisesRes.error) {
    console.error("[useExerciseLibrary] exercises query failed:", exercisesRes.error);
    throw toError(exercisesRes.error, "Failed to load exercises.");
  }

  const byCategory = new Map<string, Exercise[]>();
  for (const exercise of (exercisesRes.data ?? []) as Exercise[]) {
    const categoryId = exercise.exercise_category_id;
    if (!categoryId) continue;
    const list = byCategory.get(categoryId) ?? [];
    list.push(exercise);
    byCategory.set(categoryId, list);
  }

  return ((categoriesRes.data ?? []) as ExerciseCategory[]).map((category) => ({
    ...category,
    exercises: byCategory.get(category.id) ?? [],
  }));
}

export function useExerciseLibrary() {
  return useQuery({
    queryKey: exerciseLibraryQueryKey,
    queryFn: fetchExerciseLibrary,
    staleTime: 30_000,
  });
}

export function useCreateExerciseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExerciseCategoryInput): Promise<ExerciseCategory> => {
      const trimmedName = input.name.trim();
      if (!trimmedName) throw new Error("Category name is required.");

      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("exercise_categories")
        .insert({
          name: trimmedName,
          description: input.description?.trim() || null,
          order_index: input.order_index ?? 0,
          created_by: user?.id ?? null,
        })
        .select("id,name,description,order_index")
        .single();

      if (error) {
        console.error("[useCreateExerciseCategory] insert failed:", error);
        throw toError(error, "Could not create category.");
      }

      return data as ExerciseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseLibraryQueryKey });
      toast.success("Category created");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not create category.");
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExerciseInput): Promise<Exercise> => {
      if (!input.title.trim()) throw new Error("Exercise title is required.");
      if (!input.exercise_category_id) throw new Error("Category is required.");

      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          topic_id: null,
          subcompetence_id: null,
          exercise_category_id: input.exercise_category_id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          difficulty: input.difficulty,
          file_url: input.file_url ?? null,
          file_name: input.file_name ?? null,
          file_type: input.file_type ?? null,
          preview_url: input.preview_url ?? null,
          preview_file_name: input.preview_file_name ?? null,
          created_by: user?.id ?? null,
        })
        .select(
          "id,topic_id,subcompetence_id,exercise_category_id,title,description,difficulty,file_url,file_name,file_type,preview_url,preview_file_name,created_at"
        )
        .single();

      if (error) {
        console.error("[useCreateExercise] insert failed:", error);
        throw toError(error, "Could not create exercise.");
      }

      return data as Exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseLibraryQueryKey });
      toast.success("Exercise created");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not create exercise.");
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exerciseId: string): Promise<void> => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
      if (error) {
        console.error("[useDeleteExercise] delete failed:", error);
        throw toError(error, "Could not delete exercise.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseLibraryQueryKey });
      toast.success("Exercise deleted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not delete exercise.");
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateExerciseInput): Promise<void> => {
      if (!input.title.trim()) throw new Error("Exercise title is required.");
      if (!input.exercise_category_id) throw new Error("Category is required.");

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("exercises")
        .update({
          title: input.title.trim(),
          description: input.description?.trim() || null,
          difficulty: input.difficulty,
          exercise_category_id: input.exercise_category_id,
        })
        .eq("id", input.exerciseId);

      if (error) {
        console.error("[useUpdateExercise] update failed:", error);
        throw toError(error, "Could not update exercise.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseLibraryQueryKey });
      toast.success("Exercise updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update exercise.");
    },
  });
}
