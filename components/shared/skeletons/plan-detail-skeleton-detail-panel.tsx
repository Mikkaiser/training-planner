import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonAvatar } from "./skeleton-avatar";
import { SkeletonBadge } from "./skeleton-badge";
import { SkeletonButton } from "./skeleton-button";
import { SkeletonCard } from "./skeleton-card";
import { SkeletonText } from "./skeleton-text";

export function PlanDetailSkeletonDetailPanel(): React.JSX.Element {
  return (
    <div className="plan-detail-column">
      <div className="plan-detail-column__scroll">
        <div
          className="plan-detail-column__content"
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Skeleton width={28} height={28} borderRadius={6} />
              <Skeleton width={220} height={24} borderRadius={6} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonBadge />
              <SkeletonBadge width={90} />
            </div>
            <SkeletonText lines={3} lastLineWidth="55%" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton width={180} height={18} borderRadius={4} />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <SkeletonAvatar size={32} />
                <Skeleton width={120} height={14} borderRadius={4} />
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <SkeletonBadge />
                  <SkeletonBadge width={48} />
                </div>
              </div>
            ))}
          </div>

          <SkeletonCard style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width={160} height={16} borderRadius={4} />
              <div style={{ marginLeft: "auto" }}>
                <SkeletonBadge width={48} />
              </div>
            </div>
            <SkeletonText lines={2} />
            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonButton width={140} />
              <SkeletonButton width={120} />
            </div>
          </SkeletonCard>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton width={140} height={18} borderRadius={4} />
            {[0, 1].map((i) => (
              <SkeletonCard
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 16,
                }}
              >
                <Skeleton width={32} height={32} borderRadius={6} />
                <div style={{ flex: 1 }}>
                  <Skeleton
                    width="55%"
                    height={14}
                    borderRadius={4}
                    style={{ marginBottom: 6 }}
                  />
                  <SkeletonText lines={1} lastLineWidth="80%" />
                </div>
                <SkeletonBadge width={72} />
                <SkeletonButton width={100} height={32} />
              </SkeletonCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

