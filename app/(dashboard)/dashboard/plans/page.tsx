import { PageHeader } from "@/components/layout/page-header";
import { PlansList } from "@/components/training-plans/plans-list";

export default function DashboardPlansPage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader
        title="Training Plans"
        subtitle="Manage and track your WorldSkills training roadmaps"
        actionLabel="New Training Plan"
        actionHref="/dashboard/plans/new"
      />
      <PlansList />
    </div>
  );
}

