"use client";

import * as React from "react";
import { ArrowLeftRight, ArrowUpDown, ChevronLeft } from "lucide-react";
import { type SensorDescriptor } from "@dnd-kit/core";

import type { PlanPhaseRef } from "@/lib/training-plans/types";
import { cn } from "@/lib/utils";
import { TrainingPlanEditorPreviewHorizontal } from "./training-plan-editor-preview-horizontal";
import { TrainingPlanEditorPreviewVertical } from "./training-plan-editor-preview-vertical";

export type Orientation = "horizontal" | "vertical";

export interface TrainingPlanEditorPreviewProps {
  draftName: string;
  orientation: Orientation;
  phaseRefs: PlanPhaseRef[];
  sensors: SensorDescriptor<Record<string, unknown>>[];
  totalWeeks: number;
  onChangeOrientation: (orientation: Orientation) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function TrainingPlanEditorPreview({
  draftName,
  orientation,
  phaseRefs,
  sensors,
  totalWeeks,
  onChangeOrientation,
  onReorder,
}: TrainingPlanEditorPreviewProps): React.JSX.Element {
  return (
    <div className="tp-plan-right">
      <div className="tp-plan-right-header">
        <div className="min-w-0">
          <div className="tp-plan-right-title">Roadmap Preview</div>
          <div className="tp-plan-right-subtitle">{draftName ? draftName : "Untitled plan"}</div>
        </div>
        <div className="tp-plan-toggle">
          <button
            type="button"
            onClick={() => onChangeOrientation("horizontal")}
            className={cn("tp-plan-toggle-btn", orientation === "horizontal" && "is-active")}
            aria-label="Horizontal layout"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChangeOrientation("vertical")}
            className={cn("tp-plan-toggle-btn", orientation === "vertical" && "is-active")}
            aria-label="Vertical layout"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="tp-plan-canvas">
        {phaseRefs.length === 0 ? (
          <div className="tp-plan-canvas-empty">
            <ChevronLeft className="tp-plan-canvas-empty-icon" />
            <div className="tp-plan-canvas-empty-text">Add your first phase on the left</div>
          </div>
        ) : orientation === "horizontal" ? (
          <TrainingPlanEditorPreviewHorizontal
            phaseRefs={phaseRefs}
            sensors={sensors}
            totalWeeks={totalWeeks}
            onReorder={onReorder}
          />
        ) : (
          <TrainingPlanEditorPreviewVertical phaseRefs={phaseRefs} sensors={sensors} onReorder={onReorder} />
        )}
      </div>
    </div>
  );
}

