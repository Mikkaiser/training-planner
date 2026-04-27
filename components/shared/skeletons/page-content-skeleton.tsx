import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonCard } from "./skeleton-card";
import { SkeletonText } from "./skeleton-text";

export function PageContentSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-[30px]" aria-hidden>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Skeleton width={240} height={28} borderRadius={10} />
        <Skeleton width={420} height={16} borderRadius={8} />
      </div>

      <SkeletonCard>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton width={160} height={18} borderRadius={8} />
          <SkeletonText lines={rows} lastLineWidth="70%" />
        </div>
      </SkeletonCard>
    </div>
  );
}

