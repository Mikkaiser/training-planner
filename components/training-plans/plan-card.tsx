"use client";

import { Code2, Layers, ShieldCheck } from "lucide-react";

import { PLAN_COLORS, resolvePlanColor } from "@/lib/constants/plan-colors";
import { PlanCardActions } from "@/components/training-plans/plan-card-actions";
import { PlanCardHeader } from "@/components/training-plans/plan-card-header";
import { PlanCardStats } from "@/components/training-plans/plan-card-stats";
import { PlanCardMeta } from "@/components/training-plans/plan-card-meta";
import type { PlanListItem } from "@/lib/hooks/use-training-plans";

type PlanCardProps = {
  plan: PlanListItem;
  onDelete: () => void;
  deleting: boolean;
};

export function PlanCard({ plan, onDelete, deleting }: PlanCardProps): React.JSX.Element {
  const colorKey = resolvePlanColor(plan.color);
  const tokens = PLAN_COLORS[colorKey];

  const status = (plan.status ?? "draft").toString();

  const cardStyle: React.CSSProperties = {
    borderLeftColor: tokens.border,
    // CSS custom property consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-card-glow" as string]: tokens.glow,
  };

  const chipStyle = {
    background: tokens.chip,
    borderColor: tokens.chipBorder,
    color: tokens.chipText,
  };

  return (
    <div className="plan-card" style={cardStyle}>
      <PlanCardHeader
        planId={plan.id}
        name={plan.name}
        description={plan.description}
        status={status}
        planColor={colorKey}
      />

      <PlanCardStats
        planColors={PLAN_COLORS}
        colorKey={colorKey}
        phaseCount={plan.phase_count}
        blockCount={plan.block_count}
        gateCount={plan.gate_count}
        phaseIcon={<Layers size={18} />}
        blockIcon={<Code2 size={18} />}
        gateIcon={<ShieldCheck size={18} />}
      />

      <PlanCardMeta startDate={plan.start_date} creatorName={plan.creator_name} />

      <PlanCardActions
        planId={plan.id}
        deleting={deleting}
        onDelete={onDelete}
        chipStyle={chipStyle}
      />
    </div>
  );
}

