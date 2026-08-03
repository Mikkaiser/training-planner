"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { collectStorageKeys, deleteObjects } from "@/lib/exercise-storage";
import { isSameMembership } from "@/lib/reorder";
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

/**
 * Rewrites every phase's order_index from the given sequence.
 *
 * The whole list must be supplied, not a subset: order_index is only meaningful
 * relative to its siblings, so accepting a partial list would leave the omitted
 * phases holding positions that no longer mean anything. The count check also
 * rejects a caller that slips in an id belonging to another plan — that row
 * would not match the guarded update, so the counts would disagree.
 */
export async function reorderPhases(input: { planId: string; orderedIds: string[] }) {
  const userId = await requireUserId();
  if (input.orderedIds.length === 0) return;

  const client = await pool.connect();

  try {
    await client.query("begin");

    const current = await client.query<{ id: string }>(
      `select ph.id
         from phases ph
         join training_plans tp on tp.id = ph.plan_id
        where ph.plan_id = $1 and tp.instructor_id = $2`,
      [input.planId, userId],
    );

    // Comparing the id sets rather than counts also rejects a duplicated id and
    // one borrowed from another plan, both of which would otherwise reach the
    // update and silently reorder only part of the list.
    if (!isSameMembership(current.rows.map((row) => row.id), input.orderedIds)) {
      await client.query("rollback");
      throw new Error("That ordering does not match the plan's phases. Reload and try again.");
    }

    const updated = await client.query(
      `update phases ph
          set order_index = v.idx
         from unnest($2::uuid[]) with ordinality as v(id, idx),
              training_plans tp
        where ph.id = v.id
          and ph.plan_id = $1
          and tp.id = ph.plan_id
          and tp.instructor_id = $3`,
      [input.planId, input.orderedIds, userId],
    );

    if (updated.rowCount !== input.orderedIds.length) {
      await client.query("rollback");
      throw new Error("Phase not found, or you do not have access to it.");
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("[reorderPhases] failed", error);
    throw error instanceof Error ? error : new Error("Failed to reorder phases. Please try again.");
  } finally {
    client.release();
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
