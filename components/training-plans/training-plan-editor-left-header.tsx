"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";

import {
  SaveIndicator,
  type TrainingPlanEditorSaveState,
} from "@/components/training-plans/training-plan-editor-widgets";

export interface TrainingPlanEditorLeftHeaderProps {
  autoState: TrainingPlanEditorSaveState;
  autoCanSave: boolean;
  autoErrorMessage: string | null;
  onSave: () => void;
}

export function TrainingPlanEditorLeftHeader({
  autoState,
  autoCanSave,
  autoErrorMessage,
  onSave,
}: TrainingPlanEditorLeftHeaderProps): React.JSX.Element {
  return (
    <div className="tp-plan-left-header">
      <div className="min-w-0">
        <div className="tp-plan-left-header-title">Plan details</div>
        <div className="tp-plan-left-header-subtitle">
          {autoState === "dirty" ? "Unsaved changes" : "Manual save"}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SaveIndicator state={autoState} canSave={autoCanSave} errorMessage={autoErrorMessage} />
        <button
          type="button"
          onClick={onSave}
          disabled={!autoCanSave || autoState === "saving"}
          className="tp-plan-save-btn"
          title={!autoCanSave ? "Fill in the plan name (min 3 chars) and start date." : undefined}
        >
          {autoState === "saving" ? (
            <>
              <Loader2 className="h-[14px] w-[14px] animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-[14px] w-[14px]" />
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}

