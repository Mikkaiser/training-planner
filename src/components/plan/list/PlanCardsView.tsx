import { PlanCard } from "@/components/plan/list/PlanCard";
import type { PlanSummaryVM } from "@/lib/plan-view-model";

/** Design artboard: list-v1 "Card grid" — two columns, 18px gutter. */
export function PlanCardsView({ plans }: { plans: PlanSummaryVM[] }) {
  if (plans.length === 0) {
    return (
      <div className="tp-card" style={{ padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>No plans match those filters.</div>
        <div className="tp-mut tp-sm tp-mt-2">Clear the search or pick a different phase.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 18 }}>
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
