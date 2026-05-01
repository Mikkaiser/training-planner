import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

type DbError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function logStep(step: string): void {
  console.log(`\n[smoke] ${step}`);
}

function logError(step: string, error: DbError): never {
  throw new Error(
    `${step} failed: ${error.message ?? "Unknown Supabase error"} (code=${error.code ?? "n/a"}, details=${error.details ?? "n/a"}, hint=${error.hint ?? "n/a"})`,
  );
}

async function ensureNoDbError<T>(
  step: string,
  promise: PromiseLike<{ data: T; error: DbError | null }>,
): Promise<T> {
  const { data, error } = await promise;

  if (error) {
    logError(step, error);
  }

  return data;
}

async function run(): Promise<void> {
  const supabaseUrl = readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const timestamp = Date.now();
  const email = `smoke+${timestamp}@example.test`;
  const password = `Smoke-${timestamp}-Pass!`;
  let userId = "";

  try {
    logStep("Creating throwaway user");
    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Smoke Test User" },
    });

    if (createUserError) {
      throw new Error(`auth.admin.createUser failed: ${createUserError.message}`);
    }

    if (!createdUser.user) {
      throw new Error("auth.admin.createUser failed: user was not returned");
    }

    userId = createdUser.user.id;
    console.log(`[smoke] Created user ${userId}`);

    const userClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    logStep("Signing in throwaway user");
    const { data: signInResponse, error: signInError } = await userClient.auth.signInWithPassword({ email, password });

    if (signInError) {
      throw new Error(`auth.signInWithPassword failed: ${signInError.message}`);
    }

    if (!signInResponse.user) {
      throw new Error("auth.signInWithPassword failed: user was not returned");
    }

    const authenticatedUserId = signInResponse.user.id;
    console.log(`[smoke] Signed in as ${authenticatedUserId}`);

    logStep("Creating plan");
    const plan = await ensureNoDbError(
      "insert training_plans",
      userClient
        .from("training_plans")
        .insert({
          title: "Smoke Plan",
          student_name: "Smoke Student",
          instructor_id: authenticatedUserId,
        })
        .select("id")
        .single(),
    );

    const planId = (plan as { id: string }).id;
    console.log(`[smoke] Plan created: ${planId}`);

    logStep("Creating phase");
    const phase = await ensureNoDbError(
      "insert phases",
      userClient
        .from("phases")
        .insert({
          plan_id: planId,
          title: "Smoke Phase",
          order_index: 0,
        })
        .select("id")
        .single(),
    );

    const phaseId = (phase as { id: string }).id;
    console.log(`[smoke] Phase created: ${phaseId}`);

    logStep("Creating block");
    const block = await ensureNoDbError(
      "insert blocks",
      userClient
        .from("blocks")
        .insert({
          phase_id: phaseId,
          title: "Smoke Block",
          description: "Smoke description",
          verb_level: "Recognize",
          competence_type: "Development",
          hours: 2,
          order_index: 0,
        })
        .select("id")
        .single(),
    );

    const blockId = (block as { id: string }).id;
    console.log(`[smoke] Block created: ${blockId}`);

    logStep("Creating gate");
    const gate = await ensureNoDbError(
      "insert gates",
      userClient
        .from("gates")
        .insert({
          plan_id: planId,
          after_block_id: blockId,
          status: "pending",
          hours_threshold: 2,
        })
        .select("id")
        .single(),
    );

    const gateId = (gate as { id: string }).id;
    console.log(`[smoke] Gate created: ${gateId}`);

    logStep("Reading plan list");
    const planRows = await ensureNoDbError(
      "select training_plans list",
      userClient.from("training_plans").select("id").eq("instructor_id", authenticatedUserId),
    );

    if (!(planRows as Array<{ id: string }>).some((row) => row.id === planId)) {
      throw new Error("select training_plans list failed: created plan not found");
    }

    logStep("Reading plan detail");
    const planDetail = await ensureNoDbError(
      "select training_plans detail",
      userClient.from("training_plans").select("id").eq("id", planId).eq("instructor_id", authenticatedUserId).single(),
    );

    if ((planDetail as { id: string }).id !== planId) {
      throw new Error("select training_plans detail failed: wrong plan returned");
    }

    logStep("Updating gate status");
    const updatedGate = await ensureNoDbError(
      "update gates",
      userClient.from("gates").update({ status: "passed" }).eq("id", gateId).select("status").single(),
    );

    if ((updatedGate as { status: string }).status !== "passed") {
      throw new Error("update gates failed: status did not update to passed");
    }

    logStep("Deleting plan and verifying cascade");
    await ensureNoDbError("delete training_plans", userClient.from("training_plans").delete().eq("id", planId).select("id"));

    const remainingPlans = await ensureNoDbError(
      "post-delete training_plans check",
      userClient.from("training_plans").select("id").eq("id", planId),
    );
    const remainingPhases = await ensureNoDbError("post-delete phases check", userClient.from("phases").select("id").eq("id", phaseId));
    const remainingBlocks = await ensureNoDbError("post-delete blocks check", userClient.from("blocks").select("id").eq("id", blockId));
    const remainingGates = await ensureNoDbError("post-delete gates check", userClient.from("gates").select("id").eq("id", gateId));

    if ((remainingPlans as Array<{ id: string }>).length > 0) {
      throw new Error("Cascade check failed: training_plans row still exists");
    }
    if ((remainingPhases as Array<{ id: string }>).length > 0) {
      throw new Error("Cascade check failed: phases row still exists");
    }
    if ((remainingBlocks as Array<{ id: string }>).length > 0) {
      throw new Error("Cascade check failed: blocks row still exists");
    }
    if ((remainingGates as Array<{ id: string }>).length > 0) {
      throw new Error("Cascade check failed: gates row still exists");
    }

    console.log("\n[smoke] All smoke checks passed.");
  } finally {
    if (userId) {
      logStep("Cleaning up throwaway user");
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) {
        console.error("[smoke] Cleanup warning: failed to delete throwaway user", {
          code: error.code,
          message: error.message,
          name: error.name,
          status: error.status,
        });
      }
    }
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown smoke test error";
  console.error(`\n[smoke] FAILED: ${message}`);
  process.exit(1);
});
