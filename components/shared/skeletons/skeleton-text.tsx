import * as React from "react";

import { Skeleton } from "./skeleton";

export interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string | number;
  className?: string;
}

/**
 * One or more lines of text placeholder. The last line uses `lastLineWidth`
 * so a paragraph doesn't look like a perfect rectangle.
 */
export function SkeletonText({
  lines = 1,
  lastLineWidth = "60%",
  className,
}: SkeletonTextProps) {
  return (
    <div className={className} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        return (
          <Skeleton
            key={i}
            height={14}
            borderRadius={4}
            width={isLast ? lastLineWidth : "100%"}
            style={{ marginBottom: isLast ? 0 : 8 }}
          />
        );
      })}
    </div>
  );
}
