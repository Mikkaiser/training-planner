"use client";

import { Shield, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import {
  getSubcompetenceTokens,
  subcompetenceChipStyle,
} from "@/lib/constants/subcompetence-tokens";
import { competitorBlockState, competitorGateState } from "@/lib/plan-detail/progress";
import type { BlockItem } from "@/lib/plan-detail/types";
import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import { useIsDark } from "@/lib/use-is-dark";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { ProgressDot } from "@/components/plan-detail/progress-dot";
import { CompetitorStatusChip } from "@/components/plan-detail/competitor-status-chip";
import {
  CompetitorDonutRing,
  type DonutRingCompetitor,
  type DonutRingSegmentState,
} from "@/components/plan-detail/competitor-donut-ring";
import { useSelection } from "@/components/plan-detail/selection-context";

export function BlockGateCard({
  block,
  isPhaseMilestone = false,
}: {
  block: BlockItem;
  isPhaseMilestone?: boolean;
}) {
  const { detail, tokens } = usePlanDetailContext();
  const { selection, selectBlock } = useSelection();
  const isDark = useIsDark();

  const selected = selection?.id === block.id;
  const sc = block.subcompetence;
  const { Icon } = getSubcompetenceIcon(sc);

  const scTokens = getSubcompetenceTokens(sc?.color ?? null, isDark);
  const chipStyle = subcompetenceChipStyle(sc?.color ?? null, isDark);

  const leftBorder = scTokens.fg || tokens.border;

  const gate = block.gate;
  const GateIcon = gate.gate_type === "phase_gate" ? ShieldCheck : Shield;

  const ringCompetitors: DonutRingCompetitor[] = detail.competitors.map((c) => ({
    id: c.id,
    name: c.full_name,
    color: c.avatar_color,
  }));

  const ringSegments: DonutRingSegmentState[] = detail.competitors.map((c) => {
    const state = competitorGateState(detail, c.id, gate.id);
    if (state.kind === "passed") return { kind: "passed", scoreLabel: `${state.attempt.score}/100` };
    if (state.kind === "failed" || state.kind === "attempted") {
      return { kind: "failed", scoreLabel: `${state.attempt.score}/100` };
    }
    return { kind: "none" };
  });

  const ringActiveCompetitors = detail.competitors
    .filter((c) => competitorBlockState(detail, c.id, block.id).kind === "in_progress")
    .map((c) => c.id);

  if (isPhaseMilestone && gate.gate_type === "phase_gate") {
    return (
      <motion.div
        layout
        role="button"
        tabIndex={0}
        onClick={() => selectBlock(block.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectBlock(block.id);
          }
        }}
        data-selected={selected ? "true" : undefined}
        className="plan-phase-gate-card"
        style={
          {
            ["--plan-border" as string]: tokens.border,
            ["--plan-accent" as string]: tokens.accent,
          } as React.CSSProperties
        }
      >
        <span className="plan-phase-gate-card__icon" aria-hidden>
          <CompetitorDonutRing
            competitors={ringCompetitors}
            segments={ringSegments}
            activeCompetitorIds={ringActiveCompetitors}
            centerLabel={`${block.global_index}`}
            size={34}
            strokeWidth={4}
          />
        </span>
        <div className="plan-phase-gate-card__text">
          <span className="plan-phase-gate-card__label">PHASE GATE</span>
          <span className="plan-phase-gate-card__name">{gate.name}</span>
        </div>
        {typeof gate.pass_threshold === "number" ? (
          <span className="plan-phase-gate-card__threshold">{gate.pass_threshold}%</span>
        ) : null}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      onClick={() => selectBlock(block.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectBlock(block.id);
        }
      }}
      data-selected={selected ? "true" : undefined}
      data-milestone={isPhaseMilestone ? "true" : undefined}
      className="plan-block-gate-card"
      style={
        {
          // CSS custom property consumed by `globals.css` (not part of `CSSProperties` index signature).
          ["--sc-left" as string]: leftBorder,
          ["--subcompetence-color" as string]: leftBorder,
        } as React.CSSProperties
      }
    >
      <div className="plan-block-gate-card__top">
        <CompetitorDonutRing
          className="plan-block-gate-card__index"
          competitors={ringCompetitors}
          segments={ringSegments}
          activeCompetitorIds={ringActiveCompetitors}
          centerLabel={`${block.global_index}`}
          size={32}
          strokeWidth={4}
        />

        <div className="plan-block-gate-card__info">
          <span
            className="plan-block-gate-card__icon"
            style={{ color: scTokens.fg || tokens.accent }}
            aria-hidden
          >
            <Icon size={16} />
          </span>
          <span className="plan-block-gate-card__name">{block.name}</span>
          {sc ? (
            <span
              className="plan-block-gate-card__sc-chip subcompetence-chip"
              style={chipStyle}
            >
              {sc.name}
            </span>
          ) : null}
        </div>

        <div className="plan-block-gate-card__progress">
          {detail.competitors.map((c) => {
            const state = competitorBlockState(detail, c.id, block.id);
            return (
              <ProgressDot
                key={c.id}
                competitorName={c.full_name}
                competitorColor={c.avatar_color}
                state={state}
              />
            );
          })}
        </div>
      </div>

      <div className="plan-block-gate-card__divider" aria-hidden />

      <div className="plan-block-gate-card__bottom">
        <div className="plan-block-gate-card__gate-head">
          <span
            className="plan-block-gate-card__gate-icon"
            aria-hidden
          >
            <GateIcon size={13} />
          </span>
          <span className="plan-block-gate-card__gate-name">{gate.name}</span>
          {typeof gate.pass_threshold === "number" ? (
            <span className="plan-block-gate-card__gate-threshold">
              {gate.pass_threshold}%
            </span>
          ) : null}
        </div>

        <div className="plan-block-gate-card__gate-status">
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
    </motion.div>
  );
}

