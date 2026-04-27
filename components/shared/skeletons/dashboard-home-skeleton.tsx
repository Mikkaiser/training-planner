import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonCard } from "./skeleton-card";
import { SkeletonText } from "./skeleton-text";

export function DashboardHomeSkeleton() {
  return (
    <div className="space-y-[30px]" aria-hidden>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Skeleton width={180} height={28} borderRadius={10} />
        <Skeleton width={360} height={16} borderRadius={8} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard
            key={i}
            padding="25px 30px"
            style={{ borderRadius: 18 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Skeleton width={110} height={14} borderRadius={6} />
              <Skeleton width={30} height={30} borderRadius={10} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Skeleton width={90} height={34} borderRadius={10} />
            </div>
          </SkeletonCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SkeletonCard
          padding="25px 30px"
          style={{ borderRadius: 18 }}
          className="lg:col-span-2"
        >
          <Skeleton width={220} height={18} borderRadius={8} />
          <div style={{ marginTop: 10 }}>
            <SkeletonText lines={2} lastLineWidth="60%" />
          </div>
        </SkeletonCard>
        <SkeletonCard padding="25px 30px" style={{ borderRadius: 18 }}>
          <Skeleton width={140} height={18} borderRadius={8} />
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Skeleton width="100%" height={55} borderRadius={13} />
            <Skeleton width="100%" height={55} borderRadius={13} />
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
