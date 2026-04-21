import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonBadge } from "./skeleton-badge";
import { SkeletonButton } from "./skeleton-button";
import { SkeletonCard } from "./skeleton-card";
import { SkeletonText } from "./skeleton-text";

/**
 * Matches the GatesManager list: a stack of phase groups, each with a
 * full-width phase header bar and 2-3 gate rows below it.
 */
export function GatesSkeleton({ phases = 3 }: { phases?: number }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
      aria-hidden
    >
      {Array.from({ length: phases }).map((_, p) => (
        <SkeletonCard
          key={p}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* Phase header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              height: 44,
              paddingBottom: 12,
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            <Skeleton width={22} height={22} borderRadius={6} />
            <Skeleton width={200} height={18} borderRadius={4} />
            <div style={{ marginLeft: "auto" }}>
              <SkeletonBadge width={56} />
            </div>
          </div>

          {/* 2-3 gate rows */}
          {[0, 1, 2].slice(0, 2 + (p % 2)).map((g) => (
            <div
              key={g}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 0",
              }}
            >
              <Skeleton width={18} height={18} borderRadius={4} />
              <div style={{ flex: 1 }}>
                <Skeleton
                  width="55%"
                  height={14}
                  borderRadius={4}
                  style={{ marginBottom: 6 }}
                />
                <SkeletonText lines={1} lastLineWidth="40%" />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((c) => (
                  <SkeletonBadge key={c} width={32} height={22} />
                ))}
              </div>
              <SkeletonButton width={110} height={32} />
            </div>
          ))}
        </SkeletonCard>
      ))}
    </div>
  );
}
