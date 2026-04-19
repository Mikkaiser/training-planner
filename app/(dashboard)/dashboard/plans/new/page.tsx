import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function NewTrainingPlanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Training Plan"
        subtitle="Create a new roadmap for WorldSkills training."
      />
      <GlassCard variant="strong">
        <h2 className="text-sm font-medium text-tp-primary">Coming soon</h2>
        <p className="mt-2 text-sm text-tp-secondary">
          Plan creation and editing will be available here.
        </p>
      </GlassCard>
    </div>
  );
}
