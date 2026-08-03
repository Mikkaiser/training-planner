"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { queryOne } from "@/lib/db";
import { collectStorageKeys, deleteObjects } from "@/lib/exercise-storage";
import { planDetailRoute } from "@/lib/routes";

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

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) {
    throw new Error("You need to sign in before managing phases.");
  }

  return id;
}

export async function createPhase(input: CreatePhaseInput) {
  const userId = await requireUserId();

  // The select guard replaces the old RLS insert policy: the row is only
  // written if the target plan belongs to the signed-in instructor.
  const row = await queryOne<{ id: string }>(
    `insert into phases (plan_id, title, order_index)
     select $1, $2, $3
     where exists (
       select 1 from training_plans where id = $1 and instructor_id = $4
     )
     returning id`,
    [input.planId, input.title, input.orderIndex, userId],
  );

  if (!row) {
    throw new Error("Failed to create phase. Please try again.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function updatePhase(input: UpdatePhaseInput) {
  const userId = await requireUserId();

  const row = await queryOne<{ id: string }>(
    `update phases as ph
        set title = $2
       from training_plans as tp
      where ph.id = $1
        and tp.id = ph.plan_id
        and tp.instructor_id = $3
     returning ph.id`,
    [input.phaseId, input.title, userId],
  );

  if (!row) {
    throw new Error("Phase not found, or you do not have access to it.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function deletePhase(planId: string, phaseId: string) {
  const userId = await requireUserId();

  // Before the cascade removes the blocks and their exercise rows.
  const storageKeys = await collectStorageKeys("phase", phaseId, userId);

  const row = await queryOne<{ id: string }>(
    `delete from phases as ph
      using training_plans as tp
      where ph.id = $1
        and tp.id = ph.plan_id
        and tp.instructor_id = $2
     returning ph.id`,
    [phaseId, userId],
  );

  if (!row) {
    throw new Error("Phase not found, or you do not have access to it.");
  }

  await deleteObjects(storageKeys);
  revalidatePath(planDetailRoute(planId));
}
