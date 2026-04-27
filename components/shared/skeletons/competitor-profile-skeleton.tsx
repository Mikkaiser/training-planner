import { Skeleton } from "@/components/shared/skeletons/skeleton";

export function CompetitorProfileSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="rounded-2xl border border-border bg-[var(--color-surface-raised)] p-6">
        <Skeleton width={140} height={14} borderRadius={6} />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton width={64} height={64} borderRadius="999px" />
          <div className="space-y-2">
            <Skeleton width={220} height={28} borderRadius={8} />
            <Skeleton width={180} height={14} borderRadius={6} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton-card space-y-3">
          <Skeleton width={160} height={20} borderRadius={8} />
          <Skeleton width="80%" height={14} borderRadius={6} />
          <Skeleton width="65%" height={14} borderRadius={6} />
          <Skeleton width={120} height={34} borderRadius={8} />
        </div>
        <div className="skeleton-card space-y-3">
          <Skeleton width={120} height={20} borderRadius={8} />
          <Skeleton width="92%" height={14} borderRadius={6} />
          <Skeleton width="75%" height={14} borderRadius={6} />
          <Skeleton width="80%" height={14} borderRadius={6} />
        </div>
      </div>

      <div className="skeleton-card space-y-3">
        <Skeleton width={140} height={20} borderRadius={8} />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} width="100%" height={44} borderRadius={8} />
        ))}
      </div>
    </div>
  );
}
