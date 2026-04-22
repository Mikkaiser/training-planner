import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonBadge } from "./skeleton-badge";
import { SkeletonButton } from "./skeleton-button";

export function PlanDetailSkeletonHeaderBar(): React.JSX.Element {
  return (
    <div className="plan-detail-header">
      <div className="plan-detail-header__left" style={{ gap: 12 }}>
        <Skeleton width={54} height={14} borderRadius={4} />
        <span className="plan-detail-header__separator">/</span>
        <Skeleton width={180} height={18} borderRadius={4} />
        <SkeletonBadge />
      </div>
      <div className="plan-detail-header__right" style={{ display: "flex", gap: 10 }}>
        <SkeletonButton width={140} height={34} />
        <SkeletonButton width={110} height={34} />
      </div>
    </div>
  );
}

