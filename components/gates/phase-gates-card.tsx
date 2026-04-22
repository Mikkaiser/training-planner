"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { GatesGateRow } from "@/components/gates/gates-gate-row";
import type { Assessment, Gate, Phase } from "@/components/gates/gates-types";

type PhaseGatesCardProps = {
  phase: Phase;
  gates: Gate[];
  assessmentsByGate: Map<string, Assessment[]>;
  queryKey: readonly ["dashboard-gates"];
};

export function PhaseGatesCard({
  phase,
  gates,
  assessmentsByGate,
  queryKey,
}: PhaseGatesCardProps): React.JSX.Element {
  return (
    <GlassCard>
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
        <h2 className="text-base font-semibold text-tp-primary">{phase.name}</h2>
        <span className="text-xs text-tp-muted">
          {gates.length} gate{gates.length === 1 ? "" : "s"}
        </span>
      </div>
      {gates.length === 0 ? (
        <p className="mt-3 text-sm text-tp-secondary">
          No gates defined for this phase yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {gates.map((gate) => (
            <GatesGateRow
              key={gate.id}
              gate={gate}
              assessments={assessmentsByGate.get(gate.id) ?? []}
              queryKey={queryKey}
            />
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

