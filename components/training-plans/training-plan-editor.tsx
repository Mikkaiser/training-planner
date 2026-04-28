"use client";

import { ChevronLeft, Info } from "lucide-react";

import { TrainingPlanEditorLeftPanel } from "@/components/training-plans/training-plan-editor-left-panel";
import { TrainingPlanEditorPreview } from "@/components/training-plans/training-plan-editor-preview";
import { useTrainingPlanEditorState } from "@/lib/hooks/use-training-plan-editor-state";

export function TrainingPlanEditor({ planId }: { planId?: string }): React.JSX.Element {
  const state = useTrainingPlanEditorState(planId);

  return (
    <div className="tp-plan-editor" style={state.editorStyle}>
      <div className="tp-plan-cancelbar">
        <button
          type="button"
          className="tp-plan-cancel-btn"
          onClick={state.onBackToPlans}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="tp-plan-split">
        <TrainingPlanEditorLeftPanel
          autoState={state.auto.state}
          autoCanSave={state.auto.canSave}
          autoErrorMessage={state.auto.errorMessage}
          draft={state.draft}
          expanded={state.expanded}
          existingDisabled={state.existingDisabled}
          phases={state.phases}
          phaseRefs={state.phaseRefs}
          profileId={state.profileId}
          personalContext={state.personalContext}
          sensors={state.sensors}
          subcompetences={state.subcompetences}
          onAddExistingPhase={state.onAddExistingPhase}
          onUpdatePhase={state.onUpdatePhase}
          onChangeDescription={state.onChangeDescription}
          onChangeName={state.onChangeName}
          onChangeStartDate={state.onChangeStartDate}
          onChangeStatus={state.onChangeStatus}
          onPickColor={state.onPickColor}
          onAssignCompetitor={state.onAssignCompetitor}
          onRemovePhase={state.onRemovePhase}
          onReorder={state.onReorder}
          onSave={state.onSave}
          onToggleExpanded={state.onToggleExpanded}
        />

        <TrainingPlanEditorPreview
          draftName={state.draft.name}
          orientation={state.orientation}
          phaseRefs={state.phaseRefs}
          sensors={state.sensors}
          totalWeeks={state.totalWeeks}
          onChangeOrientation={state.onChangeOrientation}
          onReorder={state.onReorder}
        />
      </div>

      <div className="tp-plan-tipbar">
        <div className="tp-plan-tip">
          <Info className="h-[13px] w-[13px]" />
          Tip: drag phases in the left list or directly in the preview to reorder.
        </div>
      </div>
    </div>
  );
}

