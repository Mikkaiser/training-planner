import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonBadge } from "./skeleton-badge";
import { SkeletonButton } from "./skeleton-button";
import { SkeletonCard } from "./skeleton-card";
import { SkeletonText } from "./skeleton-text";

/**
 * Matches the "Phases" list view: page header + stacked phase cards.
 */
export function PhasesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
      aria-hidden
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={180} height={24} borderRadius={6} />
        <div style={{ marginLeft: "auto" }}>
          <SkeletonButton width={140} height={34} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Skeleton width={20} height={20} borderRadius={6} />
              <div style={{ flex: 1 }}>
                <Skeleton width="45%" height={16} borderRadius={6} />
              </div>
              <SkeletonBadge width={64} />
            </div>

            <SkeletonText lines={2} lastLineWidth="65%" />

            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonButton width={110} height={32} />
              <SkeletonButton width={90} height={32} />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
