import { Skeleton } from "@/components/shared/skeletons/skeleton";

const DEFAULT_COUNT = 6;

export function CompetitorsListingSkeleton({ count = DEFAULT_COUNT }: { count?: number }) {
  return (
    <div className="plan-grid" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card min-h-[260px] space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton width={44} height={44} borderRadius="999px" />
            <div className="flex-1 space-y-2">
              <Skeleton width="45%" height={16} borderRadius={6} />
              <Skeleton width="65%" height={12} borderRadius={4} />
            </div>
          </div>

          <Skeleton width="72%" height={24} borderRadius={999} />
          <Skeleton width="82%" height={14} borderRadius={6} />

          <div className="mt-auto flex gap-2 pt-3">
            <Skeleton width="34%" height={34} borderRadius={8} />
            <Skeleton width="34%" height={34} borderRadius={8} />
            <Skeleton width="32%" height={34} borderRadius={8} />
          </div>
        </div>
      ))}
    </div>
  );
}
