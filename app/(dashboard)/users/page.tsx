import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Admin-only: manage instructor/admin roles." />
      <GlassCard className="p-4">
        <div className="text-sm text-[rgba(244,253,217,0.65)]">
          Users table + inline role select will live here.
        </div>
      </GlassCard>
    </div>
  );
}

