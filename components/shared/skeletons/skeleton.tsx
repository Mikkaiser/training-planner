import * as React from "react";

import { cn } from "@/lib/utils";

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

/**
 * Base shimmer block. The shimmer animation + background gradient live in
 * `.skeleton-shimmer` (globals.css) so light/dark theming stays in CSS and
 * the component stays dependency-free.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 8,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("skeleton-shimmer", className)}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      {...rest}
    />
  );
}
