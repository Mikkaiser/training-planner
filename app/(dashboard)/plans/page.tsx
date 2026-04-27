import { PageHeader } from "@/components/layout/page-header";
import { PlansList } from "@/components/training-plans/plans-list";

export default function PlansPage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader
        title="Plans"
        subtitle="Manage and track your WorldSkills training roadmaps"
        actionLabel="+ New plan"
        actionHref="/plans/new"
      />
      <PlansList />
    </div>
  );
}

