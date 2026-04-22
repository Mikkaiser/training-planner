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
        {gate.gate_type === "phase_gate" ? "phase_gate" : "block_gate"}
      </span>
      {typeof gate.pass_threshold === "number" ? (
        <span className="plan-block-detail__gate-bar-threshold" style={{ color: tokens.accent }}>
          {gate.pass_threshold}%
        </span>
      ) : null}
    </div>
  );
}

