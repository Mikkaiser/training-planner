import "server-only";

import { randomUUID } from "node:crypto";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { pool } from "@/lib/db";
import { slugifyFileName } from "@/lib/exercise-files";
import { bucket, s3Internal } from "@/lib/s3";

/**
 * Storage helpers used by the delete actions.
 *
 * These live outside "use server" deliberately. Every export of a "use server"
 * module becomes an endpoint the browser can call with arbitrary arguments —
 * collectStorageKeys takes a userId, so exposing it would let anyone enumerate
 * another instructor's object keys by passing their id.
 */

/**
 * Best-effort object removal. The caller has already committed the database
 * change, so a storage hiccup must not surface as a failed user action; it
 * leaves an orphan that the key prefix makes easy to find later.
 */
export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  await Promise.all(
    keys.map(async (Key) => {
      try {
        await s3Internal().send(new DeleteObjectCommand({ Bucket: bucket(), Key }));
      } catch (error) {
        console.error("[deleteObjects] failed to remove object", { key: Key, error });
      }
    }),
  );
}

/**
 * Object keys under a plan, phase or block. Needed *before* the row is deleted:
 * `on delete cascade` removes exercise rows but knows nothing about S3, so
 * without this every deleted block silently leaks its files.
 */
export async function collectStorageKeys(
  scope: "plan" | "phase" | "block",
  id: string,
  userId: string,
): Promise<string[]> {
  const where = scope === "plan" ? "tp.id = $1" : scope === "phase" ? "ph.id = $1" : "b.id = $1";

  const { rows } = await pool.query<{ storage_key: string }>(
    `select e.storage_key
       from exercises e
       join blocks b on b.id = e.block_id
       join phases ph on ph.id = b.phase_id
       join training_plans tp on tp.id = ph.plan_id
      where ${where} and tp.instructor_id = $2`,
    [id, userId],
  );

  return rows.map((row) => row.storage_key);
}

/**
 * Duplicates a plan's exercise files for a clone.
 *
 * Uses server-side CopyObject, so the bytes never travel through the app, and
 * gives every copy its own key. Sharing a key between two rows would be cheaper
 * but would mean deleting one plan's exercise silently breaks the other's
 * download — and storage_key is unique precisely to make that impossible.
 *
 * A file that fails to copy is skipped with a log rather than failing the whole
 * clone: the plan structure is the valuable part, and a missing attachment is
 * recoverable by re-uploading.
 */
export async function copyExercisesForClone(
  blockMap: ReadonlyMap<string, string>,
  targetPlanId: string,
): Promise<void> {
  const sourceBlockIds = [...blockMap.keys()];
  if (sourceBlockIds.length === 0) return;

  const { rows } = await pool.query<{
    block_id: string;
    file_name: string;
    storage_key: string;
    content_type: string;
    size_bytes: number;
    uploaded_by: string | null;
  }>(
    `select block_id, file_name, storage_key, content_type, size_bytes, uploaded_by
       from exercises
      where block_id = any($1::uuid[]) and status = 'ready'`,
    [sourceBlockIds],
  );

  for (const row of rows) {
    const targetBlockId = blockMap.get(row.block_id);
    if (!targetBlockId) continue;

    const newId = randomUUID();
    const newKey = `plans/${targetPlanId}/blocks/${targetBlockId}/${newId}/${slugifyFileName(row.file_name)}`;

    try {
      await s3Internal().send(
        new CopyObjectCommand({
          Bucket: bucket(),
          // CopySource is bucket-qualified and must be URI-encoded, or a key
          // containing spaces or unicode fails with an opaque 404.
          CopySource: encodeURI(`${bucket()}/${row.storage_key}`),
          Key: newKey,
          ContentType: row.content_type,
          MetadataDirective: "REPLACE",
        }),
      );

      await pool.query(
        `insert into exercises (id, block_id, file_name, storage_key, content_type, size_bytes, status, uploaded_by, uploaded_at)
         values ($1, $2, $3, $4, $5, $6, 'ready', $7, now())`,
        [newId, targetBlockId, row.file_name, newKey, row.content_type, row.size_bytes, row.uploaded_by],
      );
    } catch (error) {
      console.error("[copyExercisesForClone] skipped a file", { key: row.storage_key, error });
    }
  }
}
