import { TrainingPlanEditor } from "@/components/training-plans/training-plan-editor";

export default function DashboardTrainingPlanEditPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="-mx-[45px] -my-[40px] flex h-full min-h-0 flex-col overflow-hidden">
      <TrainingPlanEditor planId={params.id} />
    </div>
  );
}

