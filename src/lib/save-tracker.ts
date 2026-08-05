/**
 * Tracks the state of in-flight autosaves, one entry per thing being saved.
 *
 * Pure, and separate from the marking screen, because the rule that matters
 * here is not about marks — it is about ordering. Autosaves for the same aspect
 * overlap: the assessor clicks 2, then 3, and two requests are in the air at
 * once. Nothing guarantees they resolve in the order they were sent, so a slow
 * failure from the first can land after the second has already succeeded. Left
 * alone, the sheet would show an error for a mark that saved, or worse, show
 * "saved" for one that did not.
 *
 * Every save is stamped with a sequence number and a late reply for a
 * superseded stamp is discarded.
 */

export type SaveState = "saving" | "saved" | "failed";

export type SaveEntry = { seq: number; state: SaveState };

export type SaveTracker = Record<string, SaveEntry>;

export const emptyTracker: SaveTracker = {};

/**
 * Marks an id as saving and returns the stamp to settle it with. The stamp
 * always increases, so an earlier one can be recognised as stale.
 */
export function beginSave(tracker: SaveTracker, id: string): { tracker: SaveTracker; seq: number } {
  const seq = (tracker[id]?.seq ?? 0) + 1;
  return { tracker: { ...tracker, [id]: { seq, state: "saving" } }, seq };
}

/**
 * Records the outcome, unless a newer save for the same id has started since —
 * in which case this reply is about a value that is no longer on screen.
 */
export function settleSave(tracker: SaveTracker, id: string, seq: number, ok: boolean): SaveTracker {
  const entry = tracker[id];
  if (!entry || entry.seq !== seq) return tracker;
  return { ...tracker, [id]: { seq, state: ok ? "saved" : "failed" } };
}

export type SaveSummary = {
  saving: number;
  failed: number;
  /** Ids whose most recent save failed, so they can be retried. */
  failedIds: string[];
  /** True once something has been saved and nothing is outstanding. */
  allSaved: boolean;
};

export function summariseSaves(tracker: SaveTracker): SaveSummary {
  const entries = Object.entries(tracker);
  const failedIds = entries.filter(([, entry]) => entry.state === "failed").map(([id]) => id);
  const saving = entries.filter(([, entry]) => entry.state === "saving").length;

  return {
    saving,
    failed: failedIds.length,
    failedIds,
    allSaved: entries.length > 0 && saving === 0 && failedIds.length === 0,
  };
}

/** True when leaving the page would lose something — a failed or in-flight save. */
export function hasUnsavedWork(tracker: SaveTracker, queued: number): boolean {
  const { saving, failed } = summariseSaves(tracker);
  return queued > 0 || saving > 0 || failed > 0;
}
