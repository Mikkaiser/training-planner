import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonAvatar } from "./skeleton-avatar";
import { SkeletonBadge } from "./skeleton-badge";
import { SkeletonButton } from "./skeleton-button";
import { SkeletonCard } from "./skeleton-card";
import { SkeletonText } from "./skeleton-text";

/**
 * Matches the Users admin view: header + table-like rows.
 */
export function UsersSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
      aria-hidden
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={160} height={24} borderRadius={6} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Skeleton width={220} height={34} borderRadius={10} />
          <SkeletonButton width={120} height={34} />
        </div>
      </div>

      <SkeletonCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Skeleton width={220} height={14} borderRadius={6} />
            <Skeleton width={160} height={14} borderRadius={6} />
            <Skeleton width={120} height={14} borderRadius={6} />
            <div style={{ marginLeft: "auto" }}>
              <Skeleton width={80} height={14} borderRadius={6} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)",
              }}
            >
              <SkeletonAvatar size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="40%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                <SkeletonText lines={1} lastLineWidth="55%" />
              </div>
              <SkeletonBadge width={70} />
              <SkeletonButton width={96} height={32} />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
