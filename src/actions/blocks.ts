"use server";

import { revalidatePath } from "next/cache";
import { requireTeamContext } from "@/lib/team-data";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { collectStorageKeys, deleteObjects } from "@/lib/exercise-storage";
import { isSameMembership } from "@/lib/reorder";
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

export async function createBlock(input: CreateBlockInput) {
  const { userId, teamId } = await requireTeamContext();

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
          where ph.id = $1 and tp.id = $8 and tp.team_id = $9
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
        teamId,
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
  const { userId, teamId } = await requireTeamContext();

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
        and tp.team_id = $7
     returning b.id`,
    [
      input.blockId,
      input.title,
      input.description,
      input.verbLevel,
      input.competenceType,
      input.hours ?? null,
      teamId,
    ],
  );

  if (!row) {
    throw new Error("Block not found, or you do not have access to it.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function deleteBlock(planId: string, blockId: string) {
  const { userId, teamId } = await requireTeamContext();

  // Collected before the delete: `on delete cascade` removes the exercise rows
  // but knows nothing about the bucket, so without this every deleted block
  // silently leaks its files.
  const storageKeys = await collectStorageKeys("block", blockId, teamId);

  const row = await queryOne<{ id: string }>(
    `delete from blocks as b
      using phases ph, training_plans tp
      where b.id = $1
        and ph.id = b.phase_id
        and tp.id = ph.plan_id
        and tp.team_id = $2
     returning b.id`,
    [blockId, teamId],
  );

  if (!row) {
    throw new Error("Block not found, or you do not have access to it.");
  }

  await deleteObjects(storageKeys);
  revalidatePath(planDetailRoute(planId));
}

/**
 * Rewrites every block's order_index within one phase.
 *
 * Scoped to a phase on purpose: moving a block between phases is a different
 * operation with different consequences (it changes which phase must be
 * complete before the next begins), so a drag cannot do it by accident.
 *
 * Reordering shifts gate numbering, because a gate is identified by its block's
 * position in the plan. That is intended — "Gate 7" means the checkpoint after
 * the seventh block, not a fixed label.
 */
export async function reorderBlocks(input: {
  planId: string;
  /**
   * Complete block ordering for every phase the drag touched. Moving a block
   * between phases submits both the source and the destination, so the two
   * halves of the move commit together — the alternative, one call per phase,
   * can leave a block in neither list or in both.
   */
  phases: { phaseId: string; orderedIds: string[] }[];
}) {
  const { userId, teamId } = await requireTeamContext();
  if (input.phases.length === 0) return;

  const phaseIds = input.phases.map((phase) => phase.phaseId);
  const flat = input.phases.flatMap((phase) =>
    phase.orderedIds.map((blockId, index) => ({ blockId, phaseId: phase.phaseId, idx: index + 1 })),
  );
  if (flat.length === 0) return;

  const client = await pool.connect();

  try {
    await client.query("begin");

    // Every submitted phase must belong to this plan and this instructor.
    const ownedPhases = await client.query<{ id: string }>(
      `select ph.id
         from phases ph
         join training_plans tp on tp.id = ph.plan_id
        where ph.id = any($1::uuid[]) and tp.id = $2 and tp.team_id = $3`,
      [phaseIds, input.planId, teamId],
    );

    if (ownedPhases.rowCount !== phaseIds.length) {
      await client.query("rollback");
      throw new Error("Phase not found, or you do not have access to it.");
    }

    // The submitted blocks must be exactly the blocks currently living in those
    // phases. A subset would leave the omitted ones holding positions that no
    // longer relate to their siblings; an extra would drag in a block from a
    // phase the user never touched.
    const current = await client.query<{ id: string }>(
      "select id from blocks where phase_id = any($1::uuid[])",
      [phaseIds],
    );

    if (!isSameMembership(current.rows.map((row) => row.id), flat.map((entry) => entry.blockId))) {
      await client.query("rollback");
      throw new Error("That ordering does not match the blocks in those phases. Reload and try again.");
    }

    // phase_id and order_index move together, which is what makes this one
    // statement cover both a reorder and a cross-phase move.
    const updated = await client.query(
      `update blocks b
          set phase_id = v.phase_id,
              order_index = v.idx
         from unnest($1::uuid[], $2::uuid[], $3::int[]) as v(block_id, phase_id, idx)
        where b.id = v.block_id
          and b.phase_id = any($4::uuid[])`,
      [
        flat.map((entry) => entry.blockId),
        flat.map((entry) => entry.phaseId),
        flat.map((entry) => entry.idx),
        phaseIds,
      ],
    );

    if (updated.rowCount !== flat.length) {
      await client.query("rollback");
      throw new Error("Block not found, or you do not have access to it.");
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("[reorderBlocks] failed", error);
    throw error instanceof Error ? error : new Error("Failed to move blocks. Please try again.");
  } finally {
    client.release();
  }

  revalidatePath(planDetailRoute(input.planId));
}

/**
 * Re-adds a checkpoint to a block that has none, so removing a gate is not a
 * one-way door. Does nothing if the block already has one — the schema has no
 * unique constraint on gates.after_block_id, so nothing else would stop a
 * second gate appearing on the same block and doubling its checkpoints.
 */
export async function createGate(input: { planId: string; blockId: string }) {
  const { userId, teamId } = await requireTeamContext();

  const row = await queryOne<{ id: string }>(
    `insert into gates (plan_id, after_block_id, status, hours_threshold)
     select $1, $2, 'pending', b.hours
       from blocks b
       join phases ph on ph.id = b.phase_id
       join training_plans tp on tp.id = ph.plan_id
      where b.id = $2
        and tp.id = $1
        and tp.team_id = $3
        and not exists (select 1 from gates g where g.after_block_id = b.id)
     returning id`,
    [input.planId, input.blockId, teamId],
  );

  if (!row) {
    throw new Error("Block not found, already has a gate, or you do not have access to it.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

/**
 * Removes a checkpoint. Its recorded outcomes go with it via cascade, which is
 * intended: the history describes a gate that no longer exists, and keeping it
 * would leave the stat strip counting verdicts for a checkpoint nobody can see.
 */
export async function deleteGate(input: { planId: string; gateId: string }) {
  const { userId, teamId } = await requireTeamContext();

  const row = await queryOne<{ id: string }>(
    `delete from gates as g
      using training_plans tp
      where g.id = $1
        and tp.id = g.plan_id
        and tp.team_id = $2
     returning g.id`,
    [input.gateId, teamId],
  );

  if (!row) {
    throw new Error("Gate not found, or you do not have access to it.");
  }

  revalidatePath(planDetailRoute(input.planId));
}

export async function updateGateStatus(input: UpdateGateInput) {
  const { userId, teamId } = await requireTeamContext();

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
          and tp.team_id = $3
       returning g.id, g.plan_id`,
      [input.gateId, input.status, teamId],
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
