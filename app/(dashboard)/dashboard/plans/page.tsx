import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Plans"
        subtitle="Create and manage visual roadmaps for WorldSkills training."
        actionLabel="New Training Plan"
        actionHref="/dashboard/plans/new"
      />

      <GlassCard>
        <div className="text-sm text-tp-secondary">
          This will become the plans card grid (with status badges + phase count).
        </div>
      </GlassCard>
    </div>
  );
}

