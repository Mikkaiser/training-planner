import { config as loadEnv } from "dotenv";
import { Pool } from "pg";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function logStep(step: string): void {
  console.log(`\n[smoke] ${step}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function run(): Promise<void> {
  const pool = new Pool({ connectionString: readRequiredEnv("DATABASE_URL") });
  const stamp = Date.now();
  const emailA = `smoke+${stamp}a@example.test`;
  const emailB = `smoke+${stamp}b@example.test`;
  let userA = "";
  let userB = "";

  try {
    logStep("Creating throwaway users");
    userA = (await pool.query(`insert into users (email, name) values ($1, $2) returning id`, [emailA, "Smoke A"])).rows[0].id;
    userB = (await pool.query(`insert into users (email, name) values ($1, $2) returning id`, [emailB, "Smoke B"])).rows[0].id;
    console.log(`[smoke] users ${userA} / ${userB}`);

    logStep("Creating plan, phase, block, gate");
    const planId = (
      await pool.query(`insert into training_plans (title, student_name, instructor_id) values ($1, $2, $3) returning id`, [
        "Smoke Plan",
        "Smoke Student",
        userA,
      ])
    ).rows[0].id;

    const phaseId = (
      await pool.query(`insert into phases (plan_id, title, order_index) values ($1, $2, 0) returning id`, [planId, "Smoke Phase"])
    ).rows[0].id;

    const blockId = (
      await pool.query(
        `insert into blocks (phase_id, title, description, verb_level, competence_type, hours, order_index)
         values ($1, $2, $3, 'Recognize', 'Development', 2, 0) returning id`,
        [phaseId, "Smoke Block", "Smoke description"],
      )
    ).rows[0].id;

    const gateId = (
      await pool.query(
        `insert into gates (plan_id, after_block_id, status, hours_threshold) values ($1, $2, 'pending', 2) returning id`,
        [planId, blockId],
      )
    ).rows[0].id;

    console.log(`[smoke] plan=${planId} phase=${phaseId} block=${blockId} gate=${gateId}`);

    logStep("Reading back as owner");
    const owned = await pool.query(`select id from training_plans where instructor_id = $1 and id = $2`, [userA, planId]);
    assert(owned.rowCount === 1, "Owner could not read their own plan");

    logStep("Checking ownership isolation (replaces RLS)");
    const foreign = await pool.query(`select id from training_plans where instructor_id = $1 and id = $2`, [userB, planId]);
    assert(foreign.rowCount === 0, "Isolation failed: other user can read the plan");

    const foreignDelete = await pool.query(`delete from training_plans where id = $1 and instructor_id = $2 returning id`, [planId, userB]);
    assert(foreignDelete.rowCount === 0, "Isolation failed: other user could delete the plan");

    logStep("Checking numeric and timestamp casts");
    const casted = await pool.query(
      `select hours::float8 as hours, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
         from blocks where id = $1`,
      [blockId],
    );
    assert(typeof casted.rows[0].hours === "number", "hours did not come back as a number");
    assert(!Number.isNaN(Date.parse(casted.rows[0].created_at)), "created_at is not a parseable ISO string");

    logStep("Updating gate status");
    const updated = await pool.query(`update gates set status = 'passed'::gate_status where id = $1 returning status`, [gateId]);
    assert(updated.rows[0].status === "passed", "Gate status did not update");

    logStep("Deleting plan and verifying cascade");
    await pool.query(`delete from training_plans where id = $1 and instructor_id = $2`, [planId, userA]);

    for (const [table, id] of [
      ["training_plans", planId],
      ["phases", phaseId],
      ["blocks", blockId],
      ["gates", gateId],
    ] as const) {
      const left = await pool.query(`select 1 from ${table} where id = $1`, [id]);
      assert(left.rowCount === 0, `Cascade check failed: ${table} row still exists`);
    }

    console.log("\n[smoke] All smoke checks passed.");
  } finally {
    logStep("Cleaning up throwaway users");
    for (const id of [userA, userB]) {
      if (id) await pool.query(`delete from users where id = $1`, [id]).catch(() => undefined);
    }
    await pool.end();
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown smoke test error";
  console.error(`\n[smoke] FAILED: ${message}`);
  process.exit(1);
});
