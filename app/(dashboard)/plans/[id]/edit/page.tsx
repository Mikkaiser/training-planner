import { TrainingPlanEditor } from "@/components/training-plans/training-plan-editor";

export default function TrainingPlanEditPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TrainingPlanEditor planId={params.id} />
    </div>
  );
}

