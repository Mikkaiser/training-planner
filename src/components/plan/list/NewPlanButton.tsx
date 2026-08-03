"use client";

import { useState } from "react";
import { PlanCreateModal } from "@/components/plan/PlanCreateModal";
import { PlusIcon } from "@/components/ui/icons";
import type { PlanSummaryVM } from "@/lib/plan-view-model";

export function NewPlanButton({ templates }: { templates: PlanSummaryVM[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="tp-btn tp-btn-primary" onClick={() => setOpen(true)}>
        <PlusIcon size={12} />
        New Plan
      </button>
      <PlanCreateModal open={open} onClose={() => setOpen(false)} templates={templates} />
    </>
  );
}
