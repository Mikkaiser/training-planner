"use client";

import Link from "next/link";

import { PlanStatusBadge } from "@/components/training-plans/plan-status-badge";
import type { PLAN_COLORS } from "@/lib/constants/plan-colors";

type PlanCardHeaderProps = {
  planId: string;
  name: string | null;
  description: string | null;
  status: string;
  planColor: keyof typeof PLAN_COLORS;
  planType: "shared" | "personal";
};

export function PlanCardHeader({
  planId,
  name,
  description,
  status,
  planColor,
  planType,
}: PlanCardHeaderProps): React.JSX.Element {
  return (
    <div className="plan-card-header">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <Link
          href={`/plans/${planId}`}
          className="min-w-0 truncate text-[16px] font-bold text-tp-primary hover:underline"
        >
          {name?.trim() ? name : "Untitled plan"}
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={
              planType === "personal"
                ? "competitor-pill competitor-pill--personal"
                : "competitor-pill"
            }
          >
            {planType === "personal" ? "Personal" : "Shared"}
          </span>
          <PlanStatusBadge status={status} planColor={planColor} />
        </div>
      </div>
      {description?.trim() ? (
        <div className="plan-card-description">{description}</div>
      ) : null}
    </div>
  );
}

