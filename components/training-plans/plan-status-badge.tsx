"use client";

import { PLAN_COLORS } from "@/lib/constants/plan-colors";

type PlanStatusBadgeProps = {
  status: string;
  planColor: keyof typeof PLAN_COLORS;
};

export function PlanStatusBadge({
  status,
  planColor,
}: PlanStatusBadgeProps): React.JSX.Element {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  if (status === "active") {
    return <span className="badge-status-active shrink-0 text-[11px]">{label}</span>;
  }
  if (status === "completed") {
    return (
      <span className="badge-status-neutral shrink-0 text-[11px]">{label}</span>
    );
  }

  // Default/draft — tinted with the plan color so the card reads cohesively.
  const tokens = PLAN_COLORS[planColor];
  return (
    <span
      className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={{
        background: tokens.chip,
        borderColor: tokens.chipBorder,
        color: tokens.chipText,
      }}
    >
      {label}
    </span>
  );
}

