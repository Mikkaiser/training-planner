import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function GatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gates"
        subtitle="Block gates and phase gates with assessments."
      />
      <GlassCard className="p-4">
        <div className="text-sm text-[rgba(244,253,217,0.65)]">
          Gates list (grouped by phase) + assessment uploads will live here.
        </div>
      </GlassCard>
    </div>
  );
}

