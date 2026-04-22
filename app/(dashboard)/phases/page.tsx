import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function PhasesPage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader
        title="Phases"
        subtitle="Define phase templates with topics and gates."
        actionLabel="New Phase"
        actionHref="/phases/new"
      />
      <GlassCard>
        <div className="text-sm text-tp-secondary">
          Phase CRUD (topics + gates) will live here.
        </div>
      </GlassCard>
    </div>
  );
}

