"use client";

import { useState } from "react";

import { PlanDetailHeader } from "@/components/plan-detail/plan-detail-header";
import { PlanDetailProvider } from "@/components/plan-detail/plan-detail-context";
import { SelectionProvider } from "@/components/plan-detail/selection-context";
import { RoadmapColumn } from "@/components/plan-detail/roadmap-column";
import { DetailColumn } from "@/components/plan-detail/detail-column";
import { AddCompetitorDialog } from "@/components/plan-detail/add-competitor-dialog";
import { PlanDetailSkeleton } from "@/components/shared/skeletons";
import { usePlanDetail } from "@/lib/plan-detail/use-plan-detail";
import { PLAN_COLORS, resolvePlanColor } from "@/lib/constants/planColors";

export function PlanDetailView({ planId }: { planId: string }) {
  const { data, isLoading, isError, error } = usePlanDetail(planId);
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) {
    return <PlanDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="plan-detail-state plan-detail-state--error">
        <div className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load plan."}
        </div>
      </div>
    );
  }

  const tokens = PLAN_COLORS[resolvePlanColor(data.plan.color)];

  return (
    <PlanDetailProvider planId={planId} detail={data}>
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
              ["--plan-accent" as string]: tokens.accent,
              ["--plan-border" as string]: tokens.border,
              ["--plan-bg" as string]: tokens.bg,
              ["--plan-bg-strong" as string]: tokens.bgStrong,
              ["--plan-chip" as string]: tokens.chip,
              ["--plan-chip-border" as string]: tokens.chipBorder,
              ["--plan-chip-text" as string]: tokens.chipText,
              ["--plan-glow" as string]: tokens.glow,
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
