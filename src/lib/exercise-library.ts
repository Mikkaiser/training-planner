/**
 * Collapses everything an instructor has already attached into a list they can
 * search and reuse.
 *
 * Pure, per the rule in CLAUDE.md: the SQL fetches rows, the decisions live
 * here where they can be tested without a database. The decisions are what
 * counts as "the same exercise", which occurrence to copy from, and what a
 * search query matches.
 */
import type { ExerciseKind } from "@/lib/types";

/** One occurrence, as the cross-plan query returns it. */
export type LibraryRow = {
  id: string;
  file_name: string;
  kind: ExerciseKind;
  url: string | null;
  content_type: string | null;
  size_bytes: number;
  created_at: string;
};

/** One distinct exercise, however many blocks it appears in. */
export type ReusableExercise = {
  /** The occurrence a copy is made from. */
  sourceId: string;
  kind: ExerciseKind;
  /** file_name, which carries the label for links too. */
  label: string;
  url: string | null;
  contentType: string | null;
  sizeBytes: number;
  usageCount: number;
  lastUsedAt: string;
};

/**
 * What makes two rows the same exercise.
 *
 * A link is its URL. A file is its name and size together — name alone would
 * merge two different briefs both called `brief.pdf`, which is exactly the name
 * people reuse. The kind is part of the key, so a link labelled "brief.pdf" and
 * an actual brief.pdf stay separate however similar they read.
 */
function identityOf(row: LibraryRow): string {
  return row.kind === "link" ? `link:${row.url ?? ""}` : `file:${row.file_name}:${row.size_bytes}`;
}

/**
 * One entry per distinct exercise, most recently used first.
 *
 * The newest occurrence becomes the copy source: an older row is the likelier
 * of the two to have had its object deleted out from under it, and a copy from
 * a missing object produces an exercise that looks attached and downloads
 * nothing.
 */
export function dedupeReusable(rows: LibraryRow[]): ReusableExercise[] {
  const byIdentity = new Map<string, ReusableExercise>();

  for (const row of rows) {
    const key = identityOf(row);
    const existing = byIdentity.get(key);

    if (!existing) {
      byIdentity.set(key, {
        sourceId: row.id,
        kind: row.kind,
        label: row.file_name,
        url: row.url,
        contentType: row.content_type,
        sizeBytes: row.size_bytes,
        usageCount: 1,
        lastUsedAt: row.created_at,
      });
      continue;
    }

    existing.usageCount += 1;

    // Rows arrive newest-first, but sorting is the query's business, not a
    // guarantee this function should rely on.
    if (row.created_at > existing.lastUsedAt) {
      existing.sourceId = row.id;
      existing.label = row.file_name;
      existing.contentType = row.content_type;
      existing.lastUsedAt = row.created_at;
    }
  }

  return [...byIdentity.values()].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
}

/**
 * True when the query appears in the label or the URL.
 *
 * The URL matters as much as the label: a link is often recognised by the file
 * name buried in its path, while its label is something generic that the
 * instructor typed once and forgot.
 */
export function matchesExerciseQuery(entry: ReusableExercise, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;

  return `${entry.label} ${entry.url ?? ""}`.toLowerCase().includes(needle);
}

export function searchReusable(
  entries: ReusableExercise[],
  query: string,
  limit: number,
): ReusableExercise[] {
  return entries.filter((entry) => matchesExerciseQuery(entry, query)).slice(0, limit);
}
