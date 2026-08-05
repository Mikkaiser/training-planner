"use client";

import { useTransition } from "react";
import { deletePhase, updatePhase } from "@/actions/phases";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChevronIcon } from "@/components/ui/icons";
import type { PhaseVM } from "@/lib/plan-view-model";

interface PhaseHeaderProps {
  phase: PhaseVM;
  planId: string;
  expanded: boolean;
  onToggle: () => void;
  /** Drag grip, supplied by the sortable wrapper. */
  handle?: React.ReactNode;
}

/**
 * Design: completed and locked phases collapse to a single summary row; the
 * current phase gets a larger, un-carded header above its timeline rail.
 */
export function PhaseHeader({ phase, planId, expanded, onToggle, handle }: PhaseHeaderProps) {
  const [pending, startTransition] = useTransition();
  const isCurrent = phase.status === "current";

  const rename = (title: string) =>
    startTransition(async () => {
      await updatePhase({ phaseId: phase.id, planId, title });
    });

  const remove = () =>
    startTransition(async () => {
      await deletePhase(planId, phase.id);
    });

  const body = (
    <>
      {handle}
      <div className="tp-mono tp-tiny tp-mut" style={{ width: 30, flexShrink: 0, paddingLeft: isCurrent ? 8 : 0 }}>
        P{phase.index}
      </div>

      <div className="tp-col" style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <div className="tp-row tp-gap-2" style={{ alignItems: "baseline", flexWrap: "wrap" }}>
          <InlineEdit
            value={phase.title}
            ariaLabel="Phase title"
            disabled={pending}
            onSubmit={rename}
            style={{ fontSize: isCurrent ? 18 : 16, fontWeight: 700, letterSpacing: "-0.02em" }}
          />
          {isCurrent ? <span className="tp-pill">Current Phase</span> : null}
        </div>
        <div className="tp-tiny tp-mut">{phase.summary}</div>
      </div>

      {/* The design labels a finished phase "Complete", not "Passed" — passing
          is something gates do, phases just finish. */}
      {phase.status === "complete" ? <span className="tp-status tp-status-passed">Complete</span> : null}

      <ConfirmButton
        className="tp-btn tp-btn-ghost tp-btn-sm tp-quiet"
        label="Remove"
        ariaLabel={`Remove phase ${phase.title}`}
        title={`Remove "${phase.title}"?`}
        body={
          phase.blockCount > 0
            ? `This deletes the phase, its ${phase.blockCount} block${
                phase.blockCount === 1 ? "" : "s"
              }, their gates and any attached files. It cannot be undone.`
            : "This deletes the phase. It cannot be undone."
        }
        confirmLabel="Remove phase"
        disabled={pending}
        onConfirm={remove}
      />

      <button
        type="button"
        onClick={onToggle}
        className="tp-chev"
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${phase.title}`}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
      >
        <ChevronIcon size={11} className={expanded ? "tp-chev open" : "tp-chev"} />
      </button>
    </>
  );

  if (isCurrent) {
    return (
      <div
        className="tp-row tp-gap-3 tp-quiet-host"
        style={{ padding: "14px 4px 18px", alignItems: "center", flexWrap: "wrap" }}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      className="tp-card tp-quiet-host"
      style={{
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: phase.status === "locked" ? 0.7 : 1,
      }}
    >
      {body}
    </div>
  );
}
