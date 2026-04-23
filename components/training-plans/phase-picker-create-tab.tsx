"use client";

import { PhasePickerCreateForm } from "@/components/training-plans/phase-picker-create-form";
import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { Phase, Subcompetence } from "@/lib/training-plans/types";

type PhasePickerCreateTabProps = {
  subcompetences: Subcompetence[];
  createdBy: string;
  planPhaseCount: number;
  planColor: PlanColorKey;
  creating: boolean;
  onCancel: () => void;
  onUnsavedChange: (hasUnsavedChanges: boolean) => void;
  onCreatingChange: (value: boolean) => void;
  onCreated: (phase: Phase) => Promise<void> | void;
  onCreatedDone: () => void;
};

export function PhasePickerCreateTab({
  subcompetences,
  createdBy,
  planPhaseCount,
  planColor,
  creating,
  onCancel,
  onUnsavedChange,
  onCreatingChange,
  onCreated,
  onCreatedDone,
}: PhasePickerCreateTabProps): React.JSX.Element {
  return (
    <PhasePickerCreateForm
      subcompetences={subcompetences}
      createdBy={createdBy}
      planPhaseCount={planPhaseCount}
      planColor={planColor}
      creating={creating}
      onCancel={onCancel}
      onUnsavedChange={onUnsavedChange}
      onCreatingChange={onCreatingChange}
      onCreated={onCreated}
      onCreatedDone={onCreatedDone}
    />
  );
}

