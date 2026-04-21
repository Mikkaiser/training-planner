import * as React from "react";

import { Skeleton } from "./skeleton";

export interface SkeletonBadgeProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonBadge({
  width = 64,
  height = 22,
  className,
}: SkeletonBadgeProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={999}
      className={className}
    />
  );
}
