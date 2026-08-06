"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireTeamContext } from "@/lib/team-data";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { deleteObjects } from "@/lib/exercise-storage";
import { parseMarkingScheme } from "@/lib/marking-scheme/parse";
import { MAX_WORKBOOK_BYTES, readWorkbookGrid } from "@/lib/marking-scheme/read-xlsx";
import { assessmentRunRoute, assessmentSchemeRoute, APP_ROUTES } from "@/lib/routes";
import { bucket, s3Internal } from "@/lib/s3";
import { slugifyFileName } from "@/lib/exercise-files";

export type ImportResult = { schemeId: string; warnings: string[] };

/**
 * Reads an uploaded CIS marking scheme and stores it as a new scheme.
 *
 * The workbook comes through the action rather than a presigned upload: these
 * files are a few kilobytes, well inside serverActions.bodySizeLimit, and the
 * server has to read the bytes anyway in order to parse them. Uploading to
 * storage first would mean two round trips to learn the file is the wrong shape.
 *
 * Always creates a new scheme. Re-importing a corrected workbook therefore
 * leaves runs already marked against the previous version untouched.
 */
export async function importScheme(formData: FormData): Promise<ImportResult> {
  const { userId, teamId } = await requireTeamContext();

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file was received.");
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Marking schemes must be .xlsx files.");
  }
  if (file.size > MAX_WORKBOOK_BYTES) throw new Error("That file is too large to be a marking scheme.");
  if (file.size === 0) throw new Error("That file is empty.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseMarkingScheme(await readWorkbookGrid(buffer));

  if (!parsed.ok) {
    // Surfaced verbatim: each carries the offending row, which is the only way
    // to find the problem in a 140-row sheet.
    throw new Error(`That workbook is not a marking scheme we can read:\n${parsed.errors.join("\n")}`);
  }

  const scheme = parsed.scheme;
  const schemeId = randomUUID();
  const storageKey = `schemes/${schemeId}/${slugifyFileName(file.name)}`;

  const client = await pool.connect();

  try {
    await client.query("begin");

    await client.query(
      `insert into assessment_schemes (id, created_by, team_id, skill, test_project, source_file_name, storage_key, total_max)
       values ($1, $2, $8, $3, $4, $5, $6, $7)`,
      [schemeId, userId, scheme.skill, scheme.testProject, file.name, storageKey, scheme.totalMax, teamId],
    );

    for (const [criterionIndex, criterion] of scheme.criteria.entries()) {
      const criterionRow = await client.query<{ id: string }>(
        `insert into assessment_criteria
           (scheme_id, letter, name, max_measurement, max_judgement, max_total, order_index)
         values ($1, $2, $3, $4, $5, $6, $7) returning id`,
        [
          schemeId,
          criterion.letter,
          criterion.name,
          criterion.declaredMeasurement,
          criterion.declaredJudgement,
          criterion.declaredTotal,
          criterionIndex + 1,
        ],
      );
      const criterionId = criterionRow.rows[0].id;

      for (const [subIndex, sub] of criterion.subCriteria.entries()) {
        const subRow = await client.query<{ id: string }>(
          `insert into assessment_sub_criteria (criterion_id, code, name, order_index)
           values ($1, $2, $3, $4) returning id`,
          [criterionId, sub.code, sub.name, subIndex + 1],
        );
        const subId = subRow.rows[0].id;

        for (const [aspectIndex, aspect] of sub.aspects.entries()) {
          const aspectRow = await client.query<{ id: string }>(
            `insert into assessment_aspects
               (sub_criterion_id, type, description, extra_description, max_mark, order_index)
             values ($1, $2::assessment_aspect_type, $3, $4, $5, $6) returning id`,
            [subId, aspect.type, aspect.description, aspect.extraDescription, aspect.maxMark, aspectIndex + 1],
          );

          for (const descriptor of aspect.descriptors) {
            await client.query(
              `insert into assessment_judgement_descriptors (aspect_id, score, descriptor)
               values ($1, $2, $3)`,
              [aspectRow.rows[0].id, descriptor.score, descriptor.descriptor],
            );
          }
        }
      }
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("[importScheme] failed", error);
    throw error instanceof Error ? error : new Error("Failed to import that marking scheme.");
  } finally {
    client.release();
  }

  // After the rows are safe. Losing the archive copy is a nuisance; losing the
  // parsed scheme because storage was down would be the real failure.
  try {
    await s3Internal().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: storageKey,
        Body: buffer,
        ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
  } catch (error) {
    console.error("[importScheme] could not archive the workbook", { key: storageKey, error });
    await queryOne("update assessment_schemes set storage_key = null where id = $1 returning id", [schemeId]);
  }

  revalidatePath(APP_ROUTES.assessments);
  return { schemeId, warnings: scheme.warnings };
}

const updateSchemeSchema = z.object({
  schemeId: z.string().uuid(),
  skill: z.string().min(1).max(200),
  testProject: z.string().min(1).max(200),
});

/**
 * Renames a scheme. Only the two title fields — the criteria, aspects and marks
 * come from the workbook and stay tied to it, so correcting the structure means
 * re-importing rather than editing here.
 */
export async function updateScheme(input: z.input<typeof updateSchemeSchema>): Promise<void> {
  const { userId, teamId } = await requireTeamContext();
  const parsed = updateSchemeSchema.parse(input);

  const row = await queryOne<{ id: string }>(
    `update assessment_schemes set skill = $3, test_project = $4
      where id = $1 and team_id = $2 returning id`,
    [parsed.schemeId, teamId, parsed.skill.trim(), parsed.testProject.trim()],
  );

  if (!row) throw new Error("Marking scheme not found, or you do not have access to it.");

  revalidatePath(APP_ROUTES.assessments);
  revalidatePath(assessmentSchemeRoute(parsed.schemeId));
}

const updateRunSchema = z.object({
  runId: z.string().uuid(),
  planId: z.string().uuid().nullable().optional(),
  label: z.string().max(200).optional(),
});

/**
 * Relabels a run, or moves it to a different competitor.
 *
 * Reassigning matters more than it looks: marking the wrong competitor is an
 * easy mistake to make from a list of names, and without this the only remedy
 * is deleting the run and marking every aspect again.
 */
export async function updateRun(input: z.input<typeof updateRunSchema>): Promise<{ schemeId: string }> {
  const { userId, teamId } = await requireTeamContext();
  const parsed = updateRunSchema.parse(input);

  const row = await queryOne<{ scheme_id: string }>(
    `update assessment_runs set plan_id = $3, label = $4, updated_at = now()
      where id = $1 and team_id = $2
        and ($3::uuid is null or exists (select 1 from training_plans where id = $3 and team_id = $2))
      returning scheme_id`,
    [parsed.runId, teamId, parsed.planId ?? null, (parsed.label ?? "").trim() || null],
  );

  if (!row) throw new Error("Marking run not found, or you do not have access to it.");

  revalidatePath(assessmentRunRoute(parsed.runId));
  revalidatePath(assessmentSchemeRoute(row.scheme_id));
  return { schemeId: row.scheme_id };
}

const createRunSchema = z.object({
  schemeId: z.string().uuid(),
  planId: z.string().uuid().nullable().optional(),
  label: z.string().max(200).optional(),
});

export async function createRun(input: z.input<typeof createRunSchema>): Promise<{ id: string }> {
  const { userId, teamId } = await requireTeamContext();
  const parsed = createRunSchema.parse(input);

  const row = await queryOne<{ id: string }>(
    `insert into assessment_runs (scheme_id, created_by, team_id, plan_id, label)
     select $1, $5, $2, $3, $4
      where exists (select 1 from assessment_schemes where id = $1 and team_id = $2)
        and ($3::uuid is null or exists (select 1 from training_plans where id = $3 and team_id = $2))
     returning id`,
    [parsed.schemeId, teamId, parsed.planId ?? null, (parsed.label ?? "").trim() || null, userId],
  );

  if (!row) throw new Error("Scheme or competitor not found, or you do not have access to it.");

  revalidatePath(assessmentSchemeRoute(parsed.schemeId));
  return row;
}

const saveMarkSchema = z.object({
  runId: z.string().uuid(),
  aspectId: z.string().uuid(),
  awarded: z.number().min(0).nullable().optional(),
  judgementScore: z.number().int().min(0).max(3).nullable().optional(),
  comment: z.string().max(2000).nullable().optional(),
});

/**
 * Records one aspect's mark.
 *
 * The aspect's own type decides which column is written, not the caller: a
 * measurement mark can never land in judgement_score, and a judgement score is
 * never stored as an awarded value. The mark is also clamped to the aspect's
 * maximum here, since the number arrives from the browser.
 */
export async function saveMark(input: z.input<typeof saveMarkSchema>): Promise<void> {
  const { userId, teamId } = await requireTeamContext();
  const parsed = saveMarkSchema.parse(input);

  const aspect = await queryOne<{ type: "measurement" | "judgement"; max_mark: number }>(
    `select a.type, a.max_mark::float8 as max_mark
       from assessment_aspects a
       join assessment_sub_criteria sc on sc.id = a.sub_criterion_id
       join assessment_criteria c on c.id = sc.criterion_id
       join assessment_schemes s on s.id = c.scheme_id
       join assessment_runs r on r.scheme_id = s.id
      where a.id = $1 and r.id = $2 and r.team_id = $3`,
    [parsed.aspectId, parsed.runId, teamId],
  );

  if (!aspect) throw new Error("Aspect not found on this run, or you do not have access to it.");

  const awarded =
    aspect.type === "measurement" && parsed.awarded !== null && parsed.awarded !== undefined
      ? Math.min(Math.max(parsed.awarded, 0), aspect.max_mark)
      : null;

  const judgementScore =
    aspect.type === "judgement" && parsed.judgementScore !== null && parsed.judgementScore !== undefined
      ? parsed.judgementScore
      : null;

  const comment = (parsed.comment ?? "").trim() || null;

  await queryOne(
    `insert into assessment_marks (run_id, aspect_id, awarded, judgement_score, comment)
     values ($1, $2, $3, $4, $5)
     on conflict (run_id, aspect_id) do update
        set awarded = excluded.awarded,
            judgement_score = excluded.judgement_score,
            comment = excluded.comment,
            updated_at = now()
     returning id`,
    [parsed.runId, parsed.aspectId, awarded, judgementScore, comment],
  );

  await queryOne("update assessment_runs set updated_at = now() where id = $1 returning id", [parsed.runId]);
  revalidatePath(assessmentRunRoute(parsed.runId));
}

export async function deleteRun(runId: string): Promise<{ schemeId: string }> {
  const { userId, teamId } = await requireTeamContext();

  const row = await queryOne<{ scheme_id: string }>(
    "delete from assessment_runs where id = $1 and team_id = $2 returning scheme_id",
    [runId, teamId],
  );

  if (!row) throw new Error("Marking run not found, or you do not have access to it.");

  revalidatePath(assessmentSchemeRoute(row.scheme_id));
  return { schemeId: row.scheme_id };
}

export async function deleteScheme(schemeId: string): Promise<void> {
  const { userId, teamId } = await requireTeamContext();

  const row = await queryOne<{ storage_key: string | null }>(
    "delete from assessment_schemes where id = $1 and team_id = $2 returning storage_key",
    [schemeId, teamId],
  );

  if (!row) throw new Error("Marking scheme not found, or you do not have access to it.");

  // The cascade takes the criteria, aspects and runs; only the archived
  // workbook lives outside the database.
  await deleteObjects(row.storage_key ? [row.storage_key] : []);
  revalidatePath(APP_ROUTES.assessments);
}
