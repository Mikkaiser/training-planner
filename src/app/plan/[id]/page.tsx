import { TopBar } from "@/components/layout/TopBar";
import { PlanDetail } from "@/components/plan/PlanDetail";
import { getInstructorName, getPlanByIdForCurrentInstructor } from "@/lib/plan-data";
import { getPlanProgress } from "@/lib/utils";

interface PlanPageProps {
  params: { id: string };
}

export default async function PlanPage({ params }: PlanPageProps) {
  const [plan, instructorName] = await Promise.all([
    getPlanByIdForCurrentInstructor(params.id),
    getInstructorName(),
  ]);

  return (
    <main className="tp-page">
      <TopBar
        instructorName={instructorName}
        mode="detail"
        title={plan.student_name}
        subtitle={plan.title}
        progress={getPlanProgress(plan)}
      />
      <PlanDetail plan={plan} />
    </main>
  );
}
