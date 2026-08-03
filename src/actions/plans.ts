"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { queryOne } from "@/lib/db";
import { APP_ROUTES, planDetailRoute } from "@/lib/routes";

type CreatePlanInput = {
  title: string;
  studentName: string;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) {
    throw new Error("You need to sign in before managing plans.");
  }

  return id;
}

export async function createPlan(input: CreatePlanInput) {
  const userId = await requireUserId();

  const row = await queryOne<{ id: string }>(
    `insert into training_plans (title, student_name, instructor_id)
     values ($1, $2, $3)
     returning id`,
    [input.title, input.studentName, userId],
  );

  if (!row) {
    throw new Error("Failed to create plan. Please try again.");
  }

  revalidatePath(APP_ROUTES.home);
  revalidatePath(planDetailRoute(row.id));

  return row;
}

export async function deletePlan(planId: string) {
  const userId = await requireUserId();

  const row = await queryOne<{ id: string }>(
    `delete from training_plans where id = $1 and instructor_id = $2 returning id`,
    [planId, userId],
  );

  if (!row) {
    throw new Error("Plan not found, or you do not have access to it.");
  }

  revalidatePath(APP_ROUTES.home);
}
