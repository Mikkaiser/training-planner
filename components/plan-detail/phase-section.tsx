"use client";

import { Layers } from "lucide-react";
import { motion } from "framer-motion";

import { BlockGateCard } from "@/components/plan-detail/block-gate-card";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { getSubcompetenceTokens } from "@/lib/constants/subcompetence-tokens";
import { useExerciseCompletions } from "@/lib/hooks/use-exercise-completions";
import { competitorBlockState, phaseAveragePercent } from "@/lib/plan-detail/progress";
import type { PhaseWithChildren } from "@/lib/plan-detail/types";

export function PhaseSection({ phase }: { phase: PhaseWithChildren }) {
  const { detail, tokens, planId, selectedCompetitorId } = usePlanDetailContext();
  const { data: completionMap = new Map() } = useExerciseCompletions(
    planId,
    selectedCompetitorId
  );
  const avg = (() => {
    if (!selectedCompetitorId) return phaseAveragePercent(detail, phase.id);
    if (phase.blocks.length === 0) return 0;
    const passedBlocks = phase.blocks.reduce((count, block) => {
      const state = competitorBlockState(detail, selectedCompetitorId, block.id);
      return state.kind === "completed" ? count + 1 : count;
    }, 0);
    return Math.round((passedBlocks / phase.blocks.length) * 100);
  })();
  const phaseExerciseIds = phase.blocks.flatMap(
    (block) => detail.exerciseIdsByBlock.get(block.id) ?? []
  );
  const phaseCompletedCount = phaseExerciseIds.reduce((count, exerciseId) => {
    const completion = completionMap.get(exerciseId);
    return completion?.completed ? count + 1 : count;
  }, 0);
  const phaseProgressPercent =
    phaseExerciseIds.length > 0
      ? Math.round((phaseCompletedCount / phaseExerciseIds.length) * 100)
      : null;

  const exerciseBadgeStyle = (() => {
    if (phaseProgressPercent === null) return null;
    if (phaseProgressPercent <= 32) {
      return {
        background: "var(--color-negative-bg)",
        color: "var(--color-negative)",
        borderColor: "var(--color-negative-border)",
      };
    }
    if (phaseProgressPercent <= 65) {
      return {
        background: "var(--color-warning-bg)",
        color: "var(--color-warning)",
        borderColor: "var(--color-warning-border)",
      };
    }
    return {
      background: "var(--color-positive-bg)",
      color: "var(--color-positive)",
      borderColor: "var(--color-positive-border)",
    };
  })();

  return (
    <section className="plan-phase-section">
      <div
        className="plan-phase-section__header"
        style={{
          background: tokens.bg,
          borderBottom: `2px solid ${tokens.border}`,
        }}
      >
        <span style={{ color: tokens.accent }} aria-hidden>
          <Layers size={18} />
        </span>
        <span className="plan-phase-section__name">{phase.name}</span>
        {phaseProgressPercent !== null && exerciseBadgeStyle ? (
          <span
            className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
            style={exerciseBadgeStyle}
          >
            {phaseCompletedCount}/{phaseExerciseIds.length}
          </span>
        ) : null}
        {typeof phase.duration_weeks === "number" ? (
          <span
            className="plan-phase-section__duration"
            style={{
              background: tokens.chip,
              borderColor: tokens.chipBorder,
              color: tokens.chipText,
            }}
          >
            {phase.duration_weeks}w
          </span>
        ) : null}
        <div className="plan-phase-section__progress-track" aria-hidden>
          <motion.div
            className="plan-phase-section__progress-fill"
            initial={false}
            animate={{ width: `${avg}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ background: tokens.accent }}
          />
        </div>
        <span
          className="plan-phase-section__progress-label"
          style={{ color: tokens.accent }}
        >
          {avg}%
        </span>
      </div>

      <div className="plan-phase-section__body">
        {phase.blocks.map((block, idx) => {
          const isLast = idx === phase.blocks.length - 1;
          const scTokens = getSubcompetenceTokens(block.subcompetence?.color ?? null);
          const connectorColor = scTokens.fg || tokens.border;

          return (
            <div key={block.id} className="plan-block-gate-stack">
              <BlockGateCard
                block={block}
                isPhaseMilestone={isLast && block.gate.gate_type === "phase_gate"}
              />
              {!isLast ? (
                <div
                  className="plan-block-gate-connector"
                  style={
                    {
                      // Used by globals.css for the connector gradient.
                      ["--subcompetence-color" as string]: connectorColor,
                    } as React.CSSProperties
                  }
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
