import * as React from "react";

import { Skeleton } from "./skeleton";

export interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

export function SkeletonAvatar({
  size = 32,
  className,
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
      style={{ flexShrink: 0 }}
    />
  );
}
