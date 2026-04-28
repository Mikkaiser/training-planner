"use client";

import { useEffect } from "react";
import { ChevronLeft, Info } from "lucide-react";

import { TrainingPlanEditorLeftPanel } from "@/components/training-plans/training-plan-editor-left-panel";
import { TrainingPlanEditorPreview } from "@/components/training-plans/training-plan-editor-preview";
import { TrainingPlanEditorShortcutsProvider } from "@/components/training-plans/training-plan-editor-shortcuts-context";
import { useTrainingPlanEditorState } from "@/lib/hooks/use-training-plan-editor-state";

const UNSAVED_CHANGES_LEAVE_MESSAGE = "You have unsaved changes. Leave this page without saving?";

export function TrainingPlanEditor({ planId }: { planId?: string }): React.JSX.Element {
  const state = useTrainingPlanEditorState(planId);

  useEffect(() => {
    if (!state.hasUnsavedChanges) return;

    function handleDocumentClick(event: MouseEvent): void {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const currentUrl = new URL(window.location.href);
      const nextUrl = new URL(href, currentUrl);
      if (nextUrl.href === currentUrl.href) return;

      const shouldLeave = window.confirm(UNSAVED_CHANGES_LEAVE_MESSAGE);
      if (shouldLeave) return;

      event.preventDefault();
      event.stopPropagation();
    }

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [state.hasUnsavedChanges]);

  return (
    <TrainingPlanEditorShortcutsProvider onSavePlan={state.onSave}>
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
    </TrainingPlanEditorShortcutsProvider>
  );
}

