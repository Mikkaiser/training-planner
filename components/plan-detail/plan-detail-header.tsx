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
  const owner =
    plan.owner_competitor_id
      ? detail.competitors.find((item) => item.id === plan.owner_competitor_id) ?? null
      : null;

  const status = (plan.status ?? "draft").toString();
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <header className="plan-detail-header">
      <div className="plan-detail-header__left">
        <Link href="/plans" className="plan-detail-header__back">
          <ChevronLeft size={16} />
          <span>Plans</span>
        </Link>
        <span className="plan-detail-header__separator" aria-hidden>
          /
        </span>
        <span className="plan-detail-header__title">
          {plan.name?.trim() ? plan.name : "Untitled plan"}
        </span>
        {plan.plan_type === "personal" && owner ? (
          <Link href={`/competitors/${owner.id}`} className="competitor-pill competitor-pill--personal">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                background: owner.avatar_color,
                color: "var(--color-surface-raised)",
              }}
            >
              {owner.full_name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("")}
            </span>
            {owner.full_name}
          </Link>
        ) : null}
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
        {plan.plan_type === "shared" ? (
          <button
            type="button"
            onClick={onAddCompetitor}
            className="plan-detail-header__btn plan-detail-header__btn--ghost"
          >
            <UserPlus size={16} />
            <span>Add Competitor</span>
          </button>
        ) : null}
        <Link
          href={`/plans/${planId}/edit`}
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
