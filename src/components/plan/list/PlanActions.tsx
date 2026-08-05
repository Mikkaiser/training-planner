"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlan, updatePlan } from "@/actions/plans";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Modal } from "@/components/ui/Modal";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { describePlanContents, type PlanSummaryVM } from "@/lib/plan-view-model";

/**
 * Rename or remove a plan from the list.
 *
 * Both were already possible, but only from inside a plan — so correcting a
 * misspelled competitor name meant opening their roadmap, and clearing out a
 * season's worth of finished plans meant opening every one of them. The list is
 * where an instructor is when they notice either.
 *
 * Sits above the card's stretched link (see .tp-card-actions) so these buttons
 * are clicked rather than the plan being opened underneath them.
 */
export function PlanActions({ plan }: { plan: PlanSummaryVM }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="tp-row tp-gap-2 tp-card-actions" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="tp-btn tp-btn-ghost tp-btn-sm"
        style={{ padding: "5px 7px", color: "var(--ink-2)" }}
        aria-label={`Edit ${plan.studentName}'s plan`}
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
        ariaLabel={`Delete ${plan.studentName}'s plan`}
        title={`Delete "${plan.title}"?`}
        body={`This deletes ${plan.studentName}'s plan and everything in it. ${describePlanContents(plan.totals)}. It cannot be undone.`}
        confirmLabel="Delete plan"
        disabled={pending}
        onConfirm={() =>
          startTransition(async () => {
            await deletePlan(plan.id);
            router.refresh();
          })
        }
      >
        <TrashIcon size={12} />
      </ConfirmButton>

      <EditPlanModal
        plan={plan}
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

function EditPlanModal({
  plan,
  open,
  onClose,
  onSaved,
}: {
  plan: PlanSummaryVM;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [studentName, setStudentName] = useState(plan.studentName);
  const [title, setTitle] = useState(plan.title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Reopening after a cancel should show what is stored, not what was typed and
  // abandoned last time.
  useEffect(() => {
    if (open) {
      setStudentName(plan.studentName);
      setTitle(plan.title);
      setError(null);
    }
  }, [open, plan.studentName, plan.title]);

  const submit = () => {
    setError(null);
    if (!studentName.trim() || !title.trim()) {
      setError("A plan needs both a competitor name and a title.");
      return;
    }

    startTransition(async () => {
      try {
        await updatePlan({ planId: plan.id, studentName, title });
        onSaved();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Could not save that.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} ariaLabel={`Edit ${plan.studentName}'s plan`} width={440}>
      <div className="tp-modal-pad">
        <div className="tp-eyebrow">Edit plan</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
          Competitor and title
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="tp-col tp-gap-2 tp-mt-4">
            <span className="tp-eyebrow">Competitor</span>
            <input
              className="tp-input"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              maxLength={200}
              autoFocus
              style={{ padding: "11px 14px" }}
            />
          </label>

          <label className="tp-col tp-gap-2 tp-mt-3">
            <span className="tp-eyebrow">Plan title</span>
            <input
              className="tp-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              style={{ padding: "11px 14px" }}
            />
          </label>

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
