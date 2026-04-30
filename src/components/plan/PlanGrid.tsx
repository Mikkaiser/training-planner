"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlanCard } from "@/components/plan/PlanCard";
import { PlanCreateModal } from "@/components/plan/PlanCreateModal";
import type { PlanWithPhases } from "@/lib/types";

interface PlanGridProps {
  plans: PlanWithPhases[];
}

export function PlanGrid({ plans }: PlanGridProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="tp-shell" style={{ padding: "28px 24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <p className="tp-mono" style={{ margin: 0, color: "var(--ink-2)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              WorldSkills · SD
            </p>
            <h1 style={{ margin: "8px 0", fontSize: "46px", letterSpacing: "-0.03em" }}>Training Plans</h1>
            <p style={{ margin: 0, color: "var(--ink-2)" }}>{plans.length} active competitors · 1 draft</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>New Plan</Button>
        </div>

        <div style={{ marginTop: "24px", display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      <PlanCreateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
