import * as React from "react";

import { cn } from "@/lib/utils";

export interface SkeletonCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Extra padding override if a specific card needs a custom one */
  padding?: string | number;
}

/**
 * Full glass card placeholder matching the app's card style. Theming is done
 * in `.skeleton-card` (globals.css) — light vs dark backgrounds + borders.
 */
export function SkeletonCard({
  children,
  className,
  padding,
  style,
  ...rest
}: SkeletonCardProps) {
  return (
    <div
      aria-hidden
      className={cn("skeleton-card", className)}
      style={{
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
