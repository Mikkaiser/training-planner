import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function NewSubcompetencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Subcompetence"
        subtitle="Add a macro-competence for tagging and colors."
      />
      <GlassCard variant="strong">
        <h2 className="text-sm font-medium text-tp-primary">Coming soon</h2>
        <p className="mt-2 text-sm text-tp-secondary">
          Subcompetence creation will be available here.
        </p>
      </GlassCard>
    </div>
  );
}
