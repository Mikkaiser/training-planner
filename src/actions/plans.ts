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
  } = await supabase.auth.getUser();

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
    throw new Error("Failed to delete plan. Please try again.");
  }

  revalidatePath(APP_ROUTES.home);
}
