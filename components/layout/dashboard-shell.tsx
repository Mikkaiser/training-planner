"use client";

import * as React from "react";

import BackgroundBlobs from "@/components/layout/background-blobs";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Skeleton, SkeletonText } from "@/components/shared/skeletons";
import { useDashboardProfile } from "@/lib/hooks/use-dashboard-profile";

function SidebarNavSkeleton() {
  return (
    <div className="relative z-10 flex h-full flex-col px-4 py-6" aria-hidden>
      <div className="mb-7 flex flex-col items-center">
        <Skeleton width={160} height={34} borderRadius={10} />
      </div>

      <nav className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="sidebar-nav-link flex items-center gap-3 rounded-[10px]"
            style={{ padding: "12px 12px" }}
          >
            <Skeleton width={22} height={22} borderRadius={8} />
            <Skeleton width={120} height={14} borderRadius={6} />
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-5">
        <div className="mx-auto flex w-full min-w-0 items-center justify-center gap-3 px-2">
          <Skeleton width={50} height={50} borderRadius={12} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonText lines={1} lastLineWidth="70%" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useDashboardProfile();

  const role = data?.role ?? null;
  const fullName = data?.fullName ?? null;
  const email = data?.email ?? null;
  const avatarUrl = data?.avatarUrl ?? null;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackgroundBlobs />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          height: "100vh",
          width: 300,
          minWidth: 300,
          overflow: "visible",
        }}
        className="app-sidebar-glass hidden md:block"
      >
        {isLoading ? (
          <SidebarNavSkeleton />
        ) : (
          <SidebarNav
            role={role}
            fullName={fullName}
            email={email}
            avatarUrl={avatarUrl}
          />
        )}
      </div>

      <main
        style={{
          flex: 1,
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          className="mx-auto w-full max-w-[1400px] px-[45px] py-[40px]"
        >
          <MobileNav
            role={role}
            fullName={fullName}
            email={email}
            avatarUrl={avatarUrl}
          />
          {children}
        </div>
      </main>
    </div>
  );
}

