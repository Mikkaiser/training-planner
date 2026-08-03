"use client";

import { useTransition } from "react";
import { deleteGate, updateGateStatus } from "@/actions/blocks";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckIcon, CrossIcon, GateIcon } from "@/components/ui/icons";
import type { GateVM } from "@/lib/plan-view-model";

interface GateMarkerProps {
  gate: GateVM;
  planId: string;
}

/**
 * Design's gate marker. The scope line reads "Cumulative · Blocks 1 – 7" from
 * the view-model's global block index; the scaffold printed "Hours threshold 8"
 * from a column that actually stores the block's own hours, not a threshold.
 */
export function GateMarker({ gate, planId }: GateMarkerProps) {
  const [pending, startTransition] = useTransition();

  const decided = gate.status !== "pending";
  const iconClass = gate.status === "passed" ? "passed" : gate.status === "failed" ? "failed" : "";

  const setStatus = (status: GateVM["status"]) => {
    startTransition(async () => {
      await updateGateStatus({ planId, gateId: gate.id, status });
    });
  };

  const remove = (
    <ConfirmButton
      className="tp-btn tp-btn-ghost tp-btn-sm tp-reveal"
      label="Remove"
      ariaLabel={`Remove ${gate.label}`}
      title={`Remove ${gate.label}?`}
      body={
        decided
          ? `This deletes the checkpoint after block ${gate.index} and its recorded verdict. Progress will fall, since the block no longer has a gate to pass.`
          : `This deletes the checkpoint after block ${gate.index}. You can add it back afterwards.`
      }
      confirmLabel="Remove gate"
      disabled={pending}
      onConfirm={() =>
        startTransition(async () => {
          await deleteGate({ planId, gateId: gate.id });
        })
      }
    />
  );

  return (
    <div className="tp-gate tp-reveal-host" style={{ flexWrap: "wrap" }}>
      <div className={`tp-gate-icon ${iconClass}`}>
        {gate.status === "passed" ? (
          <CheckIcon size={14} />
        ) : gate.status === "failed" ? (
          <CrossIcon size={12} />
        ) : (
          <GateIcon size={14} />
        )}
      </div>

      <div className="tp-gate-body">
        <div className="tp-row tp-gap-2" style={{ alignItems: "baseline", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>{gate.label}</div>
          <StatusBadge status={gate.status} />
        </div>
        <div className="tp-tiny tp-mut">{gate.scopeLabel}</div>
      </div>

      {decided ? (
        <div className="tp-gate-actions">
          {remove}
          <button
            type="button"
            className="tp-btn tp-btn-ghost tp-btn-sm"
            disabled={pending}
            onClick={() => setStatus("pending")}
          >
            Reopen
          </button>
        </div>
      ) : (
        <div className="tp-gate-actions">
          {remove}
          <button
            type="button"
            className="tp-btn tp-btn-pos tp-btn-sm"
            disabled={pending}
            onClick={() => setStatus("passed")}
          >
            Mark Passed
          </button>
          <button
            type="button"
            className="tp-btn tp-btn-neg tp-btn-sm"
            disabled={pending}
            onClick={() => setStatus("failed")}
          >
            Mark Failed
          </button>
        </div>
      )}
    </div>
  );
}
