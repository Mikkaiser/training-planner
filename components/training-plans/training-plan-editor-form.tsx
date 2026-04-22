"use client";

import * as React from "react";
import { Calendar } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAN_COLORS, PLAN_COLOR_KEYS, type PlanColorKey } from "@/lib/constants/plan-colors";
import type { PlanDraft, TrainingPlanStatus } from "@/lib/training-plans/types";
import { cn } from "@/lib/utils";
import { StatusPills } from "./training-plan-editor-widgets";

export interface TrainingPlanEditorFormProps {
  draft: PlanDraft;
  onChangeDescription: (value: string) => void;
  onChangeName: (value: string) => void;
  onChangeStartDate: (value: string) => void;
  onChangeStatus: (value: TrainingPlanStatus) => void;
  onPickColor: (color: PlanColorKey) => void;
}

export function TrainingPlanEditorForm({
  draft,
  onChangeDescription,
  onChangeName,
  onChangeStartDate,
  onChangeStatus,
  onPickColor,
}: TrainingPlanEditorFormProps): React.JSX.Element {
  return (
    <div className="tp-plan-form">
      <div>
        <Label htmlFor="tp-plan-name" className="tp-plan-label">
          Plan name <span className="text-negative">*</span>
        </Label>
        <Input
          id="tp-plan-name"
          value={draft.name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="e.g. Phase 1 — Foundation Track"
          className="tp-plan-input"
        />
      </div>

      <div>
        <Label htmlFor="tp-plan-description" className="tp-plan-label">
          Description
        </Label>
        <textarea
          id="tp-plan-description"
          value={draft.description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="What does this training plan cover?"
          rows={3}
          className="tp-plan-textarea"
        />
      </div>

      <div>
        <Label className="tp-plan-label">Plan color</Label>
        <div className="tp-plan-color-swatches">
          {PLAN_COLOR_KEYS.map((key) => {
            const tokens = PLAN_COLORS[key];
            const selected = draft.color === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={`Plan color: ${tokens.label}`}
                aria-pressed={selected}
                onClick={() => onPickColor(key)}
                className={cn("tp-plan-color-swatch", selected && "is-selected")}
                style={
                  {
                    background: tokens.border,
                    // CSS custom property consumed by `globals.css` (not part of `CSSProperties` index signature).
                    ["--swatch-glow" as string]: tokens.glow,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      </div>

      <div className="tp-plan-row">
        <div className="flex-1">
          <Label htmlFor="tp-plan-start-date" className="tp-plan-label">
            Start date <span className="text-negative">*</span>
          </Label>
          <div className="tp-plan-date-wrap">
            <Input
              id="tp-plan-start-date"
              type="date"
              value={draft.start_date}
              onChange={(e) => onChangeStartDate(e.target.value)}
              className="tp-plan-input"
            />
            <Calendar className="tp-plan-date-icon" />
          </div>
        </div>
        <div>
          <Label className="tp-plan-label">Status</Label>
          <StatusPills value={draft.status} onChange={onChangeStatus} />
        </div>
      </div>
    </div>
  );
}

