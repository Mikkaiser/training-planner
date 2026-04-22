"use client";

import { GateDetailAssessments } from "@/components/plan-detail/gate-detail-assessments";
import { GateDetailCompetitor } from "@/components/plan-detail/gate-detail-competitor";
import { GateDetailHeader } from "@/components/plan-detail/gate-detail-header";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import type { GateItem } from "@/lib/plan-detail/types";

export function GateDetail({ gate }: { gate: GateItem }) {
  const { detail, tokens, colorKey } = usePlanDetailContext();
  const attempts = detail.attemptsByGate.get(gate.id) ?? [];
  const assessments = detail.assessmentsByGate.get(gate.id) ?? [];

  const chipStyle: React.CSSProperties = {
    background: tokens.chip,
    borderColor: tokens.chipBorder,
    color: tokens.chipText,
  };

  return (
    <div className="plan-gate-detail">
      <GateDetailHeader
        gate={gate}
        accentColor={tokens.accent}
        chipStyle={chipStyle}
        thresholdStyle={{ color: tokens.accent }}
      />

      <section className="plan-gate-detail__section">
        {detail.competitors.map((c) => (
          <GateDetailCompetitor
            key={c.id}
            detail={detail}
            gate={gate}
            competitor={c}
            attempts={attempts}
            chipStyle={chipStyle}
            recordButtonStyle={{
              background: tokens.accent,
              boxShadow: `0 2px 10px ${tokens.glow}`,
            }}
          />
        ))}
      </section>

      <GateDetailAssessments
        assessments={assessments}
        accentColor={tokens.accent}
        planColor={colorKey}
      />
    </div>
  );
}
