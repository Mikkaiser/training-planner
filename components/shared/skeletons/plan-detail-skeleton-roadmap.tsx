import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonAvatar } from "./skeleton-avatar";
import { SkeletonBadge } from "./skeleton-badge";
import { SkeletonButton } from "./skeleton-button";

export function PlanDetailSkeletonRoadmap(): React.JSX.Element {
  return (
    <div className="plan-roadmap-column">
      <div className="plan-roadmap-column__scroll">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SkeletonAvatar size={28} />
              <Skeleton width={56} height={12} borderRadius={4} />
            </div>
          ))}
          <div style={{ marginLeft: "auto" }}>
            <SkeletonButton width={110} height={28} />
          </div>
        </div>

        {[0, 1].map((p) => (
          <div key={p} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 48,
                padding: "0 20px",
                background: "linear-gradient(180deg, var(--color-accent-muted), transparent)",
                borderBottom: "1px solid var(--color-border-subtle)",
              }}
            >
              <Skeleton width={18} height={18} borderRadius={4} />
              <Skeleton width={160} height={16} borderRadius={4} />
              <SkeletonBadge width={44} height={20} />
              <div style={{ flex: 1, marginLeft: 12 }}>
                <Skeleton width="100%" height={6} borderRadius={999} />
              </div>
            </div>

            {[0, 1, 2].map((b) => (
              <div
                key={b}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <Skeleton width={40} height={40} borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <Skeleton
                    width="60%"
                    height={14}
                    borderRadius={4}
                    style={{ marginBottom: 6 }}
                  />
                  <SkeletonBadge width={80} height={18} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map((d) => (
                    <Skeleton key={d} width={14} height={14} borderRadius="50%" />
                  ))}
                </div>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px 10px 48px",
                borderBottom: "1px solid var(--color-border-subtle)",
              }}
            >
              <Skeleton width={16} height={16} borderRadius={4} />
              <Skeleton width="50%" height={12} borderRadius={4} />
              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                {[0, 1, 2].map((c) => (
                  <SkeletonBadge key={c} width={28} height={18} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

