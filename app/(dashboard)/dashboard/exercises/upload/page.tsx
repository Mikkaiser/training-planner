import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function UploadExercisePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Exercise"
        subtitle="Attach PDF or DOCX exercises to topics."
      />
      <GlassCard variant="strong">
        <h2 className="text-sm font-medium text-tp-primary">Coming soon</h2>
        <p className="mt-2 text-sm text-tp-secondary">
          File upload and metadata will be available here.
        </p>
      </GlassCard>
    </div>
  );
}
