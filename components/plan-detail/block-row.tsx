"use client";

import { motion } from "framer-motion";

import {
  getSubcompetenceTokens,
  subcompetenceChipStyle,
} from "@/lib/constants/subcompetence-tokens";
import { competitorBlockState } from "@/lib/plan-detail/progress";
import type { BlockItem } from "@/lib/plan-detail/types";
import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import { useIsDark } from "@/lib/use-is-dark";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { ProgressDot } from "@/components/plan-detail/progress-dot";
import { useSelection } from "@/components/plan-detail/selection-context";

export function BlockRow({ block }: { block: BlockItem }) {
  const { detail } = usePlanDetailContext();
  const { selection, selectBlock } = useSelection();
  const isDark = useIsDark();

  const selected = selection?.id === block.id;
  const sc = block.subcompetence;
  const { Icon } = getSubcompetenceIcon(sc);

  // Resolve a theme-aware subcompetence palette so the index chip and chip
  // pill stay readable in both light and dark mode (particularly for lime
  // #DBFD6B which is invisible on light surfaces when used raw).
  const scTokens = getSubcompetenceTokens(sc?.color ?? null, isDark);
  const chipStyle = subcompetenceChipStyle(sc?.color ?? null, isDark);

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
      </div>

      <div className="plan-block-row__progress">
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
    </motion.div>
  );
}
