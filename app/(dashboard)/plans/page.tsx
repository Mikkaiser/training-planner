import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Plans"
        subtitle="Create and manage visual roadmaps for WorldSkills training."
        actionLabel="New Training Plan"
      />

      <GlassCard className="p-4">
        <div className="text-sm text-[rgba(244,253,217,0.65)]">
          This will become the plans card grid (with status badges + phase count).
        </div>
      </GlassCard>
    </div>
  );
}

