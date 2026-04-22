"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { GatesSkeleton } from "@/components/shared/skeletons";
import { PhaseGatesCard } from "@/components/gates/phase-gates-card";
import { GATES_QUERY_KEY, useGatesData } from "@/lib/hooks/use-gates-data";

export function GatesManager() {
  const { data, isLoading, error } = useGatesData();

  if (isLoading) {
    return <GatesSkeleton />;
  }

  if (error) {
    return (
      <GlassCard>
        <div className="text-sm text-negative">
          Could not load gates. Please try again.
        </div>
      </GlassCard>
    );
  }

  if (!data || data.phases.length === 0) {
    return (
      <GlassCard>
        <div className="text-sm text-tp-secondary">
          No phases yet. Add phases before uploading gate assessments.
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-[24px]">
      {data.phases.map((phase) => {
        const gates = data.gatesByPhase.get(phase.id) ?? [];
        return (
          <PhaseGatesCard
            key={phase.id}
            phase={phase}
            gates={gates}
            assessmentsByGate={data.assessmentsByGate}
            queryKey={GATES_QUERY_KEY}
          />
        );
      })}
    </div>
  );
}
export { GATES_QUERY_KEY };
