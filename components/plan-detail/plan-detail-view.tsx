"use client";

import { useEffect, useState } from "react";

import { PLAN_COLORS, resolvePlanColor } from "@/lib/constants/plan-colors";
import { PlanDetailHeader } from "@/components/plan-detail/plan-detail-header";
import { PlanDetailProvider } from "@/components/plan-detail/plan-detail-context";
import { SelectionProvider } from "@/components/plan-detail/selection-context";
import { RoadmapColumn } from "@/components/plan-detail/roadmap-column";
import { DetailColumn } from "@/components/plan-detail/detail-column";
import { AddCompetitorDialog } from "@/components/plan-detail/add-competitor-dialog";
import { PlanDetailSkeleton } from "@/components/shared/skeletons";
import { usePlanDetail } from "@/lib/plan-detail/use-plan-detail";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeMessage =
      "message" in error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : null;
    if (maybeMessage) return maybeMessage;
    try {
      return JSON.stringify(error);
    } catch {
      // ignore
    }
  }
  return "Failed to load plan.";
}

export function PlanDetailView({ planId }: { planId: string }) {
  const { data, isLoading, isError, error } = usePlanDetail(planId);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const defaultCompetitorId =
    data?.plan.plan_type === "personal" && data.plan.owner_competitor_id
      ? data.plan.owner_competitor_id
      : (data?.competitors[0]?.id ?? null);

  useEffect(() => {
    if (!data || !defaultCompetitorId) {
      setSelectedCompetitorId(null);
      return;
    }
    setSelectedCompetitorId((current) => {
      if (!current) return defaultCompetitorId;
      const stillValid = data.competitors.some((competitor) => competitor.id === current);
      return stillValid ? current : defaultCompetitorId;
    });
  }, [data, defaultCompetitorId]);

  if (isLoading) {
    return <PlanDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="plan-detail-state plan-detail-state--error">
        <div className="text-sm text-destructive">
          {getErrorMessage(error)}
        </div>
      </div>
    );
  }

  const tokens = PLAN_COLORS[resolvePlanColor(data.plan.color)];

  return (
    <PlanDetailProvider
      planId={planId}
      detail={data}
      selectedCompetitorId={selectedCompetitorId}
      setSelectedCompetitorId={setSelectedCompetitorId}
    >
      <SelectionProvider>
        <div
          className="plan-detail-root"
          style={
            {
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-accent" as string]: tokens.accent,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-border" as string]: tokens.border,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-bg" as string]: tokens.bg,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-bg-strong" as string]: tokens.bgStrong,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-chip" as string]: tokens.chip,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-chip-border" as string]: tokens.chipBorder,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-chip-text" as string]: tokens.chipText,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-glow" as string]: tokens.glow,
              // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
              ["--plan-gradient" as string]: tokens.gradient,
            } as React.CSSProperties
          }
        >
          {/* Plan-tinted background accent sits behind the panels. */}
          <div
            aria-hidden
            className="plan-detail-root__tint"
            style={{ background: tokens.glow }}
          />

          <PlanDetailHeader onAddCompetitor={() => setAddOpen(true)} />

          <div
            style={{
              flex: 1,
              display: "flex",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <RoadmapColumn onAddCompetitor={() => setAddOpen(true)} />
            <DetailColumn />
          </div>

          <AddCompetitorDialog open={addOpen} onOpenChange={setAddOpen} />
        </div>
      </SelectionProvider>
    </PlanDetailProvider>
  );
}
