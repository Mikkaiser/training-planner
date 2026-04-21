"use client";

import { ShieldCheck } from "lucide-react";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { CompetitorStatusChip } from "@/components/plan-detail/competitor-status-chip";
import { competitorGateState } from "@/lib/plan-detail/progress";
import type { GateItem } from "@/lib/plan-detail/types";

export function PhaseGateRow({ gate }: { gate: GateItem }) {
  const { detail, tokens } = usePlanDetailContext();

  return (
    <div
      className="plan-phase-gate-row"
    >
      <span style={{ color: tokens.accent }} aria-hidden>
        <ShieldCheck size={20} />
      </span>
      <span className="plan-phase-gate-row__label">Phase Gate</span>
      <span className="plan-phase-gate-row__name">{gate.name}</span>
      {typeof gate.pass_threshold === "number" ? (
        <span className="plan-phase-gate-row__threshold">
          {gate.pass_threshold}%
        </span>
      ) : null}
      <div className="plan-phase-gate-row__status">
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
