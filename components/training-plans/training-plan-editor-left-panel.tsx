"use client";

import * as React from "react";

import type { SensorDescriptor } from "@dnd-kit/core";

import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { Phase, PlanDraft, PlanPhaseRef, Subcompetence, TrainingPlanStatus } from "@/lib/training-plans/types";
import type { TrainingPlanEditorSaveState } from "./training-plan-editor-widgets";
import { TrainingPlanEditorForm } from "./training-plan-editor-form";
import { TrainingPlanEditorLeftHeader } from "./training-plan-editor-left-header";
import { TrainingPlanEditorPhases } from "./training-plan-editor-phases";

export interface TrainingPlanEditorLeftPanelProps {
  autoState: TrainingPlanEditorSaveState;
  autoCanSave: boolean;
  autoErrorMessage: string | null;
  draft: PlanDraft;
  expanded: Record<string, boolean>;
  existingDisabled: Set<string>;
  phases: Phase[];
  phaseRefs: PlanPhaseRef[];
  profileId: string | null;
  personalContext: { id: string; full_name: string; avatar_color: string | null } | null;
  sensors: SensorDescriptor<Record<string, unknown>>[];
  subcompetences: Subcompetence[];
  onAddExistingPhase: (phase: Phase) => void;
  onUpdatePhase: (phase: Phase) => void;
  onChangeDescription: (value: string) => void;
  onChangeName: (value: string) => void;
  onChangeStartDate: (value: string) => void;
  onChangeStatus: (value: TrainingPlanStatus) => void;
  onPickColor: (color: PlanColorKey) => void;
  onAssignCompetitor: (competitorId: string | null) => void;
  onRemovePhase: (phaseId: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onSave: () => void;
  onToggleExpanded: (phaseId: string) => void;
}

export function TrainingPlanEditorLeftPanel({
  autoCanSave,
  autoErrorMessage,
  autoState,
  draft,
  expanded,
  existingDisabled,
  phases,
  phaseRefs,
  profileId,
  personalContext,
  sensors,
  subcompetences,
  onAddExistingPhase,
  onUpdatePhase,
  onChangeDescription,
  onChangeName,
  onChangeStartDate,
  onChangeStatus,
  onPickColor,
  onAssignCompetitor,
  onRemovePhase,
  onReorder,
  onSave,
  onToggleExpanded,
}: TrainingPlanEditorLeftPanelProps): React.JSX.Element {
  return (
    <div className="tp-plan-left">
      <TrainingPlanEditorLeftHeader
        planId={draft.id}
        planName={draft.name}
        autoState={autoState}
        autoCanSave={autoCanSave}
        autoErrorMessage={autoErrorMessage}
        onSave={onSave}
      />

      <div className="tp-plan-left-body">
        <TrainingPlanEditorForm
          draft={draft}
          personalContext={personalContext}
          onChangeDescription={onChangeDescription}
          onChangeName={onChangeName}
          onChangeStartDate={onChangeStartDate}
          onChangeStatus={onChangeStatus}
          onPickColor={onPickColor}
          onAssignCompetitor={onAssignCompetitor}
        />

        <TrainingPlanEditorPhases
          expanded={expanded}
          existingDisabled={existingDisabled}
          phases={phases}
          phaseRefs={phaseRefs}
          profileId={profileId}
          sensors={sensors}
          subcompetences={subcompetences}
          planColor={draft.color}
          onAddExistingPhase={onAddExistingPhase}
          onUpdatePhase={onUpdatePhase}
          onRemovePhase={onRemovePhase}
          onReorder={onReorder}
          onToggleExpanded={onToggleExpanded}
        />
      </div>
    </div>
  );
}

