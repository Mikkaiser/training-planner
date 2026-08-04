/**
 * Reports objects in the bucket that no exercise row points at.
 *
 *   pnpm verify:orphans
 *
 * `on delete cascade` removes exercise rows but cannot touch S3, so the delete
 * actions collect storage keys before deleting. This is the check that they
 * actually do — a growing number here means a cleanup path was missed.
 */
import { config as loadEnv } from "dotenv";
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Pool } from "pg";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { bucket, s3Internal } from "../../src/lib/s3";

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

  try {
    // Every table that owns an object must be listed here. A missing one makes
    // its live files look orphaned, and --prune would then delete them.
    const { rows } = await pool.query<{ storage_key: string }>(
      `select storage_key from exercises where storage_key is not null
       union all
       select storage_key from assessment_schemes where storage_key is not null`,
    );
    const known = new Set(rows.map((row) => row.storage_key));

    const keys: string[] = [];
    let token: string | undefined;

    do {
      const page = await s3Internal().send(
        new ListObjectsV2Command({ Bucket: bucket(), ContinuationToken: token }),
      );
      for (const object of page.Contents ?? []) if (object.Key) keys.push(object.Key);
      token = page.NextContinuationToken;
    } while (token);

    const orphans = keys.filter((key) => !known.has(key));

    console.log(`[orphans] ${keys.length} object(s) in bucket, ${known.size} referenced by rows`);

    if (orphans.length === 0) {
      console.log("[orphans] none — every stored object has a row.");
      return;
    }

    // --prune is opt-in: reporting is the default so a genuine cleanup bug is
    // noticed rather than quietly swept up on every run.
    if (process.argv.includes("--prune")) {
      for (const key of orphans) {
        await s3Internal().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
        console.log(`[orphans] pruned ${key}`);
      }
      return;
    }

    console.log(`[orphans] ${orphans.length} unreferenced (re-run with --prune to remove):`);
    for (const key of orphans.slice(0, 20)) console.log(`  - ${key}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`[orphans] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
