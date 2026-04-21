"use client";

import { Shield, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { useSelection } from "@/components/plan-detail/selection-context";
import { ProgressDot } from "@/components/plan-detail/progress-dot";
import { CompetitorStatusChip } from "@/components/plan-detail/competitor-status-chip";
import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import { competitorBlockState, competitorGateState } from "@/lib/plan-detail/progress";
import {
  getSubcompetenceTokens,
  subcompetenceChipStyle,
} from "@/lib/constants/subcompetenceTokens";
import { useIsDark } from "@/lib/use-is-dark";
import type { BlockItem } from "@/lib/plan-detail/types";

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
      style={{ ["--sc-left" as string]: leftBorder } as React.CSSProperties}
    >
      <div className="plan-block-gate-card__top">
        <span
          className="plan-block-gate-card__index"
          style={{
            background: scTokens.bg || tokens.chip,
            borderColor: scTokens.border || tokens.chipBorder,
            color: scTokens.fg || tokens.chipText,
          }}
        >
          {block.global_index}
        </span>

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
            style={{ color: tokens.accent }}
            aria-hidden
          >
            <GateIcon size={15} />
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

