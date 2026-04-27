"use client";

import { motion } from "framer-motion";

import {
  getSubcompetenceTokens,
  subcompetenceChipStyle,
} from "@/lib/constants/subcompetence-tokens";
import { useExerciseCompletions } from "@/lib/hooks/use-exercise-completions";
import { competitorBlockState } from "@/lib/plan-detail/progress";
import type { BlockItem } from "@/lib/plan-detail/types";
import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { ProgressDot } from "@/components/plan-detail/progress-dot";
import { useSelection } from "@/components/plan-detail/selection-context";

export function BlockRow({ block }: { block: BlockItem }) {
  const { detail, planId, selectedCompetitorId } = usePlanDetailContext();
  const { selection, selectBlock } = useSelection();
  const { data: completionMap = new Map() } = useExerciseCompletions(
    planId,
    selectedCompetitorId
  );

  const selected = selection?.id === block.id;
  const sc = block.subcompetence;
  const { Icon } = getSubcompetenceIcon(sc);

  // Resolve a curated subcompetence palette so legacy lime stays readable on
  // light glass surfaces.
  const scTokens = getSubcompetenceTokens(sc?.color ?? null);
  const chipStyle = subcompetenceChipStyle(sc?.color ?? null);

  const indexStyle: React.CSSProperties = scTokens.bg
    ? {
        background: scTokens.bg,
        borderColor: scTokens.border,
        color: scTokens.fg,
      }
    : {
        // Fallback for user-defined subcompetence colors that don't have a
        // curated preset — let the value pass through but clamp the text
        // colour to avoid unreadable tints on light surfaces.
        background: `${scTokens.color}26`,
        borderColor: `${scTokens.color}66`,
        color: scTokens.fg,
      };

  const exerciseIds = detail.exerciseIdsByBlock.get(block.id) ?? [];
  const completedCount = exerciseIds.reduce((count, exerciseId) => {
    const completion = completionMap.get(exerciseId);
    return completion?.completed ? count + 1 : count;
  }, 0);

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
      className="plan-block-row"
    >
      <span className="plan-block-row__index" style={indexStyle}>
        {block.global_index}
      </span>

      <div className="plan-block-row__info">
        <span
          className="plan-block-row__icon"
          style={{ color: scTokens.fg }}
          aria-hidden
        >
          <Icon size={16} />
        </span>
        <span className="plan-block-row__name">{block.name}</span>
        {sc ? (
          <span
            className="plan-block-row__sc-chip subcompetence-chip"
            style={chipStyle}
          >
            {sc.name}
          </span>
        ) : null}
        {exerciseIds.length > 0 ? (
          <span className="text-[11px] font-body text-tp-muted">
            {completedCount}/{exerciseIds.length}
          </span>
        ) : null}
      </div>

      <div className="plan-block-row__progress">
        {(selectedCompetitorId
          ? detail.competitors.filter((competitor) => competitor.id === selectedCompetitorId)
          : detail.competitors
        ).map((competitor) => {
          const state = competitorBlockState(detail, competitor.id, block.id);
          return (
            <ProgressDot
              key={competitor.id}
              competitorName={competitor.full_name}
              competitorColor={competitor.avatar_color}
              state={state}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
