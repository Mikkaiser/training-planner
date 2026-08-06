"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { attachExistingExercises, listReusableExercises } from "@/actions/exercises";
import { SearchIcon } from "@/components/ui/icons";
import { fileKind } from "@/lib/exercise-files";
import { searchReusable, type ReusableExercise } from "@/lib/exercise-library";
import { formatBytes } from "@/lib/utils";
import type { Exercise } from "@/lib/types";

const RESULT_LIMIT = 40;

/**
 * Search everything already attached elsewhere, and pull copies onto this block.
 *
 * The same brief or SharePoint link goes on many blocks across many
 * competitors, and until now the only way was to paste or upload it again each
 * time. Note "copies": a file gets its own object, so removing it here can
 * never break the block it came from.
 */
export function ReuseExercisePicker({
  planId,
  blockId,
  existing,
  onAttached,
}: {
  planId: string;
  blockId: string;
  /** What is on this block already, so it is not offered twice. */
  existing: Exercise[];
  onAttached: () => void;
}) {
  const router = useRouter();
  const [library, setLibrary] = useState<ReusableExercise[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [attaching, startAttaching] = useTransition();

  // The panel lives inside a Modal, which unmounts its children when closed, so
  // this runs once per opening and always sees current data.
  useEffect(() => {
    startLoading(async () => {
      try {
        setLibrary(await listReusableExercises());
      } catch {
        setError("Could not load what you have attached before.");
        setLibrary([]);
      }
    });
  }, []);

  /** Already on this block — offering it again would just make a duplicate. */
  const alreadyHere = useMemo(() => {
    const keys = new Set<string>();
    for (const exercise of existing) {
      keys.add(
        exercise.kind === "link"
          ? `link:${exercise.url ?? ""}`
          : `file:${exercise.file_name}:${exercise.size_bytes}`,
      );
    }
    return keys;
  }, [existing]);

  const results = useMemo(() => {
    if (!library) return [];
    const available = library.filter(
      (entry) =>
        !alreadyHere.has(
          entry.kind === "link" ? `link:${entry.url ?? ""}` : `file:${entry.label}:${entry.sizeBytes}`,
        ),
    );
    return searchReusable(available, query, RESULT_LIMIT);
  }, [library, alreadyHere, query]);

  const toggle = (sourceId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });

  const attach = () => {
    setError(null);
    startAttaching(async () => {
      try {
        const result = await attachExistingExercises({
          planId,
          blockId,
          sourceIds: [...selected],
        });
        setSelected(new Set());
        if (result.failed.length > 0) {
          setError(`Could not attach: ${result.failed.join(", ")}.`);
        }
        router.refresh();
        onAttached();
      } catch (attachError) {
        setError(attachError instanceof Error ? attachError.message : "Could not attach those.");
      }
    });
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
      <div className="tp-row" style={{ justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div className="tp-eyebrow">Or reuse one you&rsquo;ve added before</div>
        <label
          className="tp-row tp-gap-2 tp-field"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "5px 10px",
            fontSize: 12,
            color: "var(--ink-2)",
          }}
        >
          <SearchIcon size={12} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search exercises you have used before"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              font: "inherit",
              color: "var(--ink)",
              width: 140,
            }}
          />
        </label>
      </div>

      {loading && library === null ? (
        <div className="tp-tiny tp-mut" style={{ padding: "10px 0" }}>
          Looking through what you have attached…
        </div>
      ) : results.length === 0 ? (
        <div
          className="tp-tiny tp-mut"
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px dashed var(--border-strong)",
            background: "var(--surface-2)",
          }}
        >
          {library && library.length === 0
            ? "Nothing to reuse yet — whatever you attach here will show up next time."
            : query.trim()
              ? `Nothing matches “${query.trim()}”.`
              : "Everything you have used before is already on this block."}
        </div>
      ) : (
        <div
          className="tp-col tp-gap-2"
          style={{ maxHeight: 220, overflowY: "auto", paddingRight: 2 }}
        >
          {results.map((entry) => (
            <ResultRow
              key={entry.sourceId}
              entry={entry}
              selected={selected.has(entry.sourceId)}
              onToggle={() => toggle(entry.sourceId)}
            />
          ))}
        </div>
      )}

      {error ? (
        <div className="tp-tiny tp-mt-2" style={{ color: "var(--neg)" }}>
          {error}
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="tp-row tp-gap-2 tp-mt-3" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setSelected(new Set())}>
            Clear
          </button>
          <button type="button" className="tp-btn tp-btn-primary" onClick={attach} disabled={attaching}>
            {attaching ? "Attaching…" : `Attach ${selected.size}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Drawn as the exercise row it is about to become (.tp-file), so what you pick
 * looks like what you get. A toggle button with aria-pressed, the same pattern
 * PlanCreateModal uses for choosing a plan to clone.
 */
function ResultRow({
  entry,
  selected,
  onToggle,
}: {
  entry: ReusableExercise;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      // Without this the name is the row's whole text read out — "PDF
      // verification-brief.pdf 12 KB 1 block" — which says what it is but not
      // what pressing it does.
      aria-label={`Reuse ${entry.label}`}
      className="tp-file"
      style={{
        width: "100%",
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        background: selected ? "var(--accent-soft)" : "var(--surface-2)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      <div className="tp-file-icon">{entry.kind === "link" ? "URL" : fileKind(entry.label)}</div>

      <div className="tp-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {entry.label}
        </div>
        <div
          className="tp-tiny tp-mut"
          style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {entry.kind === "link" ? entry.url : formatBytes(entry.sizeBytes)}
        </div>
      </div>

      <span className="tp-tiny tp-mono tp-mut" style={{ flexShrink: 0 }}>
        {entry.usageCount === 1 ? "1 block" : `${entry.usageCount} blocks`}
      </span>
    </button>
  );
}
