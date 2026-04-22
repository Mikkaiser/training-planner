"use client";

import { PhasePickerCreateForm } from "@/components/training-plans/phase-picker-create-form";
import type { Phase, Subcompetence } from "@/lib/training-plans/types";

type PhasePickerCreateTabProps = {
  subcompetences: Subcompetence[];
  createdBy: string;
  planPhaseCount: number;
  creating: boolean;
  onCreatingChange: (value: boolean) => void;
  onCreated: (phase: Phase) => Promise<void> | void;
  onCreatedDone: () => void;
};

export function PhasePickerCreateTab({
  subcompetences,
  createdBy,
  planPhaseCount,
  creating,
  onCreatingChange,
  onCreated,
  onCreatedDone,
}: PhasePickerCreateTabProps): React.JSX.Element {
  return (
    <PhasePickerCreateForm
      subcompetences={subcompetences}
      createdBy={createdBy}
      planPhaseCount={planPhaseCount}
      creating={creating}
      onCreatingChange={onCreatingChange}
      onCreated={onCreated}
      onCreatedDone={onCreatedDone}
    />
  );
}

