"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createPhaseSchema, type CreatePhaseValues } from "@/components/training-plans/phase-picker-schemas";
import type { UploadResult } from "@/lib/storage/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GateType, Phase, Subcompetence } from "@/lib/training-plans/types";

export interface CreatePhaseFromFormArgs {
  values: CreatePhaseValues;
  subcompetences: Subcompetence[];
  createdBy: string;
  planPhaseCount: number;
  exerciseUploads: Array<UploadResult | null>;
}

async function createPhaseFromForm({
  values,
  subcompetences,
  createdBy,
  planPhaseCount,
  exerciseUploads,
}: CreatePhaseFromFormArgs): Promise<Phase> {
  const supabase = getSupabaseBrowserClient();
  const parsed = createPhaseSchema.parse(values);
  const scIds = parsed.subcompetence_ids.slice();

  const { data: phaseRow, error: phaseErr } = await supabase
    .from("phases")
    .insert({
      name: parsed.name.trim(),
      description: null,
      order_index: planPhaseCount + 1,
      created_by: createdBy,
    })
    .select("id,name,description,order_index")
    .single();
  if (phaseErr) throw phaseErr;
  // Insert is followed by `.single()` with a select list including `id`.
  const phaseId = String(phaseRow.id);

  if (scIds.length) {
    const { error } = await supabase.from("phase_subcompetences").insert(
      scIds.map((id) => ({
        phase_id: phaseId,
        subcompetence_id: id,
      }))
    );
    if (error) throw error;
  }

  if (parsed.blocks.length) {
    for (let idx = 0; idx < parsed.blocks.length; idx += 1) {
      const b = parsed.blocks[idx];
      const isLast = idx === parsed.blocks.length - 1;
      const gateType = isLast ? "phase_gate" : "block_gate";
      const gateName = `${b.name.trim() || `Block ${idx + 1}`} Gate`;

      const gateInsert = await supabase
        .from("gates")
        .insert({
          phase_id: phaseId,
          name: gateName,
          description: null,
          gate_type: gateType,
          pass_threshold: b.gate_pass_threshold,
        })
        .select("id")
        .single();
      if (gateInsert.error) throw gateInsert.error;

      const gateId = gateInsert.data?.id;
      if (!gateId) {
        throw new Error("Gate insert succeeded but no gate id returned.");
      }
      const topicInsert = await supabase
        .from("topics")
        .insert({
          phase_id: phaseId,
          subcompetence_id: b.subcompetence_id,
          gate_id: gateId,
          name: b.name.trim(),
          description: null,
          order_index: idx + 1,
        })
        .select("id")
        .single();
      if (topicInsert.error) throw topicInsert.error;

      const blockExerciseUpload = exerciseUploads[idx] ?? null;
      if (blockExerciseUpload) {
        const { error: exerciseError } = await supabase.from("exercises").insert({
          topic_id: topicInsert.data.id,
          subcompetence_id: b.subcompetence_id,
          exercise_category_id: null,
          title: blockExerciseUpload.fileName,
          description: null,
          difficulty: null,
          file_url: blockExerciseUpload.path,
          file_name: blockExerciseUpload.fileName,
          file_type: blockExerciseUpload.fileType,
          created_by: createdBy,
        });
        if (exerciseError) throw exerciseError;
      }
    }
  }

  const scMap = new Map(subcompetences.map((s) => [s.id, s]));
  const selectedSc = scIds.map((id) => scMap.get(id)).filter(Boolean) as Subcompetence[];
  const blocksWithGates = parsed.blocks.map((b, idx) => ({
    name: b.name,
    order_index: idx + 1,
    subcompetence_id: b.subcompetence_id,
    gate: {
      name: `${b.name} Gate`,
      // The gate_type is a literal union compatible with `GateType`.
      gate_type: (idx === parsed.blocks.length - 1 ? "phase_gate" : "block_gate") as GateType,
      pass_threshold: b.gate_pass_threshold,
    },
  }));

  return {
    id: phaseId,
    // Supabase typing for `.single()` is broader than needed; we constrain it here.
    name: phaseRow.name as string,
    // Supabase typing for `.single()` is broader than needed; we constrain it here.
    description: (phaseRow.description as string | null) ?? null,
    // Supabase typing for `.single()` is broader than needed; we constrain it here.
    order_index: (phaseRow.order_index as number | null) ?? null,
    subcompetences: selectedSc,
    blocks: blocksWithGates,
  };
}

export function useCreatePhaseFromForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPhaseFromForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      queryClient.invalidateQueries({ queryKey: ["subcompetences"] });
    },
    onError: (err) => {
      console.error("[Phase create] failed:", err);
      toast.error("Could not create phase. Please try again.");
    },
  });
}

