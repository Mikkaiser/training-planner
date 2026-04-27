"use client";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import type { GateItem } from "@/lib/plan-detail/types";

type BlockDetailGateInfoBarProps = {
  gate: GateItem;
};

export function BlockDetailGateInfoBar({
  gate,
}: BlockDetailGateInfoBarProps): React.JSX.Element {
  const { tokens } = usePlanDetailContext();
  const typeLabel = gate.gate_type === "phase_gate" ? "Phase Gate" : "Block Gate";

  return (
    <div
      className="plan-block-detail__gate-bar"
      style={{
        background: tokens.chip,
        border: `1px solid ${tokens.chipBorder}`,
        color: tokens.chipText,
      }}
    >
      <span className="plan-block-detail__gate-bar-name">{gate.name}</span>
      <span className="plan-block-detail__gate-bar-type">
        {typeLabel}
      </span>
      {typeof gate.pass_threshold === "number" ? (
        <span className="plan-block-detail__gate-bar-threshold" style={{ color: tokens.accent }}>
          {gate.pass_threshold}%
        </span>
      ) : null}
    </div>
  );
}

