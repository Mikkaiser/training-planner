import { Flag } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function TrainingPlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Plan"
        subtitle={`Timeline view (plan id: ${params.id})`}
        actionLabel="Add Phase to Plan"
        actionIcon={<Flag className="h-5 w-5" />}
      />
      <GlassCard className="p-4">
        <div className="text-sm text-[rgba(244,253,217,0.65)]">
          This will become the horizontally-scrollable Gantt timeline (phases + gate markers),
          with a right-side sheet for phase details.
        </div>
      </GlassCard>
    </div>
  );
}

