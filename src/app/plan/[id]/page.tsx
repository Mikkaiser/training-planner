import { cookies } from "next/headers";
import { TopBar } from "@/components/layout/TopBar";
import { PlanDetail } from "@/components/plan/PlanDetail";
import { ViewSwitcher } from "@/components/plan/ViewSwitcher";
import { getInstructorName, getPlanByIdForCurrentInstructor } from "@/lib/plan-data";
import { buildPlanVM } from "@/lib/plan-view-model";
import {
  DETAIL_VIEWS,
  DETAIL_VIEW_COOKIE,
  DETAIL_VIEW_LABELS,
  parseDetailView,
  VIEW_PARAM,
} from "@/lib/view-modes";

// Next 14: params and searchParams are plain objects. Both become Promises in 15.
interface PlanPageProps {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function PlanPage({ params, searchParams }: PlanPageProps) {
  const view = parseDetailView(searchParams[VIEW_PARAM], cookies().get(DETAIL_VIEW_COOKIE)?.value);

  const [plan, instructorName] = await Promise.all([
    getPlanByIdForCurrentInstructor(params.id),
    getInstructorName(),
  ]);

  const vm = buildPlanVM(plan);

  return (
    <main className="tp-page">
      <TopBar
        instructorName={instructorName}
        mode="detail"
        title={vm.studentName}
        subtitle={vm.title}
        progress={vm.progress}
      >
        {/* Hidden on an empty plan: there is nothing to present three ways. */}
        {vm.isEmpty ? null : (
          <ViewSwitcher
            label="Roadmap view"
            current={view}
            cookieName={DETAIL_VIEW_COOKIE}
            options={DETAIL_VIEWS.map((value) => ({ value, label: DETAIL_VIEW_LABELS[value] }))}
          />
        )}
      </TopBar>

      <PlanDetail plan={vm} view={view} />
    </main>
  );
}
