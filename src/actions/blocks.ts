"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { collectStorageKeys, deleteObjects } from "@/lib/exercise-storage";
import { planDetailRoute } from "@/lib/routes";
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
  /** Omitted by the UI — the design never shows hours, and passing a default
   *  here would quietly overwrite whatever the row already holds. */
  hours?: number;
};

type UpdateGateInput = {
  planId: string;
  gateId: string;
  status: GateStatus;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) {
    throw new Error("You need to sign in before managing blocks.");
  }

  return id;
}

export async function createBlock(input: CreateBlockInput) {
  const userId = await requireUserId();

  // Block and its gate are written together: previously two separate calls
  // that could leave a block without a gate if the second one failed.
  const client = await pool.connect();

  try {
    await client.query("begin");

    const blockResult = await client.query<{ id: string }>(
      `insert into blocks (phase_id, title, description, verb_level, competence_type, hours, order_index)
       select $1, $2, $3, $4::verb_level, $5::competence_type, $6, $7
       where exists (
         select 1
           from phases ph
           join training_plans tp on tp.id = ph.plan_id
          where ph.id = $1 and tp.id = $8 and tp.instructor_id = $9
       )
       returning id`,
      [
        input.phaseId,
        input.title,
        input.description,
        input.verbLevel,
        input.competenceType,
        input.hours,
        input.orderIndex,
        input.planId,
        userId,
      ],
    );

    const block = blockResult.rows[0];

    if (!block) {
      await client.query("rollback");
      throw new Error("Phase not found, or you do not have access to it.");
    }

    await client.query(
      `insert into gates (plan_id, after_block_id, status, hours_threshold)
       values ($1, $2, 'pending', $3)`,
      [input.planId, block.id, input.hours],
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("[createBlock] failed", error);
    throw error instanceof Error ? error : new Error("Failed to create block. Please try again.");
  } finally {
    client.release();
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function updateBlock(input: UpdateBlockInput) {
  const userId = await requireUserId();

  const row = await queryOne<{ id: string }>(
    `update blocks as b
        set title = $2,
            description = $3,
            verb_level = $4::verb_level,
            competence_type = $5::competence_type,
            hours = coalesce($6, b.hours)
       from phases ph
       join training_plans tp on tp.id = ph.plan_id
      where b.id = $1
        and ph.id = b.phase_id
        and tp.instructor_id = $7
     returning b.id`,
    [
      input.blockId,
      input.title,
      input.description,
      input.verbLevel,
      input.competenceType,
      input.hours ?? null,
      userId,
    ],
  );

  if (!row) {
    throw new Error("Block not found, or you do not have access to it.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function deleteBlock(planId: string, blockId: string) {
  const userId = await requireUserId();

  // Collected before the delete: `on delete cascade` removes the exercise rows
  // but knows nothing about the bucket, so without this every deleted block
  // silently leaks its files.
  const storageKeys = await collectStorageKeys("block", blockId, userId);

  const row = await queryOne<{ id: string }>(
    `delete from blocks as b
      using phases ph, training_plans tp
      where b.id = $1
        and ph.id = b.phase_id
        and tp.id = ph.plan_id
        and tp.instructor_id = $2
     returning b.id`,
    [blockId, userId],
  );

  if (!row) {
    throw new Error("Block not found, or you do not have access to it.");
  }

  await deleteObjects(storageKeys);
  revalidatePath(planDetailRoute(planId));
}

export async function updateGateStatus(input: UpdateGateInput) {
  const userId = await requireUserId();

  // The status update and its history row go together: gates.status only holds
  // the current value, and the list view's stat strip reads gate_events for
  // "passed first try" and the 30-day window.
  const client = await pool.connect();

  try {
    await client.query("begin");

    const result = await client.query<{ id: string; plan_id: string }>(
      `update gates as g
          set status = $2::gate_status
         from training_plans tp
        where g.id = $1
          and tp.id = g.plan_id
          and tp.instructor_id = $3
       returning g.id, g.plan_id`,
      [input.gateId, input.status, userId],
    );

    const gate = result.rows[0];

    if (!gate) {
      await client.query("rollback");
      throw new Error("Gate not found, or you do not have access to it.");
    }

    // 'pending' means the instructor cleared a previous verdict rather than
    // reaching one, so it is not an outcome worth recording.
    if (input.status !== "pending") {
      await client.query(
        `insert into gate_events (gate_id, plan_id, status, changed_by)
         values ($1, $2, $3::gate_status, $4)`,
        [gate.id, gate.plan_id, input.status, userId],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("[updateGateStatus] failed", error);
    throw error instanceof Error ? error : new Error("Failed to update the gate. Please try again.");
  } finally {
    client.release();
  }

  revalidatePath(planDetailRoute(input.planId));
}
