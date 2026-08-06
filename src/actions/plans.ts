"use server";

import { revalidatePath } from "next/cache";
import { requireTeamContext } from "@/lib/team-data";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { collectStorageKeys, copyExercisesForClone, deleteObjects } from "@/lib/exercise-storage";
import { APP_ROUTES, planDetailRoute } from "@/lib/routes";

type CreatePlanInput = {
  title: string;
  studentName: string;
};

export async function createPlan(input: CreatePlanInput) {
  const { userId, teamId } = await requireTeamContext();

  const row = await queryOne<{ id: string }>(
    `insert into training_plans (title, student_name, created_by, team_id)
     values ($1, $2, $3, $4)
     returning id`,
    [input.title, input.studentName, userId, teamId],
  );

  if (!row) {
    throw new Error("Failed to create plan. Please try again.");
  }

  revalidatePath(APP_ROUTES.home);
  revalidatePath(planDetailRoute(row.id));

  return row;
}

type UpdatePlanInput = {
  planId: string;
  title: string;
  studentName: string;
};

/** Rename a plan or correct the competitor's name after it was created. */
export async function updatePlan(input: UpdatePlanInput) {
  const { userId, teamId } = await requireTeamContext();

  const title = input.title.trim();
  const studentName = input.studentName.trim();

  if (!title || !studentName) {
    throw new Error("A plan needs both a competitor name and a title.");
  }

  const row = await queryOne<{ id: string }>(
    `update training_plans
        set title = $2, student_name = $3
      where id = $1 and team_id = $4
     returning id`,
    [input.planId, title, studentName, teamId],
  );

  if (!row) {
    throw new Error("Plan not found, or you do not have access to it.");
  }

  revalidatePath(APP_ROUTES.home);
  revalidatePath(planDetailRoute(input.planId));
}

type ClonePlanInput = {
  sourcePlanId: string;
  studentName: string;
  title: string;
  copyBlocks: boolean;
  copyVerbLevels: boolean;
  copyExercises: boolean;
};

/**
 * Creates a plan from an existing one as a starting point.
 *
 * Gate results are never copied — a new competitor has not passed anything, and
 * carrying verdicts across would misreport their progress from day one. The
 * design states this outright ("Never copied — always starts clean") and the
 * gate rows below are always inserted as pending.
 */
export async function clonePlan(input: ClonePlanInput) {
  const { userId, teamId } = await requireTeamContext();
  const client = await pool.connect();

  // sourceBlockId -> newBlockId, needed for the exercise copy after commit.
  const blockMap = new Map<string, string>();
  let newPlanId = "";

  try {
    await client.query("begin");

    const created = await client.query<{ id: string }>(
      `insert into training_plans (title, student_name, created_by, team_id)
       select $1, $2, $5, $3
        where exists (select 1 from training_plans where id = $4 and team_id = $3)
       returning id`,
      [input.title, input.studentName, teamId, input.sourcePlanId, userId],
    );

    if (!created.rows[0]) {
      await client.query("rollback");
      throw new Error("Reference plan not found, or you do not have access to it.");
    }

    newPlanId = created.rows[0].id;

    if (input.copyBlocks) {
      const phases = await client.query<{ id: string; title: string; order_index: number }>(
        "select id, title, order_index from phases where plan_id = $1 order by order_index, created_at, id",
        [input.sourcePlanId],
      );

      for (const phase of phases.rows) {
        const newPhase = await client.query<{ id: string }>(
          "insert into phases (plan_id, title, order_index) values ($1, $2, $3) returning id",
          [newPlanId, phase.title, phase.order_index],
        );

        const blocks = await client.query<{
          id: string;
          title: string;
          description: string;
          verb_level: string;
          competence_type: string;
          hours: string;
          order_index: number;
        }>(
          `select id, title, description, verb_level, competence_type, hours, order_index
             from blocks where phase_id = $1 order by order_index, created_at, id`,
          [phase.id],
        );

        for (const block of blocks.rows) {
          const newBlock = await client.query<{ id: string }>(
            `insert into blocks (phase_id, title, description, verb_level, competence_type, hours, order_index)
             values ($1, $2, $3, $4::verb_level, $5::competence_type, $6, $7) returning id`,
            [
              newPhase.rows[0].id,
              block.title,
              block.description,
              // Dropping the tuned level resets the block to the entry rung
              // rather than leaving a level the instructor did not choose.
              input.copyVerbLevels ? block.verb_level : "Recognize",
              block.competence_type,
              block.hours,
              block.order_index,
            ],
          );

          blockMap.set(block.id, newBlock.rows[0].id);

          await client.query(
            "insert into gates (plan_id, after_block_id, status, hours_threshold) values ($1, $2, 'pending', $3)",
            [newPlanId, newBlock.rows[0].id, block.hours],
          );
        }
      }
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("[clonePlan] failed", error);
    throw error instanceof Error ? error : new Error("Failed to copy the plan. Please try again.");
  } finally {
    client.release();
  }

  // Outside the transaction: S3 is not transactional, and a slow copy must not
  // hold a database transaction open. Each file gets its own object rather than
  // sharing a key, so deleting one plan's exercise can never break the other's.
  if (input.copyBlocks && input.copyExercises && blockMap.size > 0) {
    await copyExercisesForClone(blockMap, newPlanId);
  }

  revalidatePath(APP_ROUTES.home);
  revalidatePath(planDetailRoute(newPlanId));

  return { id: newPlanId };
}

export async function deletePlan(planId: string) {
  const { userId, teamId } = await requireTeamContext();

  // Before the cascade takes the phases, blocks and exercise rows with it.
  const storageKeys = await collectStorageKeys("plan", planId, teamId);

  const row = await queryOne<{ id: string }>(
    `delete from training_plans where id = $1 and team_id = $2 returning id`,
    [planId, teamId],
  );

  if (!row) {
    throw new Error("Plan not found, or you do not have access to it.");
  }

  await deleteObjects(storageKeys);
  revalidatePath(APP_ROUTES.home);
}
