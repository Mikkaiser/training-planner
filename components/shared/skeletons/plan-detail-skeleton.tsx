import * as React from "react";

import { Skeleton } from "./skeleton";
import { SkeletonAvatar } from "./skeleton-avatar";
import { SkeletonBadge } from "./skeleton-badge";
import { SkeletonButton } from "./skeleton-button";
import { SkeletonCard } from "./skeleton-card";
import { SkeletonText } from "./skeleton-text";

/**
 * Full-page skeleton for /dashboard/plans/[id]. Mirrors the real layout:
 * sticky 64px header, 42/58 roadmap/detail split, both columns independently
 * scrollable. Kept inside `.plan-detail-root` so it inherits the same
 * full-bleed flex sizing as the loaded page.
 */
export function PlanDetailSkeleton() {
  return (
    <div
      className="plan-detail-root"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}
      aria-hidden
    >
      <HeaderBar />

      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <RoadmapSkeleton />
        <DetailPanelSkeleton />
      </div>
    </div>
  );
}

function HeaderBar() {
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

function RoadmapSkeleton() {
  return (
    <div className="plan-roadmap-column">
      <div className="plan-roadmap-column__scroll">
        {/* Competitor legend bar */}
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
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <SkeletonAvatar size={28} />
              <Skeleton width={56} height={12} borderRadius={4} />
            </div>
          ))}
          <div style={{ marginLeft: "auto" }}>
            <SkeletonButton width={110} height={28} />
          </div>
        </div>

        {/* Two phase blocks */}
        {[0, 1].map((p) => (
          <div key={p} style={{ display: "flex", flexDirection: "column" }}>
            {/* Phase header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 48,
                padding: "0 20px",
                background:
                  "linear-gradient(180deg, var(--color-accent-muted), transparent)",
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

            {/* 3 block rows + 1 gate row */}
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
                    <Skeleton
                      key={d}
                      width={14}
                      height={14}
                      borderRadius="50%"
                    />
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

function DetailPanelSkeleton() {
  return (
    <div className="plan-detail-column">
      <div className="plan-detail-column__scroll">
        <div
          className="plan-detail-column__content"
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          {/* Block header */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Skeleton width={28} height={28} borderRadius={6} />
              <Skeleton width={220} height={24} borderRadius={6} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonBadge />
              <SkeletonBadge width={90} />
            </div>
            <SkeletonText lines={3} lastLineWidth="55%" />
          </div>

          {/* Competitor status section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton width={180} height={18} borderRadius={4} />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <SkeletonAvatar size={32} />
                <Skeleton width={120} height={14} borderRadius={4} />
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <SkeletonBadge />
                  <SkeletonBadge width={48} />
                </div>
              </div>
            ))}
          </div>

          {/* Gate card */}
          <SkeletonCard
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width={160} height={16} borderRadius={4} />
              <div style={{ marginLeft: "auto" }}>
                <SkeletonBadge width={48} />
              </div>
            </div>
            <SkeletonText lines={2} />
            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonButton width={140} />
              <SkeletonButton width={120} />
            </div>
          </SkeletonCard>

          {/* Exercises section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton width={140} height={18} borderRadius={4} />
            {[0, 1].map((i) => (
              <SkeletonCard
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 16,
                }}
              >
                <Skeleton width={32} height={32} borderRadius={6} />
                <div style={{ flex: 1 }}>
                  <Skeleton
                    width="55%"
                    height={14}
                    borderRadius={4}
                    style={{ marginBottom: 6 }}
                  />
                  <SkeletonText lines={1} lastLineWidth="80%" />
                </div>
                <SkeletonBadge width={72} />
                <SkeletonButton width={100} height={32} />
              </SkeletonCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
