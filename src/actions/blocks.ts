"use server";

import { revalidatePath } from "next/cache";
import { planDetailRoute } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { CompetenceType, GateStatus, VerbLevel } from "@/lib/types";

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

export async function createBlock(input: CreateBlockInput) {
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
    throw new Error("Failed to create block. Please try again.");
  }

  const { error: gateError } = await supabase.from("gates").insert({
    plan_id: input.planId,
    after_block_id: blockData.id,
    status: "pending",
    hours_threshold: input.hours,
  });

  if (gateError) {
    throw new Error("Block created but gate creation failed. Please retry.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function updateBlock(input: UpdateBlockInput) {
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
    throw new Error("Failed to update block. Please try again.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function deleteBlock(planId: string, blockId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("blocks").delete().eq("id", blockId);

  if (error) {
    throw new Error("Failed to delete block. Please try again.");
  }

  revalidatePath(planDetailRoute(planId));
}

export async function updateGateStatus(input: UpdateGateInput) {
  const supabase = createClient();
  const { error } = await supabase.from("gates").update({ status: input.status }).eq("id", input.gateId);

  if (error) {
    throw new Error("Failed to update gate status. Please try again.");
  }

  revalidatePath(planDetailRoute(input.planId));
}
