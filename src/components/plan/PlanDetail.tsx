import { EmptyState } from "@/components/plan/EmptyState";
import { PlanAssessments } from "@/components/assessment/PlanAssessments";
import type { SchemeOption } from "@/components/assessment/MarkTestProjectButton";
import type { PlanAssessment } from "@/lib/assessment-data";
import { DeletePlanButton } from "@/components/plan/detail/DeletePlanButton";
import { SubwayView } from "@/components/plan/detail/SubwayView";
import { TimelineView } from "@/components/plan/detail/TimelineView";
import { TreeView } from "@/components/plan/detail/TreeView";
import type { PlanVM } from "@/lib/plan-view-model";
import type { DetailView } from "@/lib/view-modes";

/**
 * Picks the presentation. All three read the same PlanVM, so a number shown in
 * one is the same number shown in the others by construction.
 */
export function PlanDetail({
  plan,
  view,
  assessments,
  schemes,
}: {
  plan: PlanVM;
  view: DetailView;
  assessments: PlanAssessment[];
  schemes: SchemeOption[];
}) {
  // A plan with no phases has nothing to lay out in any of the three shapes.
  if (plan.isEmpty) {
    return (
      <section className="tp-page-section">
        <EmptyState planId={plan.id} />
        <PlanAssessments planId={plan.id} assessments={assessments} schemes={schemes} />
        <DeletePlanButton plan={plan} />
      </section>
    );
  }

  return (
    <section className="tp-page-section">
      {view === "timeline" ? (
        <TimelineView plan={plan} />
      ) : view === "tree" ? (
        <TreeView plan={plan} />
      ) : (
        <SubwayView plan={plan} />
      )}
      {/* Outside the view switch: a competitor's marks belong to them, not to
          whichever shape the roadmap is being read in. */}
      <PlanAssessments planId={plan.id} assessments={assessments} schemes={schemes} />
      <DeletePlanButton plan={plan} />
    </section>
  );
}
