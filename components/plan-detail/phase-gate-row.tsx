"use client";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { CompetitorStatusChip } from "@/components/plan-detail/competitor-status-chip";
import { competitorGateState } from "@/lib/plan-detail/progress";
import type { GateItem } from "@/lib/plan-detail/types";
import {
  CompetitorDonutRing,
  type DonutRingCompetitor,
  type DonutRingSegmentState,
} from "@/components/plan-detail/competitor-donut-ring";

export function PhaseGateRow({ gate }: { gate: GateItem }) {
  const { detail } = usePlanDetailContext();
  const competitors: DonutRingCompetitor[] = detail.competitors.map((c) => ({
    id: c.id,
    name: c.full_name,
    color: c.avatar_color,
  }));
  const segments: DonutRingSegmentState[] = detail.competitors.map((c) => {
    const state = competitorGateState(detail, c.id, gate.id);
    if (state.kind === "passed") return { kind: "passed", scoreLabel: `${state.attempt.score}/100` };
    if (state.kind === "failed" || state.kind === "attempted") {
      return { kind: "failed", scoreLabel: `${state.attempt.score}/100` };
    }
    return { kind: "none" };
  });

  const activeCompetitorIds = detail.competitors
    .filter((c) => {
      const prog = detail.progressByCompetitor.get(c.id);
      return prog?.current_phase_id === gate.phase_id;
    })
    .map((c) => c.id);

  return (
    <div
      className="plan-phase-gate-row"
    >
      <span aria-hidden>
        <CompetitorDonutRing
          competitors={competitors}
          segments={segments}
          activeCompetitorIds={activeCompetitorIds}
          centerLabel=" "
          size={34}
          strokeWidth={4}
        />
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
