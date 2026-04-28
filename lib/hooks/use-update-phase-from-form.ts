"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createPhaseSchema, type CreatePhaseValues } from "@/components/training-plans/phase-picker-schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Phase, Subcompetence } from "@/lib/training-plans/types";

type ExistingBlock = {
  topic_id: string | null;
  gate_id: string | null;
};

export interface UpdatePhaseFromFormArgs {
  phaseId: string;
  values: CreatePhaseValues;
  subcompetences: Subcompetence[];
  existingBlocks: ExistingBlock[];
}

async function updatePhaseFromForm({
  phaseId,
  values,
  subcompetences,
  existingBlocks,
}: UpdatePhaseFromFormArgs): Promise<Phase> {
  const supabase = getSupabaseBrowserClient();
  const parsed = createPhaseSchema.parse(values);

  const { data: phaseRow, error: phaseErr } = await supabase
    .from("phases")
    .update({
      name: parsed.name.trim(),
    })
    .eq("id", phaseId)
    .select("id,name,description,duration_weeks,order_index")
    .single();
  if (phaseErr) throw phaseErr;

  const { error: deleteScErr } = await supabase
    .from("phase_subcompetences")
    .delete()
    .eq("phase_id", phaseId);
  if (deleteScErr) throw deleteScErr;

  if (parsed.subcompetence_ids.length) {
    const { error: insertScErr } = await supabase.from("phase_subcompetences").insert(
      parsed.subcompetence_ids.map((id) => ({
        phase_id: phaseId,
        subcompetence_id: id,
      }))
    );
    if (insertScErr) throw insertScErr;
  }

  const desiredCount = parsed.blocks.length;
  const desiredGateTypes = parsed.blocks.map((_, idx) =>
    idx === desiredCount - 1 ? "phase_gate" : "block_gate"
  );

  // Delete blocks that were removed.
  const blocksToDelete = existingBlocks.slice(desiredCount);
  const topicIdsToDelete = blocksToDelete
    .map((b) => b.topic_id)
    .filter((id): id is string => Boolean(id));
  const gateIdsToDelete = blocksToDelete
    .map((b) => b.gate_id)
    .filter((id): id is string => Boolean(id));

  if (topicIdsToDelete.length) {
    const { error } = await supabase.from("topics").delete().in("id", topicIdsToDelete);
    if (error) throw error;
  }
  if (gateIdsToDelete.length) {
    const { error } = await supabase.from("gates").delete().in("id", gateIdsToDelete);
    if (error) throw error;
  }

  // Upsert/update desired blocks in order.
  const blocksWithGates: Phase["blocks"] = [];
  for (let idx = 0; idx < parsed.blocks.length; idx += 1) {
    const b = parsed.blocks[idx];
    const gateType = desiredGateTypes[idx];
    const gateName = `${b.name.trim() || `Block ${idx + 1}`} Gate`;
    const existing = existingBlocks[idx] ?? { topic_id: null, gate_id: null };

    let gateId = existing.gate_id;
    if (gateId) {
      const { error } = await supabase
        .from("gates")
        .update({
          name: gateName,
          gate_type: gateType,
          pass_threshold: b.gate_pass_threshold,
        })
        .eq("id", gateId);
      if (error) throw error;
    } else {
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
      gateId = gateInsert.data?.id ?? null;
    }

    if (!gateId) throw new Error("Gate operation succeeded but gate id is missing.");

    if (existing.topic_id) {
      const { error } = await supabase
        .from("topics")
        .update({
          name: b.name.trim(),
          subcompetence_id: b.subcompetence_id,
          order_index: idx + 1,
          gate_id: gateId,
        })
        .eq("id", existing.topic_id);
      if (error) throw error;
    } else {
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
      existing.topic_id = topicInsert.data?.id ?? null;
    }

    blocksWithGates.push({
      id: existing.topic_id ?? undefined,
      name: b.name,
      description: null,
      order_index: idx + 1,
      subcompetence_id: b.subcompetence_id,
      gate: {
        id: gateId,
        name: gateName,
        description: null,
        gate_type: gateType,
        pass_threshold: b.gate_pass_threshold,
      },
    });
  }

  const scMap = new Map(subcompetences.map((s) => [s.id, s]));
  const selectedSc = parsed.subcompetence_ids
    .map((id) => scMap.get(id))
    .filter(Boolean) as Subcompetence[];

  return {
    id: String(phaseRow.id),
    name: phaseRow.name as string,
    description: (phaseRow.description as string | null) ?? null,
    duration_weeks: (phaseRow.duration_weeks as number | null) ?? null,
    order_index: (phaseRow.order_index as number | null) ?? null,
    subcompetences: selectedSc,
    blocks: blocksWithGates,
  };
}

export function useUpdatePhaseFromForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePhaseFromForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      queryClient.invalidateQueries({ queryKey: ["subcompetences"] });
    },
    onError: (err) => {
      console.error("[Phase update] failed:", err);
      toast.error("Could not update phase. Please try again.");
    },
  });
}

