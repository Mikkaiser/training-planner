"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { PlanListSkeleton } from "@/components/shared/skeletons";
import { PlanCard } from "@/components/training-plans/plan-card";
import { PlansEmptyState } from "@/components/training-plans/plans-empty-state";
import { useDeleteTrainingPlan } from "@/lib/hooks/use-delete-training-plan";
import { useTrainingPlans } from "@/lib/hooks/use-training-plans";

export function PlansList() {
  const { data, isLoading, isError, error } = useTrainingPlans();
  const removeMutation = useDeleteTrainingPlan();
  const [filter, setFilter] = useState<"all" | "shared" | "personal">("all");

  if (isLoading) {
    return <PlanListSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        Failed to load plans: {error instanceof Error ? error.message : "Unknown error."}
      </div>
    );
  }

  const plans = data ?? [];
  const filteredPlans =
    filter === "all" ? plans : plans.filter((plan) => plan.plan_type === filter);

  if (!plans.length) {
    return <PlansEmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="plan-filter-bar">
        {(["all", "shared", "personal"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`plan-filter-bar__item ${filter === value ? "plan-filter-bar__item--active" : ""}`}
            onClick={() => setFilter(value)}
          >
            {value === "all" ? "All Plans" : value === "shared" ? "Shared" : "Personal"}
          </button>
        ))}
      </div>

      {filteredPlans.length ? (
        <div className="plan-grid">
          <AnimatePresence initial={false}>
            {filteredPlans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
              >
                <PlanCard
                  plan={plan}
                  onDelete={() => removeMutation.mutate(plan.id)}
                  deleting={removeMutation.isPending && removeMutation.variables === plan.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--color-surface-raised)] p-6 text-sm text-tp-secondary">
          No plans match this filter.
        </div>
      )}
    </div>
  );
}
