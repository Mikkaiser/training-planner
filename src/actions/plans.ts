"use server";

import { revalidatePath } from "next/cache";
import { APP_ROUTES, planDetailRoute } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type CreatePlanInput = {
  title: string;
  studentName: string;
};

export async function createPlan(input: CreatePlanInput) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[createPlan] auth.getUser failed", {
      code: userError.code,
      message: userError.message,
      name: userError.name,
      status: userError.status,
    });
    throw new Error("Could not verify your session. Please sign in again.");
  }

  if (!user) {
    throw new Error("You need to sign in before creating a plan.");
  }

  const { data, error } = await supabase
    .from("training_plans")
    .insert({
      title: input.title,
      student_name: input.studentName,
      instructor_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createPlan] insert training_plans failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to create plan. Please try again.");
  }

  revalidatePath(APP_ROUTES.home);
  revalidatePath(planDetailRoute(data.id));

  return data;
}

export async function deletePlan(planId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("training_plans").delete().eq("id", planId);

  if (error) {
    console.error("[deletePlan] delete training_plans failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to delete plan. Please try again.");
  }

  revalidatePath(APP_ROUTES.home);
}
