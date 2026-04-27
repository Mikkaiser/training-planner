import { Skeleton, SkeletonText } from "@/components/shared/skeletons";

export default function DashboardSegmentLoading() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
      aria-hidden
    >
      {/* Sidebar shell */}
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
        <aside className="relative z-10 flex h-full flex-col px-4 py-6">
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
        </aside>
      </div>

      {/* Main shell */}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Skeleton width={240} height={28} borderRadius={10} />
            <Skeleton width={420} height={16} borderRadius={8} />
          </div>

          <div style={{ marginTop: 28 }}>
            <Skeleton width="100%" height={240} borderRadius={18} />
          </div>
        </div>
      </main>
    </div>
  );
}

