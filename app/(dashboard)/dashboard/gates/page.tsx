import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function GatesPage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader
        title="Gates"
        subtitle="Block gates and phase gates with assessments."
      />
      <GlassCard>
        <div className="text-sm text-tp-secondary">
          Gates list (grouped by phase) + assessment uploads will live here.
        </div>
      </GlassCard>
    </div>
  );
}

