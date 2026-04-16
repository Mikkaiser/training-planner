import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function PhasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Phases" subtitle="Define phase templates with topics and gates." actionLabel="New Phase" />
      <GlassCard className="p-4">
        <div className="text-sm text-[rgba(244,253,217,0.65)]">
          Phase CRUD (topics + gates) will live here.
        </div>
      </GlassCard>
    </div>
  );
}

