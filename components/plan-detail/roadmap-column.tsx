"use client";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { CompetitorLegend } from "@/components/plan-detail/competitor-legend";
import { PhaseSection } from "@/components/plan-detail/phase-section";

export function RoadmapColumn({
  onAddCompetitor,
}: {
  onAddCompetitor: () => void;
}) {
  const { detail } = usePlanDetailContext();

  return (
    <aside className="plan-roadmap-column glass-strong">
      <div className="plan-roadmap-column__scroll">
        <CompetitorLegend onAddCompetitor={onAddCompetitor} />

        <div className="plan-roadmap-column__phases">
          {detail.phases.length === 0 ? (
            <div className="plan-roadmap-column__empty">
              <span>No phases in this plan yet.</span>
            </div>
          ) : (
            detail.phases.map((phase) => (
              <PhaseSection key={phase.id} phase={phase} />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
