import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function DashboardNewPhasePage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader
        title="New Phase"
        subtitle="Create a reusable phase template."
        actionLabel="Back to phases"
        actionHref="/dashboard/phases"
      />
      <GlassCard>
        <div className="text-sm text-tp-secondary">
          Phase creation form will live here.
        </div>
      </GlassCard>
    </div>
  );
}

