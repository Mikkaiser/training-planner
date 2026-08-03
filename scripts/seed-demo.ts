/**
 * Seeds the demo dataset from the Claude Design project so the implemented
 * screens can be compared against the artboards with like-for-like content.
 *
 *   pnpm seed:demo                      # attaches to SEED_EMAIL or the default
 *   pnpm seed:demo you@example.com
 *
 * Idempotent: every run removes this user's plans whose titles match the demo
 * set, then recreates them. It never touches plans you made by hand.
 *
 * The default email is deliberately NOT a real Google address. Auth.js refuses
 * to attach a Google identity to a pre-existing user row that has no linked
 * account (OAuthAccountNotLinked) — it is how it prevents account takeover by
 * email claim. Seeding your own Google address before you have signed in would
 * therefore lock you out of that account. To put the demo plans on your real
 * account, sign in with Google first, then run `pnpm seed:demo you@gmail.com`;
 * the user row already exists at that point, so this script just attaches to it.
 *
 * Progress percentages will NOT match the design mock's numbers. Those were
 * decorative constants in data.jsx; here they are derived from real gate rows.
 */
import { config as loadEnv } from "dotenv";
import { Pool, type PoolClient } from "pg";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

type SeedBlock = {
  title: string;
  competence: "Development" | "Testing" | "Analysis & Design" | "Transversal";
  verb: "Recognize" | "Reproduce" | "Apply" | "Adapt" | "Create";
  gate: "pending" | "passed" | "failed";
};

type SeedPhase = { title: string; blocks: SeedBlock[] };
type SeedPlan = { title: string; student: string; phases: SeedPhase[] };

// Eli's roadmap is copied verbatim from the design's ROADMAP constant, so the
// detail artboards can be compared block for block.
const PLANS: SeedPlan[] = [
  {
    title: "Road to Lyon 2027",
    student: "Eli Vasseur",
    phases: [
      {
        title: "Foundation",
        blocks: [
          { title: "Programming Fundamentals", competence: "Development", verb: "Create", gate: "passed" },
          { title: "Algorithmic Thinking", competence: "Development", verb: "Adapt", gate: "passed" },
          { title: "HTML/CSS Foundations", competence: "Development", verb: "Create", gate: "passed" },
          { title: "Working with Issues", competence: "Transversal", verb: "Apply", gate: "passed" },
        ],
      },
      {
        title: "Intermediate",
        blocks: [
          { title: "Relational Modeling", competence: "Analysis & Design", verb: "Apply", gate: "passed" },
          { title: "Test-Driven Development", competence: "Testing", verb: "Apply", gate: "passed" },
          { title: "API Design & REST", competence: "Development", verb: "Apply", gate: "pending" },
          { title: "Async Communication", competence: "Development", verb: "Reproduce", gate: "pending" },
        ],
      },
      { title: "Advanced", blocks: [] },
    ],
  },
  {
    title: "Pre-selection 2026",
    student: "Mira Tanaka",
    phases: [
      {
        title: "Foundation",
        blocks: [
          { title: "Version Control Workflows", competence: "Transversal", verb: "Adapt", gate: "passed" },
          { title: "Debugging Fundamentals", competence: "Development", verb: "Apply", gate: "passed" },
          { title: "Data Structures", competence: "Analysis & Design", verb: "Apply", gate: "pending" },
          { title: "Unit Testing Basics", competence: "Testing", verb: "Reproduce", gate: "pending" },
        ],
      },
      { title: "Intermediate", blocks: [] },
    ],
  },
  {
    title: "Shanghai Cycle",
    student: "Kade Oduya",
    phases: [
      {
        title: "Foundation",
        blocks: [
          { title: "Language Idioms", competence: "Development", verb: "Create", gate: "passed" },
          { title: "Source Control at Scale", competence: "Transversal", verb: "Adapt", gate: "passed" },
        ],
      },
      {
        title: "Intermediate",
        blocks: [
          { title: "Query Optimisation", competence: "Analysis & Design", verb: "Adapt", gate: "passed" },
          { title: "Integration Testing", competence: "Testing", verb: "Apply", gate: "passed" },
          { title: "Caching Strategies", competence: "Development", verb: "Adapt", gate: "passed" },
        ],
      },
      {
        title: "Advanced",
        blocks: [
          { title: "Distributed Transactions", competence: "Analysis & Design", verb: "Create", gate: "passed" },
          // The design's list artboard shows one competitor in remediation.
          { title: "System Resilience Patterns", competence: "Development", verb: "Create", gate: "failed" },
        ],
      },
    ],
  },
  {
    title: "National Squad — Cohort B",
    student: "Sofia Ríos",
    phases: [
      {
        title: "Foundation",
        blocks: [{ title: "Requirements Analysis", competence: "Analysis & Design", verb: "Apply", gate: "passed" }],
      },
      {
        title: "Intermediate",
        blocks: [
          { title: "Relational Modeling", competence: "Analysis & Design", verb: "Reproduce", gate: "pending" },
          { title: "API Contracts", competence: "Development", verb: "Reproduce", gate: "pending" },
          { title: "Regression Suites", competence: "Testing", verb: "Recognize", gate: "pending" },
        ],
      },
    ],
  },
  // The design's list shows a freshly created plan with no phases at all.
  { title: "New plan — not started", student: "Hana Berg", phases: [] },
];

async function resolveUserId(client: PoolClient, email: string): Promise<string> {
  const existing = await client.query<{ id: string }>("select id from users where email = $1", [email]);
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await client.query<{ id: string }>(
    "insert into users (email, name) values ($1, $2) returning id",
    [email, email.split("@")[0]],
  );
  return created.rows[0].id;
}

async function main(): Promise<void> {
  const email = process.argv[2] ?? process.env.SEED_EMAIL ?? "demo@training-planner.local";
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing required environment variable: DATABASE_URL");

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    await client.query("begin");

    const userId = await resolveUserId(client, email);

    // Cascades clear phases, blocks, gates, gate_events and exercises.
    const removed = await client.query(
      "delete from training_plans where instructor_id = $1 and title = any($2::text[])",
      [userId, PLANS.map((plan) => plan.title)],
    );

    for (const plan of PLANS) {
      const { rows } = await client.query<{ id: string }>(
        "insert into training_plans (instructor_id, title, student_name) values ($1, $2, $3) returning id",
        [userId, plan.title, plan.student],
      );
      const planId = rows[0].id;

      for (const [phaseIndex, phase] of plan.phases.entries()) {
        const phaseRow = await client.query<{ id: string }>(
          "insert into phases (plan_id, title, order_index) values ($1, $2, $3) returning id",
          [planId, phase.title, phaseIndex + 1],
        );
        const phaseId = phaseRow.rows[0].id;

        for (const [blockIndex, block] of phase.blocks.entries()) {
          const blockRow = await client.query<{ id: string }>(
            `insert into blocks (phase_id, title, description, verb_level, competence_type, hours, order_index)
             values ($1, $2, $3, $4::verb_level, $5::competence_type, $6, $7) returning id`,
            [
              phaseId,
              block.title,
              `Practice ${block.title.toLowerCase()} to a ${block.verb.toLowerCase()} standard.`,
              block.verb,
              block.competence,
              8,
              blockIndex + 1,
            ],
          );
          const blockId = blockRow.rows[0].id;

          const gateRow = await client.query<{ id: string }>(
            "insert into gates (plan_id, after_block_id, status, hours_threshold) values ($1, $2, $3::gate_status, $4) returning id",
            [planId, blockId, block.gate, 8],
          );

          // Decided gates need a history row, otherwise the list view's stat
          // strip reports zero for data that plainly exists on screen.
          if (block.gate !== "pending") {
            await client.query(
              "insert into gate_events (gate_id, plan_id, status, changed_by) values ($1, $2, $3::gate_status, $4)",
              [gateRow.rows[0].id, planId, block.gate, userId],
            );
          }
        }
      }
    }

    await client.query("commit");
    console.log(`[seed] user ${email} (${userId})`);
    console.log(`[seed] replaced ${removed.rowCount ?? 0} demo plan(s) with ${PLANS.length}.`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`[seed] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
