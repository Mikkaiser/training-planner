"use client";

import { subcompetenceChipStyle } from "@/lib/constants/subcompetence-tokens";
import type { BlockItem, GateItem } from "@/lib/plan-detail/types";
import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import { BlockDetailHeader } from "@/components/plan-detail/block-detail-header";
import { BlockDetailExercises } from "@/components/plan-detail/block-detail-exercises";
import { BlockDetailGateCard } from "@/components/plan-detail/block-detail-gate-card";
import { BlockDetailGateInfoBar } from "@/components/plan-detail/block-detail-gate-info-bar";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";

export function BlockDetail({ block }: { block: BlockItem }) {
  const { detail, tokens } = usePlanDetailContext();

  const blockGate: GateItem = block.gate;

  const sc = block.subcompetence;
  const { Icon, color } = getSubcompetenceIcon(sc);
  const subcompetenceColor = sc?.color ?? color;
  const scChipStyle = subcompetenceChipStyle(sc?.color ?? null);

  const categories = detail.exerciseCategoriesByBlock.get(block.id) ?? [];

  return (
    <div className="plan-block-detail">
      <BlockDetailHeader
        block={block}
        weekRange={null}
        subcompetenceLabel={sc?.name ?? null}
        subcompetenceChipStyle={scChipStyle}
        subcompetenceColor={subcompetenceColor}
        Icon={Icon}
      />

      <BlockDetailGateInfoBar gate={blockGate} />

      <BlockDetailGateCard gate={blockGate} subcompetenceColor={sc?.color ?? null} />

      <BlockDetailExercises
        categories={categories}
        accentColor={tokens.accent}
      />
    </div>
  );
}
