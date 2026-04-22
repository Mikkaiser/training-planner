"use client";

import { Shield, ShieldCheck } from "lucide-react";

import type { GateItem } from "@/lib/plan-detail/types";

type GateDetailHeaderProps = {
  gate: GateItem;
  accentColor: string;
  chipStyle: React.CSSProperties;
  thresholdStyle: React.CSSProperties;
};

export function GateDetailHeader({
  gate,
  accentColor,
  chipStyle,
  thresholdStyle,
}: GateDetailHeaderProps): React.JSX.Element {
  const Icon = gate.gate_type === "phase_gate" ? ShieldCheck : Shield;
  const typeLabel = gate.gate_type === "phase_gate" ? "Phase gate" : "Block gate";

  return (
    <header className="plan-gate-detail__header">
      <div className="plan-gate-detail__title-row">
        <span style={{ color: accentColor }} aria-hidden>
          <Icon size={24} />
        </span>
        <h2>{gate.name}</h2>
      </div>
      <div className="plan-gate-detail__meta">
        <span className="plan-gate-detail__type" style={chipStyle}>
          {typeLabel}
        </span>
        {typeof gate.pass_threshold === "number" ? (
          <span className="plan-gate-detail__threshold" style={thresholdStyle}>
            {gate.pass_threshold}%
          </span>
        ) : null}
      </div>
      {gate.description ? (
        <p className="plan-gate-detail__description">{gate.description}</p>
      ) : null}
    </header>
  );
}

