import { TopBar } from "@/components/layout/TopBar";
import { PlanGrid } from "@/components/plan/PlanGrid";
import { getInstructorName, getPlansForCurrentInstructor } from "@/lib/plan-data";

export default async function PlanListPage() {
  const [plans, instructorName] = await Promise.all([getPlansForCurrentInstructor(), getInstructorName()]);

  return (
    <main className="tp-page">
      <TopBar instructorName={instructorName} mode="list" />
      <PlanGrid plans={plans} />
    </main>
  );
}
