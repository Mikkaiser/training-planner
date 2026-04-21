import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonAvatar } from "./skeleton-avatar";
import { SkeletonBadge } from "./skeleton-badge";
import { SkeletonButton } from "./skeleton-button";
import { SkeletonText } from "./skeleton-text";

const DEFAULT_COUNT = 6;

/**
 * Matches the real PlanCard layout: header (name + status), description,
 * 3-stat row, meta row (date + creator avatar), 3-button action row.
 */
export function PlanListSkeleton({ count = DEFAULT_COUNT }: { count?: number }) {
  return (
    <div className="plan-grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            minHeight: 260,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Skeleton width={200} height={20} borderRadius={6} />
              <SkeletonBadge />
            </div>
            <SkeletonText lines={2} lastLineWidth="75%" />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {[0, 1, 2].map((k) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                }}
              >
                <Skeleton width={28} height={28} borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <Skeleton
                    width={24}
                    height={14}
                    borderRadius={4}
                    style={{ marginBottom: 4 }}
                  />
                  <Skeleton width={48} height={10} borderRadius={4} />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Skeleton width={120} height={14} borderRadius={4} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SkeletonAvatar size={20} />
              <Skeleton width={80} height={12} borderRadius={4} />
            </div>
          </div>

          <div
            style={{ display: "flex", gap: 8, marginTop: "auto" }}
          >
            <SkeletonButton width="33%" height={34} />
            <SkeletonButton width="33%" height={34} />
            <SkeletonButton width="33%" height={34} />
          </div>
        </div>
      ))}
    </div>
  );
}
