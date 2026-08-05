"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRun, updateRun } from "@/actions/assessments";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Modal } from "@/components/ui/Modal";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";

export type RunActionsTarget = {
  id: string;
  label: string | null;
  planId: string | null;
  who: string;
  markedCount: number;
};

export type CompetitorOption = { id: string; name: string };

/**
 * Relabel, reassign or remove a marking run from the list it appears in.
 *
 * Reassigning is the one that earns its place: marking the wrong competitor is
 * easy from a list of names, and until now the only remedy was deleting the run
 * and marking every aspect over again.
 */
export function RunActions({ run, competitors }: { run: RunActionsTarget; competitors: CompetitorOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const marks =
    run.markedCount === 0
      ? "Nothing has been marked on it yet"
      : `That discards ${run.markedCount} mark${run.markedCount === 1 ? "" : "s"}`;

  return (
    <div className="tp-row tp-gap-2 tp-card-actions" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="tp-btn tp-btn-ghost tp-btn-sm"
        style={{ padding: "5px 7px", color: "var(--ink-2)" }}
        aria-label={`Edit the run for ${run.who}`}
        title="Edit"
        disabled={pending}
        onClick={() => setEditing(true)}
      >
        <PencilIcon size={12} />
      </button>

      <ConfirmButton
        className="tp-btn tp-btn-ghost tp-btn-sm"
        style={{ padding: "5px 7px", color: "var(--ink-2)" }}
        label="Delete"
        ariaLabel={`Delete the run for ${run.who}`}
        title={`Delete the run for ${run.who}?`}
        body={`${marks}. It cannot be undone.`}
        confirmLabel="Delete run"
        disabled={pending}
        onConfirm={() =>
          startTransition(async () => {
            await deleteRun(run.id);
            router.refresh();
          })
        }
      >
        <TrashIcon size={12} />
      </ConfirmButton>

      <EditRunModal
        run={run}
        competitors={competitors}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function EditRunModal({
  run,
  competitors,
  open,
  onClose,
  onSaved,
}: {
  run: RunActionsTarget;
  competitors: CompetitorOption[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [planId, setPlanId] = useState(run.planId ?? "");
  const [label, setLabel] = useState(run.label ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setPlanId(run.planId ?? "");
      setLabel(run.label ?? "");
      setError(null);
    }
  }, [open, run.planId, run.label]);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateRun({ runId: run.id, planId: planId || null, label });
        onSaved();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Could not save that.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} ariaLabel={`Edit the run for ${run.who}`} width={440}>
      <div className="tp-modal-pad">
        <div className="tp-eyebrow">Edit run</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
          Competitor and label
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="tp-col tp-gap-2 tp-mt-4">
            <span className="tp-eyebrow">Competitor</span>
            <select
              className="tp-input"
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
              style={{ padding: "11px 14px" }}
            >
              <option value="">No competitor — a practice run</option>
              {competitors.map((competitor) => (
                <option key={competitor.id} value={competitor.id}>
                  {competitor.name}
                </option>
              ))}
            </select>
          </label>

          <label className="tp-col tp-gap-2 tp-mt-3">
            <span className="tp-eyebrow">Label (optional)</span>
            <input
              className="tp-input"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. First attempt"
              maxLength={200}
              style={{ padding: "11px 14px" }}
            />
          </label>

          {/* Moving a run keeps every mark on it — the marks belong to the
              aspects, not to the competitor — so this corrects a misfiled run
              without any re-marking. */}
          <p className="tp-tiny tp-mut tp-mt-3" style={{ margin: 0, lineHeight: 1.5 }}>
            Marks already entered stay with the run.
          </p>

          {error ? (
            <p className="tp-tiny tp-mt-3" style={{ color: "var(--neg)", margin: 0 }}>
              {error}
            </p>
          ) : null}

          <div className="tp-row tp-gap-2 tp-mt-4" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="tp-btn tp-btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
