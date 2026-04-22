import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function NewPhasePage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader title="New Phase" subtitle="Define a phase template with topics and gates." />
      <GlassCard variant="strong">
        <h2 className="text-sm font-medium text-tp-primary">Coming soon</h2>
        <p className="mt-2 text-sm text-tp-secondary">
          Phase creation will be available here.
        </p>
      </GlassCard>
    </div>
  );
}

