"use client";

import Link from "next/link";
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
  const isPersonal = plan.plan_type === "personal";
  const ownerColor = plan.owner_competitor_avatar_color;
  const colorKey = resolvePlanColor(isPersonal && ownerColor ? null : plan.color);
  const tokens = PLAN_COLORS[colorKey];

  const status = (plan.status ?? "draft").toString();

  const cardStyle: React.CSSProperties = {
    borderLeftColor: isPersonal && ownerColor ? ownerColor : tokens.border,
    // CSS custom property consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-card-glow" as string]: tokens.glow,
    // CSS custom property consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-gradient" as string]: tokens.gradient,
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
        planType={plan.plan_type}
      />

      {isPersonal && plan.owner_competitor_id ? (
        <div className="plan-card-owner">
          <Link href={`/competitors/${plan.owner_competitor_id}`} className="plan-card-owner__link">
            <span
              className="plan-card-owner__avatar"
              style={{ background: plan.owner_competitor_avatar_color ?? "var(--color-accent)" }}
            >
              {(plan.owner_competitor_name ?? "?")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("")}
            </span>
            <span className="plan-card-owner__name">
              {plan.owner_competitor_name ?? "Competitor"}
            </span>
          </Link>
        </div>
      ) : null}

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

      <PlanCardMeta startDate={null} creatorName={plan.creator_name} />

      <PlanCardActions
        planId={plan.id}
        deleting={deleting}
        onDelete={onDelete}
        chipStyle={chipStyle}
      />
    </div>
  );
}

