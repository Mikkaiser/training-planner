import { PlanDetailView } from "@/components/plan-detail/plan-detail-view";

export default function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <PlanDetailView planId={params.id} />;
}

