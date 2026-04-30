"use client";

import { useTransition } from "react";
import { createPhase } from "@/actions/phases";
import { EmptyState } from "@/components/plan/EmptyState";
import { PhaseSection } from "@/components/plan/PhaseSection";
import { GhostButton } from "@/components/ui/GhostButton";
import type { PlanWithPhases } from "@/lib/types";

interface PlanDetailProps {
  plan: PlanWithPhases;
}

export function PlanDetail({ plan }: PlanDetailProps) {
  const [pending, startTransition] = useTransition();
  const phases = [...plan.phases].sort((a, b) => a.order_index - b.order_index);
  const hasPhases = phases.length > 0;

  const handleAddPhase = (defaultTitle?: string) => {
    const title = window.prompt("Phase title", defaultTitle ?? `Phase ${phases.length + 1}`);
    if (!title) return;

    startTransition(async () => {
      await createPhase({
        planId: plan.id,
        title,
        orderIndex: phases.length + 1,
      });
    });
  };

  if (!hasPhases) {
    return <EmptyState onAddPhase={handleAddPhase} />;
  }

  return (
    <section style={{ padding: "28px 24px 40px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", display: "grid", gap: "16px" }}>
        {phases.map((phase, phaseIndex) => (
          <PhaseSection key={phase.id} phase={phase} planId={plan.id} gates={plan.gates} phaseIndex={phaseIndex} />
        ))}
        <GhostButton large onClick={() => handleAddPhase()} disabled={pending}>
          Add Phase
        </GhostButton>
      </div>
    </section>
  );
}
