import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function UsersPage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader title="Users" subtitle="Admin-only: manage instructor/admin roles." />
      <GlassCard>
        <div className="text-sm text-tp-secondary">
          Users table + inline role select will live here.
        </div>
      </GlassCard>
    </div>
  );
}

