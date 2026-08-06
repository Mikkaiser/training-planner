"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { auth } from "@/auth";
import { query, queryOne } from "@/lib/db";
import { copyExerciseInto, deleteObjects, type CopyableExercise } from "@/lib/exercise-storage";
import {
  MAX_FILE_BYTES,
  MAX_FILES_PER_BLOCK,
  MAX_LABEL_LENGTH,
  MAX_URL_LENGTH,
  labelForUrl,
  normaliseExerciseUrl,
  slugifyFileName,
  validateUploadCandidate,
} from "@/lib/exercise-files";
import { dedupeReusable, type ReusableExercise } from "@/lib/exercise-library";
import { getReusableExercises } from "@/lib/plan-data";
import { planDetailRoute } from "@/lib/routes";
import { bucket, s3Internal, s3Public } from "@/lib/s3";

/** Long enough for a 25 mb upload on a poor link, short enough to be a weak capability. */
const UPLOAD_URL_TTL_SECONDS = 600;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("You need to sign in before managing exercises.");
  return id;
}

const presignSchema = z.object({
  planId: z.string().uuid(),
  blockId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive().max(MAX_FILE_BYTES),
  contentType: z.string().max(255).default(""),
});

export type PresignResult = {
  exerciseId: string;
  uploadUrl: string;
  contentType: string;
};

/**
 * Reserves a row and returns a presigned PUT for it.
 *
 * The ownership check and the insert are one statement on purpose: a presigned
 * URL is a bearer credential, so the authorization decision and the act of
 * issuing it must not be separable. If the caller does not own the block the
 * insert matches nothing, and no URL is ever signed.
 */
export async function presignExerciseUpload(input: z.input<typeof presignSchema>): Promise<PresignResult> {
  const userId = await requireUserId();
  const parsed = presignSchema.parse(input);

  const validation = validateUploadCandidate(parsed.fileName, parsed.sizeBytes, parsed.contentType);
  if (!validation.ok) throw new Error(validation.reason);

  const exerciseId = randomUUID();
  const storageKey = `plans/${parsed.planId}/blocks/${parsed.blockId}/${exerciseId}/${slugifyFileName(parsed.fileName)}`;

  const row = await queryOne<{ id: string }>(
    `insert into exercises (id, block_id, file_name, storage_key, content_type, size_bytes, status, uploaded_by)
     select $1, $2, $3, $4, $5, $6, 'pending', $7
      where exists (
        select 1
          from blocks b
          join phases ph on ph.id = b.phase_id
          join training_plans tp on tp.id = ph.plan_id
         where b.id = $2
           and tp.id = $8
           and tp.instructor_id = $7
      )
        and (select count(*) from exercises where block_id = $2) < $9
     returning id`,
    [
      exerciseId,
      parsed.blockId,
      parsed.fileName,
      storageKey,
      validation.contentType,
      parsed.sizeBytes,
      userId,
      parsed.planId,
      MAX_FILES_PER_BLOCK,
    ],
  );

  if (!row) {
    throw new Error("Block not found, or you do not have access to it.");
  }

  const uploadUrl = await getSignedUrl(
    s3Public(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: storageKey,
      ContentType: validation.contentType,
      // Signed, and browsers set Content-Length themselves from the File and
      // cannot be made to lie about it. This is what actually enforces the size
      // limit at the storage layer rather than only in our own UI.
      ContentLength: parsed.sizeBytes,
    }),
    {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      // Content-Type is in the SDK's unsignable set by default, so without this
      // the signature would not bind it and any type could be uploaded.
      signableHeaders: new Set(["content-type"]),
    },
  );

  return { exerciseId, uploadUrl, contentType: validation.contentType };
}

const linkSchema = z.object({
  planId: z.string().uuid(),
  blockId: z.string().uuid(),
  url: z.string().min(1).max(MAX_URL_LENGTH),
  label: z.string().max(MAX_LABEL_LENGTH).optional(),
});

/**
 * Attaches a link instead of a file.
 *
 * The URL is normalised and scheme-checked here, not only in the form: the
 * action is a public endpoint, so the browser's validation is a convenience and
 * this is the control. It lands as 'ready' immediately — there is no object to
 * confirm, so there is nothing to be pending about.
 */
export async function createExerciseLink(input: z.input<typeof linkSchema>): Promise<void> {
  const userId = await requireUserId();
  const parsed = linkSchema.parse(input);

  const normalised = normaliseExerciseUrl(parsed.url);
  if (!normalised.ok) throw new Error(normalised.reason);

  const label = (parsed.label ?? "").trim() || labelForUrl(normalised.url);

  const row = await queryOne<{ id: string }>(
    `insert into exercises (block_id, file_name, kind, url, size_bytes, status, uploaded_by, uploaded_at)
     select $1, $2, 'link', $3, 0, 'ready', $4, now()
      where exists (
        select 1
          from blocks b
          join phases ph on ph.id = b.phase_id
          join training_plans tp on tp.id = ph.plan_id
         where b.id = $1 and tp.id = $5 and tp.instructor_id = $4
      )
        and (select count(*) from exercises where block_id = $1) < $6
     returning id`,
    [parsed.blockId, label, normalised.url, userId, parsed.planId, MAX_FILES_PER_BLOCK],
  );

  if (!row) {
    throw new Error("Block not found, already full, or you do not have access to it.");
  }

  revalidatePath(planDetailRoute(parsed.planId));
}

const confirmSchema = z.object({
  planId: z.string().uuid(),
  exerciseId: z.string().uuid(),
});

/**
 * Flips a reserved row to ready, but only after asking the bucket whether the
 * object is really there and really the size we signed for. Trusting the
 * browser's "upload finished" would let a cancelled or truncated PUT show up
 * as an attached file that 404s on download.
 */
export async function confirmExerciseUpload(input: z.input<typeof confirmSchema>): Promise<void> {
  const userId = await requireUserId();
  const parsed = confirmSchema.parse(input);

  const row = await queryOne<{ storage_key: string; size_bytes: number }>(
    `select e.storage_key, e.size_bytes
       from exercises e
       join blocks b on b.id = e.block_id
       join phases ph on ph.id = b.phase_id
       join training_plans tp on tp.id = ph.plan_id
      where e.id = $1 and tp.instructor_id = $2`,
    [parsed.exerciseId, userId],
  );

  if (!row) throw new Error("Exercise not found, or you do not have access to it.");

  const head = await s3Internal().send(new HeadObjectCommand({ Bucket: bucket(), Key: row.storage_key }));

  if (head.ContentLength !== Number(row.size_bytes)) {
    throw new Error("Upload did not complete — the stored file size does not match.");
  }

  await queryOne(
    `update exercises set status = 'ready', uploaded_at = now()
      where id = $1 and status = 'pending'
     returning id`,
    [parsed.exerciseId],
  );

  revalidatePath(planDetailRoute(parsed.planId));
}

/**
 * Everything the instructor has attached anywhere, collapsed to one entry per
 * distinct exercise, for the reuse picker.
 *
 * Sent whole and filtered in the browser rather than searched per keystroke:
 * one instructor's material is a few hundred rows at most, and it makes the
 * matching rules pure enough to unit test. getReusableExercises resolves and
 * checks the session itself, as every read in plan-data.ts does.
 */
export async function listReusableExercises(): Promise<ReusableExercise[]> {
  return dedupeReusable(await getReusableExercises());
}

const attachExistingSchema = z.object({
  planId: z.string().uuid(),
  blockId: z.string().uuid(),
  sourceIds: z.array(z.string().uuid()).min(1).max(MAX_FILES_PER_BLOCK),
});

export type AttachExistingResult = { attached: number; failed: string[] };

/**
 * Attaches copies of exercises the instructor has already used elsewhere.
 *
 * Copies, never references: exercises.storage_key is unique so that each row
 * owns its object, and removing an exercise from one block can never break
 * another block that shows the same material.
 *
 * The select both loads the sources and proves the caller owns every one of
 * them, through the same block -> phase -> plan -> instructor chain as every
 * other write here. A forged id simply does not come back.
 */
export async function attachExistingExercises(
  input: z.input<typeof attachExistingSchema>,
): Promise<AttachExistingResult> {
  const userId = await requireUserId();
  const parsed = attachExistingSchema.parse(input);

  const target = await queryOne<{ used: number }>(
    `select (select count(*) from exercises where block_id = b.id)::int as used
       from blocks b
       join phases ph on ph.id = b.phase_id
       join training_plans tp on tp.id = ph.plan_id
      where b.id = $1 and tp.id = $2 and tp.instructor_id = $3`,
    [parsed.blockId, parsed.planId, userId],
  );

  if (!target) throw new Error("Block not found, or you do not have access to it.");

  // Checked once for the whole batch. The per-insert guard the other actions
  // use would attach as many as fit and drop the rest without saying so.
  const room = MAX_FILES_PER_BLOCK - target.used;
  if (parsed.sourceIds.length > room) {
    throw new Error(
      room <= 0
        ? `This block already holds ${MAX_FILES_PER_BLOCK} exercises.`
        : `Only ${room} more exercise${room === 1 ? "" : "s"} will fit on this block.`,
    );
  }

  const sources = await query<CopyableExercise & { id: string }>(
    `select e.id, e.file_name, e.kind, e.storage_key, e.content_type, e.url, e.size_bytes, e.uploaded_by
       from exercises e
       join blocks b on b.id = e.block_id
       join phases ph on ph.id = b.phase_id
       join training_plans tp on tp.id = ph.plan_id
      where e.id = any($1::uuid[])
        and e.status = 'ready'
        and tp.instructor_id = $2`,
    [parsed.sourceIds, userId],
  );

  if (sources.length === 0) throw new Error("Those exercises were not found, or you do not have access to them.");

  const failed: string[] = [];
  let attached = 0;

  for (const source of sources) {
    try {
      await copyExerciseInto(source, parsed.blockId, parsed.planId);
      attached += 1;
    } catch (error) {
      // Unlike a clone, this was an explicit click on named items, so the
      // caller is told which ones did not make it rather than left to notice.
      console.error("[attachExistingExercises] could not copy", { id: source.id, error });
      failed.push(source.file_name);
    }
  }

  revalidatePath(planDetailRoute(parsed.planId));
  return { attached, failed };
}

const updateExerciseSchema = z.object({
  planId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  label: z.string().min(1).max(MAX_LABEL_LENGTH),
  /** Links only. Ignored for a file, whose address is derived from its id. */
  url: z.string().max(MAX_URL_LENGTH).optional(),
});

/**
 * Corrects an exercise's label, and a link's destination.
 *
 * A file's URL is not editable: it has none. What it is served from is derived
 * from its id, and pointing a file row at somebody else's object is exactly
 * what storage_key being unique is there to prevent. So the kind is read from
 * the row rather than trusted from the caller, and a url sent for a file is
 * dropped rather than quietly written into a column the check constraint
 * forbids.
 *
 * Copies made by reuse or cloning are independent rows, so renaming one here
 * leaves the others as they were.
 */
export async function updateExercise(input: z.input<typeof updateExerciseSchema>): Promise<void> {
  const userId = await requireUserId();
  const parsed = updateExerciseSchema.parse(input);

  const existing = await queryOne<{ kind: "file" | "link" }>(
    `select e.kind
       from exercises e
       join blocks b on b.id = e.block_id
       join phases ph on ph.id = b.phase_id
       join training_plans tp on tp.id = ph.plan_id
      where e.id = $1 and tp.id = $2 and tp.instructor_id = $3`,
    [parsed.exerciseId, parsed.planId, userId],
  );

  if (!existing) throw new Error("Exercise not found, or you do not have access to it.");

  let url: string | null = null;

  if (existing.kind === "link") {
    const raw = (parsed.url ?? "").trim();
    if (!raw) throw new Error("A link needs a URL.");

    // Same normalisation as createExerciseLink, so an edited link cannot become
    // something the create path would have refused — a javascript: URL, say.
    const checked = normaliseExerciseUrl(raw);
    if (!checked.ok) throw new Error(checked.reason);
    url = checked.url;
  }

  const row = await queryOne<{ id: string }>(
    `update exercises e
        set file_name = $4,
            url = case when e.kind = 'link' then $5 else e.url end
       from blocks b, phases ph, training_plans tp
      where e.id = $1
        and b.id = e.block_id
        and ph.id = b.phase_id
        and tp.id = ph.plan_id
        and tp.id = $2
        and tp.instructor_id = $3
      returning e.id`,
    [parsed.exerciseId, parsed.planId, userId, parsed.label.trim(), url],
  );

  if (!row) throw new Error("Exercise not found, or you do not have access to it.");

  revalidatePath(planDetailRoute(parsed.planId));
}

const deleteSchema = z.object({
  planId: z.string().uuid(),
  exerciseId: z.string().uuid(),
});

/**
 * Row first, then the object. Failing that way round leaves a file nothing
 * references, which the sweeper can find; the reverse would leave a row whose
 * download is permanently broken.
 */
export async function deleteExercise(input: z.input<typeof deleteSchema>): Promise<void> {
  const userId = await requireUserId();
  const parsed = deleteSchema.parse(input);

  const row = await queryOne<{ storage_key: string | null }>(
    `delete from exercises e
      using blocks b, phases ph, training_plans tp
      where e.id = $1
        and b.id = e.block_id
        and ph.id = b.phase_id
        and tp.id = ph.plan_id
        and tp.instructor_id = $2
     returning e.storage_key`,
    [parsed.exerciseId, userId],
  );

  if (!row) throw new Error("Exercise not found, or you do not have access to it.");

  // A link has no object; filtering keeps us from asking S3 to delete "null".
  await deleteObjects(row.storage_key ? [row.storage_key] : []);
  revalidatePath(planDetailRoute(parsed.planId));
}
