"use client";

import { AddEditCompetitorDialog } from "@/components/competitors/add-edit-competitor-dialog";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";

export function AddCompetitorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { planId } = usePlanDetailContext();
  return (
    <AddEditCompetitorDialog
      mode="add"
      open={open}
      onOpenChange={onOpenChange}
      defaultPlanId={planId}
    />
  );
}
