"use client";

import type { PLAN_COLORS } from "@/lib/constants/plan-colors";

type StatDividerProps = {
  "aria-hidden"?: boolean;
};

function StatDivider(props: StatDividerProps): React.JSX.Element {
  return <div className="plan-card-stat-divider" {...props} />;
}

type StatItemProps = {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorKey: keyof typeof PLAN_COLORS;
  planColors: typeof import("@/lib/constants/plan-colors").PLAN_COLORS;
};

function StatItem({
  icon,
  value,
  label,
  colorKey,
  planColors,
}: StatItemProps): React.JSX.Element {
  const tokens = planColors[colorKey];
  return (
    <div className="plan-card-stat">
      <span className="plan-card-stat-icon" style={{ color: tokens.accent }} aria-hidden>
        {icon}
      </span>
      <span className="plan-card-stat-value">{value}</span>
      <span className="plan-card-stat-label">{label}</span>
    </div>
  );
}

type PlanCardStatsProps = {
  planColors: typeof import("@/lib/constants/plan-colors").PLAN_COLORS;
  colorKey: keyof typeof import("@/lib/constants/plan-colors").PLAN_COLORS;
  phaseCount: number;
  blockCount: number;
  gateCount: number;
  phaseIcon: React.ReactNode;
  blockIcon: React.ReactNode;
  gateIcon: React.ReactNode;
};

export function PlanCardStats({
  planColors,
  colorKey,
  phaseCount,
  blockCount,
  gateCount,
  phaseIcon,
  blockIcon,
  gateIcon,
}: PlanCardStatsProps): React.JSX.Element {
  return (
    <div className="plan-card-stats">
      <StatItem
        icon={phaseIcon}
        value={phaseCount}
        label="Phases"
        colorKey={colorKey}
        planColors={planColors}
      />
      <StatDivider aria-hidden />
      <StatItem
        icon={blockIcon}
        value={blockCount}
        label="Blocks"
        colorKey={colorKey}
        planColors={planColors}
      />
      <StatDivider aria-hidden />
      <StatItem
        icon={gateIcon}
        value={gateCount}
        label="Gates"
        colorKey={colorKey}
        planColors={planColors}
      />
    </div>
  );
}

