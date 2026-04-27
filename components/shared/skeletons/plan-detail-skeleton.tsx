import * as React from "react";

import { PlanDetailSkeletonDetailPanel } from "./plan-detail-skeleton-detail-panel";
import { PlanDetailSkeletonHeaderBar } from "./plan-detail-skeleton-header-bar";
import { PlanDetailSkeletonRoadmap } from "./plan-detail-skeleton-roadmap";

/**
 * Skeleton for /plans/[id]. Mirrors the real layout:
 * sticky 64px header, 42/58 roadmap/detail split, both columns independently
 * scrollable. Kept inside `.plan-detail-root` so it inherits the same
 * flex sizing as the loaded page.
 */
export function PlanDetailSkeleton() {
  return (
    <div
      className="plan-detail-root"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}
      aria-hidden
    >
      <PlanDetailSkeletonHeaderBar />

      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <PlanDetailSkeletonRoadmap />
        <PlanDetailSkeletonDetailPanel />
      </div>
    </div>
  );
}
