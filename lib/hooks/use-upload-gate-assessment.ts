"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteFile, type UploadResult } from "@/lib/storage/storage";

export interface UploadGateAssessmentArgs {
  gateId: string;
  uploaded: UploadResult;
  title: string;
  description: string;
}

export function useUploadGateAssessment(queryKey: readonly ["dashboard-gates"]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gateId, uploaded, title, description }: UploadGateAssessmentArgs) => {
      if (!title.trim()) throw new Error("Title is required.");

      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      const { error: insertErr } = await supabase.from("gate_assessments").insert({
        gate_id: gateId,
        title: title.trim(),
        description: description.trim() || null,
        file_url: uploaded.path,
        file_name: uploaded.fileName,
        file_type: uploaded.fileType,
        created_by: uid,
      });

      if (insertErr) {
        await deleteFile("gate-assessments", uploaded.path).catch(() => {});
        console.error("[Gate assessment insert]", insertErr.message);
        throw new Error("Could not save assessment. Please try again.");
      }
    },
    onSuccess: () => {
      toast.success("Assessment uploaded");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Could not save assessment.";
      toast.error(msg);
    },
  });
}

