"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { planDetailRoute } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { CompetenceType, GateStatus, VerbLevel } from "@/lib/types";

type DbClient = ReturnType<typeof createClient>;

type CreateBlockInput = {
  planId: string;
  phaseId: string;
  title: string;
  description: string;
  verbLevel: VerbLevel;
  competenceType: CompetenceType;
  hours: number;
  orderIndex: number;
};

type UpdateBlockInput = {
  planId: string;
  phaseId: string;
  blockId: string;
  title: string;
  description: string;
  verbLevel: VerbLevel;
  competenceType: CompetenceType;
  hours: number;
};

type UpdateGateInput = {
  planId: string;
  gateId: string;
  status: GateStatus;
};

/**
 * Recomputes every gate's `hours_threshold` in a phase as the running sum of
 * block hours (ordered by `order_index`) up to and including that block —
 * i.e. cumulative *within the phase*. Call after any block create/update/delete.
 */
async function recomputePhaseGateThresholds(supabase: DbClient, phaseId: string) {
  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("id, hours, order_index")
    .eq("phase_id", phaseId)
    .order("order_index");

  if (blocksError) {
    console.error("[recomputePhaseGateThresholds] select blocks failed", {
      code: blocksError.code,
      message: blocksError.message,
    });
    return;
  }

  if (!blocks || blocks.length === 0) return;

  const { data: gates, error: gatesError } = await supabase
    .from("gates")
    .select("id, after_block_id")
    .in(
      "after_block_id",
      blocks.map((block) => block.id as string),
    );

  if (gatesError) {
    console.error("[recomputePhaseGateThresholds] select gates failed", {
      code: gatesError.code,
      message: gatesError.message,
    });
    return;
  }

  const gateByBlock = new Map((gates ?? []).map((gate) => [gate.after_block_id as string, gate.id as string]));

  let running = 0;
  for (const block of blocks) {
    running += Number(block.hours) || 0;
    const gateId = gateByBlock.get(block.id as string);
    if (!gateId) continue;

    const { error: updateError } = await supabase
      .from("gates")
      .update({ hours_threshold: running })
      .eq("id", gateId);

    if (updateError) {
      console.error("[recomputePhaseGateThresholds] update gate failed", {
        code: updateError.code,
        message: updateError.message,
      });
    }
  }
}

export async function createBlock(input: CreateBlockInput) {
  await requireUser();
  const supabase = createClient();
  const { data: blockData, error: blockError } = await supabase
    .from("blocks")
    .insert({
      phase_id: input.phaseId,
      title: input.title,
      description: input.description,
      verb_level: input.verbLevel,
      competence_type: input.competenceType,
      hours: input.hours,
      order_index: input.orderIndex,
    })
    .select("id")
    .single();

  if (blockError) {
    console.error("[createBlock] insert blocks failed", {
      code: blockError.code,
      message: blockError.message,
      details: blockError.details,
      hint: blockError.hint,
    });
    throw new Error("Failed to create block. Please try again.");
  }

  const { error: gateError } = await supabase.from("gates").insert({
    plan_id: input.planId,
    after_block_id: blockData.id,
    status: "pending",
    hours_threshold: input.hours,
  });

  if (gateError) {
    console.error("[createBlock] insert gates failed", {
      code: gateError.code,
      message: gateError.message,
      details: gateError.details,
      hint: gateError.hint,
    });
    throw new Error("Block created but gate creation failed. Please retry.");
  }

  await recomputePhaseGateThresholds(supabase, input.phaseId);

  revalidatePath(planDetailRoute(input.planId));
}

export async function updateBlock(input: UpdateBlockInput) {
  await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("blocks")
    .update({
      title: input.title,
      description: input.description,
      verb_level: input.verbLevel,
      competence_type: input.competenceType,
      hours: input.hours,
    })
    .eq("id", input.blockId);

  if (error) {
    console.error("[updateBlock] update blocks failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to update block. Please try again.");
  }

  await recomputePhaseGateThresholds(supabase, input.phaseId);

  revalidatePath(planDetailRoute(input.planId));
}

export async function deleteBlock(planId: string, phaseId: string, blockId: string) {
  await requireUser();
  const supabase = createClient();
  const { error } = await supabase.from("blocks").delete().eq("id", blockId);

  if (error) {
    console.error("[deleteBlock] delete blocks failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to delete block. Please try again.");
  }

  await recomputePhaseGateThresholds(supabase, phaseId);

  revalidatePath(planDetailRoute(planId));
}

export async function updateGateStatus(input: UpdateGateInput) {
  await requireUser();
  const supabase = createClient();
  const { error } = await supabase.from("gates").update({ status: input.status }).eq("id", input.gateId);

  if (error) {
    console.error("[updateGateStatus] update gates failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to update gate status. Please try again.");
  }

  revalidatePath(planDetailRoute(input.planId));
}
