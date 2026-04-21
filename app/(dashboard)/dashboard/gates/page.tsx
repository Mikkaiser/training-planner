import { PageHeader } from "@/components/layout/page-header";
import { GatesManager } from "@/components/gates/gates-manager";

export default function GatesPage() {
  return (
    <div className="space-y-[30px]">
      <PageHeader
        title="Gates"
        subtitle="Block gates and phase gates with assessments."
      />
      <GatesManager />
    </div>
  );
}
