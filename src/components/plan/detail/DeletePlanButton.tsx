"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlan } from "@/actions/plans";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { APP_ROUTES } from "@/lib/routes";
import { describePlanContents, type PlanVM } from "@/lib/plan-view-model";

/**
 * Removing a whole plan is deliberately understated: it sits at the foot of the
 * roadmap rather than in the header, so it is never adjacent to the controls an
 * instructor uses every day.
 */
export function DeletePlanButton({ plan }: { plan: PlanVM }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="tp-reveal-host" style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
      <ConfirmButton
        className="tp-btn tp-btn-ghost tp-btn-sm tp-reveal"
        label="Remove this plan"
        ariaLabel={`Remove plan ${plan.title}`}
        title={`Remove "${plan.title}"?`}
        body={`This deletes ${plan.studentName}'s plan and everything in it. ${describePlanContents(plan.totals)}. It cannot be undone.`}
        confirmLabel="Remove plan"
        disabled={pending}
        onConfirm={() =>
          startTransition(async () => {
            await deletePlan(plan.id);
            router.push(APP_ROUTES.home);
            router.refresh();
          })
        }
      />
    </div>
  );
}
