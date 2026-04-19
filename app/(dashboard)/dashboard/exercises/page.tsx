import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function ExercisesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Exercises"
        subtitle="Upload PDF/DOCX exercises and attach them to topics."
        actionLabel="Upload Exercise"
        actionHref="/dashboard/exercises/upload"
      />
      <GlassCard>
        <div className="text-sm text-tp-secondary">
          Exercise table + upload modal will live here.
        </div>
      </GlassCard>
    </div>
  );
}

