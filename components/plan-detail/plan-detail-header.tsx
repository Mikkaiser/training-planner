"use client";

import Link from "next/link";
import { ChevronLeft, Pencil, UserPlus } from "lucide-react";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";

export function PlanDetailHeader({
  onAddCompetitor,
}: {
  onAddCompetitor: () => void;
}) {
  const { planId, detail, tokens } = usePlanDetailContext();
  const { plan } = detail;

  const status = (plan.status ?? "draft").toString();
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <header className="plan-detail-header">
      <div className="plan-detail-header__left">
        <Link href="/dashboard/plans" className="plan-detail-header__back">
          <ChevronLeft size={16} />
          <span>Plans</span>
        </Link>
        <span className="plan-detail-header__separator" aria-hidden>
          /
        </span>
        <span className="plan-detail-header__title">
          {plan.name?.trim() ? plan.name : "Untitled plan"}
        </span>
        <span
          className="plan-detail-header__status"
          style={{
            background: tokens.chip,
            borderColor: tokens.chipBorder,
            color: tokens.chipText,
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="plan-detail-header__right">
        <button
          type="button"
          onClick={onAddCompetitor}
          className="plan-detail-header__btn plan-detail-header__btn--ghost"
        >
          <UserPlus size={16} />
          <span>Add Competitor</span>
        </button>
        <Link
          href={`/dashboard/plans/${planId}/edit`}
          className="plan-detail-header__btn plan-detail-header__btn--primary"
          style={{
            background: tokens.accent,
            boxShadow: `0 2px 12px ${tokens.glow}`,
          }}
        >
          <Pencil size={16} />
          <span>Edit Plan</span>
        </Link>
      </div>
    </header>
  );
}
