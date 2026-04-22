"use client";

import { useMemo } from "react";

import { subcompetenceChipStyle } from "@/lib/constants/subcompetence-tokens";
import type { BlockItem, GateItem } from "@/lib/plan-detail/types";
import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import { useIsDark } from "@/lib/use-is-dark";
import { BlockDetailHeader } from "@/components/plan-detail/block-detail-header";
import { BlockDetailCompetitors } from "@/components/plan-detail/block-detail-competitors";
import { BlockDetailExercises } from "@/components/plan-detail/block-detail-exercises";
import { BlockDetailGateCard } from "@/components/plan-detail/block-detail-gate-card";
import { BlockDetailGateInfoBar } from "@/components/plan-detail/block-detail-gate-info-bar";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";

export function BlockDetail({ block }: { block: BlockItem }) {
  const { detail, tokens, colorKey } = usePlanDetailContext();
  const isDark = useIsDark();

  const phase = detail.phases.find((p) => p.id === block.phase_id);
  const blockGate: GateItem = block.gate;

  const sc = block.subcompetence;
  const { Icon, colorDark } = getSubcompetenceIcon(sc);
  const subcompetenceColor = sc?.color ?? colorDark;
  const scChipStyle = subcompetenceChipStyle(sc?.color ?? null, isDark);

  const exercises = detail.exercisesByBlock.get(block.id) ?? [];

  const weekRange = useMemo(() => {
    if (!phase?.duration_weeks || !phase.blocks.length) return null;
    const per = phase.duration_weeks / phase.blocks.length;
    const idx = phase.blocks.findIndex((b) => b.id === block.id);
    if (idx < 0) return null;
    const startWeek = Math.round(idx * per) + 1;
    const endWeek = Math.round((idx + 1) * per);
    return `Week ${startWeek}${endWeek > startWeek ? `–${endWeek}` : ""}`;
  }, [phase, block.id]);

  return (
    <div className="plan-block-detail">
      <BlockDetailHeader
        block={block}
        weekRange={weekRange}
        subcompetenceLabel={sc?.name ?? null}
        subcompetenceChipStyle={scChipStyle}
        subcompetenceColor={subcompetenceColor}
        Icon={Icon}
      />

      <BlockDetailCompetitors
        detail={detail}
        blockId={block.id}
        accentColor={tokens.accent}
      />

      <BlockDetailGateInfoBar gate={blockGate} />

      <BlockDetailGateCard gate={blockGate} subcompetenceColor={sc?.color ?? null} />

      <BlockDetailExercises
        block={block}
        exercises={exercises}
        accentColor={tokens.accent}
        planColor={colorKey}
      />
    </div>
  );
}
