import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function SubcompetencesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subcompetences"
        subtitle="Macro-competences used to color and tag plans, phases, and exercises."
        actionLabel="New Subcompetence"
      />
      <GlassCard className="p-4">
        <div className="text-sm text-[rgba(244,253,217,0.65)]">
          Subcompetence CRUD grid (icon + color picker) will live here.
        </div>
      </GlassCard>
    </div>
  );
}

