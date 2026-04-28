"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import Link from "next/link";

import {
  SaveIndicator,
  type TrainingPlanEditorSaveState,
} from "@/components/training-plans/training-plan-editor-widgets";

export interface TrainingPlanEditorLeftHeaderProps {
  planId?: string;
  planName: string;
  autoState: TrainingPlanEditorSaveState;
  autoCanSave: boolean;
  autoErrorMessage: string | null;
  onSave: () => void;
}

export function TrainingPlanEditorLeftHeader({
  planId,
  planName,
  autoState,
  autoCanSave,
  autoErrorMessage,
  onSave,
}: TrainingPlanEditorLeftHeaderProps): React.JSX.Element {
  const isEditing = Boolean(planId);
  const displayName = planName.trim() || "Untitled plan";

  return (
    <div className="tp-plan-left-header">
      <div className="min-w-0">
        {isEditing ? (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-xs font-body">
            <Link href="/plans" className="page-breadcrumb-link">
              Plans
            </Link>
            <span className="page-breadcrumb-separator" aria-hidden>
              ›
            </span>
            <Link href={`/plans/${planId}`} className="page-breadcrumb-link">
              {displayName}
            </Link>
            <span className="page-breadcrumb-separator" aria-hidden>
              ›
            </span>
            <span className="page-breadcrumb-current">Edit</span>
          </nav>
        ) : null}
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
          title={!autoCanSave ? "Fill in the plan name (min 3 chars)." : undefined}
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

