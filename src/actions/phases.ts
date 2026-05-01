"use server";

import { revalidatePath } from "next/cache";
import { planDetailRoute } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type CreatePhaseInput = {
  planId: string;
  title: string;
  orderIndex: number;
};

type UpdatePhaseInput = {
  phaseId: string;
  planId: string;
  title: string;
};

export async function createPhase(input: CreatePhaseInput) {
  const supabase = createClient();
  const { error } = await supabase.from("phases").insert({
    plan_id: input.planId,
    title: input.title,
    order_index: input.orderIndex,
  });

  if (error) {
    console.error("[createPhase] insert phases failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to create phase. Please try again.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function updatePhase(input: UpdatePhaseInput) {
  const supabase = createClient();
  const { error } = await supabase.from("phases").update({ title: input.title }).eq("id", input.phaseId);

  if (error) {
    console.error("[updatePhase] update phases failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to update phase. Please try again.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function deletePhase(planId: string, phaseId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("phases").delete().eq("id", phaseId);

  if (error) {
    console.error("[deletePhase] delete phases failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to delete phase. Please try again.");
  }

  revalidatePath(planDetailRoute(planId));
}
