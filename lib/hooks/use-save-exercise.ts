"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { planDetailQueryKey } from "@/lib/plan-detail/use-plan-detail";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteFile } from "@/lib/storage/storage";
import type { UploadResult } from "@/lib/storage/storage";
import type { BlockItem } from "@/lib/plan-detail/types";

type SaveExerciseArgs = {
  block: BlockItem;
  main: UploadResult;
  preview: UploadResult | null;
  title: string;
  description: string;
  difficulty: "foundation" | "intermediate" | "advanced";
};

type UseSaveExerciseProps = {
  planId: string;
  onSuccess: () => void;
};

export function useSaveExercise({ planId, onSuccess }: UseSaveExerciseProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      block,
      main,
      preview,
      title,
      description,
      difficulty,
    }: SaveExerciseArgs): Promise<void> => {
      if (!title.trim()) throw new Error("Title is required.");

      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      const { error: insertErr } = await supabase.from("exercises").insert({
        topic_id: block.id,
        subcompetence_id: block.subcompetence_id,
        exercise_category_id: null,
        title: title.trim(),
        description: description.trim() || null,
        difficulty,
        file_url: main.path,
        file_name: main.fileName,
        file_type: main.fileType,
        preview_url: preview?.path ?? null,
        preview_file_name: preview?.fileName ?? null,
        created_by: uid,
      });

      if (insertErr) {
        // Best-effort cleanup of the just-uploaded objects so the bucket
        // doesn't accumulate orphans when the metadata insert fails.
        await Promise.allSettled([
          deleteFile("exercises", main.path),
          preview ? deleteFile("exercises", preview.path) : Promise.resolve(),
        ]);
        console.error("[Exercise insert]", insertErr.message);
        throw new Error("Could not save exercise. Please try again.");
      }
    },
    onSuccess: () => {
      toast.success("Exercise uploaded");
      queryClient.invalidateQueries({ queryKey: planDetailQueryKey(planId) });
      onSuccess();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Could not save exercise.";
      toast.error(msg);
    },
  });
}

