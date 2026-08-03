import { EmptyState } from "@/components/plan/EmptyState";
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
export function PlanDetail({ plan, view }: { plan: PlanVM; view: DetailView }) {
  // A plan with no phases has nothing to lay out in any of the three shapes.
  if (plan.isEmpty) {
    return (
      <section className="tp-page-section">
        <EmptyState planId={plan.id} />
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
      <DeletePlanButton plan={plan} />
    </section>
  );
}
