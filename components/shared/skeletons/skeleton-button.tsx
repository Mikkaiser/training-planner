import * as React from "react";

import { Skeleton } from "./skeleton";

export interface SkeletonButtonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonButton({
  width = 120,
  height = 40,
  className,
}: SkeletonButtonProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={8}
      className={className}
    />
  );
}
