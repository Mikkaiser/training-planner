import { PageHeader } from "@/components/layout/page-header";
import { CompetitorsList } from "@/components/competitors/competitors-list";

export default function CompetitorsPage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader
        title="Competitors"
        subtitle="Manage competitors and their training plans"
      />
      <CompetitorsList />
    </div>
  );
}
