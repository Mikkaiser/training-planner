"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveMark } from "@/actions/assessments";
import { buildAssessmentRunVM, type AspectVM } from "@/lib/assessment-view-model";
import {
  beginSave,
  emptyTracker,
  hasUnsavedWork,
  settleSave,
  summariseSaves,
  type SaveTracker,
} from "@/lib/save-tracker";
import type { AssessmentMark, AssessmentScheme } from "@/lib/types";

interface MarkingSheetProps {
  scheme: AssessmentScheme;
  runId: string;
  initialMarks: AssessmentMark[];
}

/** Local echo of a mark, so the sheet responds before the round trip lands. */
type Draft = { awarded: number | null; judgementScore: number | null; comment: string | null };

export function MarkingSheet({ scheme, runId, initialMarks }: MarkingSheetProps) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      initialMarks.map((mark) => [
        mark.aspect_id,
        { awarded: mark.awarded, judgementScore: mark.judgement_score, comment: mark.comment },
      ]),
    ),
  );

  // Comments are typed, so they are debounced; marks are clicked and save at once.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const marks: AssessmentMark[] = useMemo(
    () =>
      Object.entries(drafts).map(([aspectId, draft]) => ({
        id: aspectId,
        run_id: runId,
        aspect_id: aspectId,
        awarded: draft.awarded,
        judgement_score: draft.judgementScore,
        comment: draft.comment,
      })),
    [drafts, runId],
  );

  const vm = useMemo(() => buildAssessmentRunVM(scheme, marks), [scheme, marks]);

  const [tracker, setTracker] = useState<SaveTracker>(emptyTracker);
  /** Debounced edits that have not been sent yet — unsaved in their own right. */
  const [queued, setQueued] = useState(0);
  /** The value last sent per aspect, so a failure can be retried as it stood. */
  const lastSent = useRef(new Map<string, Draft>());

  const push = useCallback(
    (aspectId: string, draft: Draft) => {
      lastSent.current.set(aspectId, draft);

      let seq = 0;
      setTracker((current) => {
        const started = beginSave(current, aspectId);
        seq = started.seq;
        return started.tracker;
      });

      void saveMark({
        runId,
        aspectId,
        awarded: draft.awarded,
        judgementScore: draft.judgementScore,
        comment: draft.comment,
      })
        .then(() => setTracker((current) => settleSave(current, aspectId, seq, true)))
        .catch((error: unknown) => {
          // Kept visible rather than swallowed: this screen decides a
          // competitor's score, and a mark that silently failed to store looks
          // exactly like one that saved.
          console.error("[MarkingSheet] could not save a mark", error);
          setTracker((current) => settleSave(current, aspectId, seq, false));
        });
    },
    [runId],
  );

  const summary = useMemo(() => summariseSaves(tracker), [tracker]);

  const retry = useCallback(() => {
    for (const aspectId of summary.failedIds) {
      const draft = lastSent.current.get(aspectId);
      if (draft) push(aspectId, draft);
    }
  }, [push, summary.failedIds]);

  // The assessor is typing into a debounce and clicking through a queue of
  // requests; closing the tab mid-flight loses marks with no trace.
  useEffect(() => {
    if (!hasUnsavedWork(tracker, queued)) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [tracker, queued]);

  const update = useCallback(
    (aspectId: string, patch: Partial<Draft>, debounceMs = 0) => {
      setDrafts((current) => {
        const existing = current[aspectId] ?? { awarded: null, judgementScore: null, comment: null };
        const next = { ...existing, ...patch };
        const updated = { ...current, [aspectId]: next };

        const timer = timers.current.get(aspectId);
        if (timer) {
          clearTimeout(timer);
          setQueued((count) => count - 1);
        }

        if (debounceMs === 0) {
          push(aspectId, next);
        } else {
          setQueued((count) => count + 1);
          timers.current.set(
            aspectId,
            setTimeout(() => {
              timers.current.delete(aspectId);
              setQueued((count) => count - 1);
              push(aspectId, next);
            }, debounceMs),
          );
        }

        return updated;
      });
    },
    [push],
  );

  return (
    <div>
      <RunHeader vm={vm} saving={summary.saving > 0 || queued > 0} failed={summary.failed} onRetry={retry} />

      <div className="tp-col tp-gap-4" style={{ marginTop: 20 }}>
        {vm.criteria.map((criterion) => (
          <div key={criterion.id} className="tp-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              className="tp-row"
              style={{ justifyContent: "space-between", gap: 12, padding: "16px 18px", flexWrap: "wrap" }}
            >
              <div className="tp-row tp-gap-3" style={{ minWidth: 0 }}>
                <span className="tp-mono tp-tiny tp-mut" style={{ width: 20 }}>
                  {criterion.letter}
                </span>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{criterion.name}</div>
              </div>
              <div className="tp-row tp-gap-3">
                <span className="tp-tiny tp-mut">
                  {criterion.markedCount}/{criterion.aspectCount} marked
                </span>
                <span className="tp-pill tp-pill-mono">
                  {criterion.awarded} / {criterion.maxMark}
                </span>
              </div>
            </div>

            {criterion.subCriteria.map((sub) => (
              <div key={sub.id} style={{ borderTop: "1px solid var(--border)" }}>
                <div
                  className="tp-row"
                  style={{ justifyContent: "space-between", padding: "10px 18px", background: "var(--surface-2)", gap: 12 }}
                >
                  <div className="tp-row tp-gap-3" style={{ minWidth: 0 }}>
                    <span className="tp-mono tp-tiny tp-mut">{sub.code}</span>
                    <span className="tp-sm" style={{ fontWeight: 600 }}>
                      {sub.name}
                    </span>
                  </div>
                  <span className="tp-tiny tp-mono tp-mut" style={{ flexShrink: 0 }}>
                    {sub.awarded} / {sub.maxMark}
                  </span>
                </div>

                {sub.aspects.map((aspect) => (
                  <AspectRow
                    key={aspect.id}
                    aspect={aspect}
                    draft={drafts[aspect.id]}
                    unsaved={tracker[aspect.id]?.state === "failed"}
                    onChange={(patch, debounceMs) => update(aspect.id, patch, debounceMs)}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RunHeader({
  vm,
  saving,
  failed,
  onRetry,
}: {
  vm: ReturnType<typeof buildAssessmentRunVM>;
  saving: boolean;
  failed: number;
  onRetry: () => void;
}) {
  return (
    <div
      className="tp-card"
      style={{ padding: "16px 18px", position: "sticky", top: 68, zIndex: 20, backdropFilter: "blur(8px)" }}
    >
      <div className="tp-row" style={{ justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div className="tp-col" style={{ gap: 2 }}>
          <div className="tp-eyebrow">Total</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {vm.awarded}
            <span className="tp-mut" style={{ fontSize: 16, fontWeight: 600 }}>
              {" "}
              / {vm.maxMark}
            </span>
          </div>
        </div>

        <div className="tp-row tp-gap-4" style={{ flexWrap: "wrap" }}>
          <Stat label="Measurement" value={`${vm.measurementAwarded} / ${vm.measurementMax}`} />
          <Stat label="Judgement" value={`${vm.judgementAwarded} / ${vm.judgementMax}`} />
          <Stat
            label="Marked"
            value={`${vm.markedCount} / ${vm.aspectCount}`}
            tone={vm.isComplete ? "pos" : undefined}
          />
        </div>
      </div>

      <div className="tp-row tp-gap-3 tp-mt-3">
        <div className="tp-bar" style={{ flex: 1 }}>
          <i style={{ width: `${vm.percentage}%` }} />
        </div>
        <span className="tp-tiny tp-mono tp-mut">{vm.percentage}%</span>
      </div>

      {/* Marks autosave, so without this the only difference between a mark
          that stored and one that was rejected is that nothing happened. */}
      {failed > 0 ? (
        <div
          className="tp-row tp-gap-3 tp-mt-3"
          role="alert"
          style={{
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--neg-soft)",
            border: "1px solid var(--neg)",
          }}
        >
          <span className="tp-tiny" style={{ fontWeight: 600, color: "var(--neg)" }}>
            {failed} {failed === 1 ? "mark is" : "marks are"} not saved. They are still on screen, and
            highlighted below.
          </span>
          <button type="button" className="tp-btn tp-btn-neg tp-btn-sm" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="tp-tiny tp-mut tp-mt-2" aria-live="polite" style={{ minHeight: 16 }}>
        {saving ? "Saving…" : null}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" }) {
  return (
    <div className="tp-col" style={{ gap: 2 }}>
      <div className="tp-eyebrow">{label}</div>
      <div
        className="tp-mono"
        style={{ fontSize: 13, fontWeight: 700, color: tone === "pos" ? "var(--pos)" : "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}

function AspectRow({
  aspect,
  draft,
  unsaved,
  onChange,
}: {
  aspect: AspectVM;
  draft: Draft | undefined;
  unsaved: boolean;
  onChange: (patch: Partial<Draft>, debounceMs?: number) => void;
}) {
  const [showComment, setShowComment] = useState(Boolean(draft?.comment));

  return (
    <div
      className={`tp-aspect ${aspect.isMarked ? "tp-aspect-marked" : ""}`}
      style={unsaved ? { background: "var(--neg-soft)" } : undefined}
    >
      <span
        className="tp-tag"
        style={{
          flexShrink: 0,
          marginTop: 2,
          background: aspect.type === "judgement" ? "var(--blue-soft)" : "var(--accent-soft)",
          color: aspect.type === "judgement" ? "var(--blue)" : "var(--ink)",
        }}
      >
        {aspect.type === "judgement" ? "J" : "M"}
      </span>

      <div className="tp-col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
        <div className="tp-sm" style={{ fontWeight: 500 }}>
          {aspect.description}
        </div>
        {aspect.extra_description ? <div className="tp-tiny tp-mut">{aspect.extra_description}</div> : null}

        {aspect.type === "judgement" ? (
          <div className="tp-judge">
            {aspect.descriptors.map((descriptor) => (
              <button
                key={descriptor.id}
                type="button"
                className="tp-judge-option"
                aria-pressed={draft?.judgementScore === descriptor.score}
                aria-label={`Score ${descriptor.score}: ${descriptor.descriptor}`}
                onClick={() =>
                  onChange({
                    // Clicking the chosen score again clears it, so a mark can be
                    // taken back rather than only changed.
                    judgementScore: draft?.judgementScore === descriptor.score ? null : descriptor.score,
                    awarded: null,
                  })
                }
              >
                <span className="tp-judge-score">{descriptor.score}</span>
                <span className="tp-tiny">{descriptor.descriptor}</span>
              </button>
            ))}
          </div>
        ) : null}

        {showComment ? (
          <textarea
            className="tp-input tp-mt-2"
            value={draft?.comment ?? ""}
            placeholder="Note for the competitor…"
            aria-label={`Comment on ${aspect.description}`}
            rows={2}
            maxLength={2000}
            onChange={(event) => onChange({ comment: event.target.value }, 600)}
            style={{ fontSize: 12.5, padding: "8px 10px", resize: "vertical" }}
          />
        ) : (
          <button
            type="button"
            className="tp-tiny tp-mut tp-mt-1"
            onClick={() => setShowComment(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Add a comment
          </button>
        )}
      </div>

      <div className="tp-col" style={{ gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
        {aspect.type === "measurement" ? (
          // One line, not two: a real scheme runs to 78 aspects, and a second
          // row per aspect adds a whole screen of scrolling for no information.
          <div className="tp-row tp-gap-2">
            <button
              type="button"
              className="tp-btn tp-btn-ghost tp-btn-sm"
              title="Award full marks"
              onClick={() => onChange({ awarded: aspect.max_mark, judgementScore: null })}
            >
              Full
            </button>
            <button
              type="button"
              className="tp-btn tp-btn-ghost tp-btn-sm"
              title="Award nothing"
              onClick={() => onChange({ awarded: 0, judgementScore: null })}
            >
              0
            </button>
            <input
              className="tp-mark-input"
              type="number"
              min={0}
              max={aspect.max_mark}
              step={0.25}
              value={draft?.awarded ?? ""}
              aria-label={`Mark for ${aspect.description}`}
              placeholder="—"
              onChange={(event) => {
                const raw = event.target.value;
                onChange(
                  { awarded: raw === "" ? null : Math.min(Math.max(Number(raw), 0), aspect.max_mark), judgementScore: null },
                  350,
                );
              }}
            />
            <span className="tp-tiny tp-mono tp-mut" style={{ minWidth: 30 }}>
              / {aspect.max_mark}
            </span>
          </div>
        ) : (
          <div className="tp-row tp-gap-2" style={{ alignItems: "baseline" }}>
            <span className="tp-mono" style={{ fontSize: 14, fontWeight: 700 }}>
              {aspect.isMarked ? aspect.awarded : "—"}
            </span>
            <span className="tp-tiny tp-mono tp-mut" style={{ minWidth: 30 }}>
              / {aspect.max_mark}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
