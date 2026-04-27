"use client";

import Link from "next/link";
import { Pencil, UserPlus } from "lucide-react";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";

export function PlanDetailHeader({
  onAddCompetitor,
}: {
  onAddCompetitor: () => void;
}) {
  const { planId, detail, tokens, selectedCompetitorId, setSelectedCompetitorId } =
    usePlanDetailContext();
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
        <Link href="/plans" className="plan-detail-header__back page-breadcrumb-link font-body">
          <span>Plans</span>
        </Link>
        <span className="plan-detail-header__separator page-breadcrumb-separator" aria-hidden>
          ›
        </span>
        <span className="plan-detail-header__title page-breadcrumb-current font-display">
          {plan.name?.trim() ? plan.name : "Untitled plan"}
        </span>
        {plan.plan_type === "personal" && owner ? (
          <div className="competitor-pill competitor-pill--personal">
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
          </div>
        ) : null}
        {plan.plan_type === "shared" ? (
          <label className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1 text-xs text-tp-secondary">
            <span>Competitor</span>
            <select
              className="bg-transparent text-xs font-medium text-tp-primary outline-none"
              value={selectedCompetitorId ?? ""}
              onChange={(event) => setSelectedCompetitorId(event.target.value)}
            >
              {detail.competitors.map((competitor) => (
                <option key={competitor.id} value={competitor.id}>
                  {competitor.full_name}
                </option>
              ))}
            </select>
          </label>
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
