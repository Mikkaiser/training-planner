"use client";

import { Layers } from "lucide-react";
import { motion } from "framer-motion";

import { BlockGateCard } from "@/components/plan-detail/block-gate-card";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { getSubcompetenceTokens } from "@/lib/constants/subcompetence-tokens";
import { phaseAveragePercent } from "@/lib/plan-detail/progress";
import type { PhaseWithChildren } from "@/lib/plan-detail/types";
import { useIsDark } from "@/lib/use-is-dark";

export function PhaseSection({ phase }: { phase: PhaseWithChildren }) {
  const { detail, tokens } = usePlanDetailContext();
  const isDark = useIsDark();
  const avg = phaseAveragePercent(detail, phase.id);

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
          const scTokens = getSubcompetenceTokens(block.subcompetence?.color ?? null, isDark);
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
