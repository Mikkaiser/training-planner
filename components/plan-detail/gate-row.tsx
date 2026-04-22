"use client";

import { Shield, ShieldCheck } from "lucide-react";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { CompetitorStatusChip } from "@/components/plan-detail/competitor-status-chip";
import { competitorGateState } from "@/lib/plan-detail/progress";
import type { GateItem } from "@/lib/plan-detail/types";

export function GateRow({
  gate,
  blockColor,
}: {
  gate: GateItem;
  blockColor?: string | null;
}) {
  const { detail, tokens } = usePlanDetailContext();

  const Icon = gate.gate_type === "phase_gate" ? ShieldCheck : Shield;

  const rowStyle = blockColor
    ? ({
        // CSS custom property consumed by `globals.css` (not part of `CSSProperties` index signature).
        ["--gate-block-color" as string]: blockColor,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className="plan-gate-row"
      style={rowStyle}
    >
      <span
        className="plan-gate-row__icon"
        style={{ color: tokens.accent }}
        aria-hidden
      >
        <Icon size={15} />
      </span>
      <span className="plan-gate-row__name">{gate.name}</span>
      {typeof gate.pass_threshold === "number" ? (
        <span className="plan-gate-row__threshold">
          {gate.pass_threshold}%
        </span>
      ) : null}
      <div className="plan-gate-row__status">
        {detail.competitors.map((c) => (
          <CompetitorStatusChip
            key={c.id}
            competitorName={c.full_name}
            competitorColor={c.avatar_color}
            state={competitorGateState(detail, c.id, gate.id)}
          />
        ))}
      </div>
    </div>
  );
}
