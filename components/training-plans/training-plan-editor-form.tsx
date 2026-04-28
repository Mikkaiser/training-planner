"use client";

import * as React from "react";
import { CompetitorAssignPopover } from "@/components/competitors/competitor-assign-popover";
import { initialsFromName } from "@/components/competitors/competitor-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAN_COLORS, PLAN_COLOR_KEYS, type PlanColorKey } from "@/lib/constants/plan-colors";
import type { PlanDraft, TrainingPlanStatus } from "@/lib/training-plans/types";
import { cn } from "@/lib/utils";
import { StatusPills } from "./training-plan-editor-widgets";

export interface TrainingPlanEditorFormProps {
  draft: PlanDraft;
  personalContext: { id: string; full_name: string; avatar_color: string | null } | null;
  onChangeDescription: (value: string) => void;
  onChangeName: (value: string) => void;
  onChangeStatus: (value: TrainingPlanStatus) => void;
  onPickColor: (color: PlanColorKey) => void;
  onAssignCompetitor: (competitorId: string | null) => void;
}

export function TrainingPlanEditorForm({
  draft,
  personalContext,
  onChangeDescription,
  onChangeName,
  onChangeStatus,
  onPickColor,
  onAssignCompetitor,
}: TrainingPlanEditorFormProps): React.JSX.Element {
  return (
    <div className="tp-plan-form">
      {personalContext ? (
        <div
          className="rounded-xl border border-border px-3 py-2"
          style={{
            background:
              "color-mix(in srgb, var(--plan-tint-strong, var(--color-accent-muted)) 45%, transparent)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                background: personalContext.avatar_color ?? "var(--color-accent)",
                color: "var(--color-surface-raised)",
              }}
              aria-hidden
            >
              {initialsFromName(personalContext.full_name)}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-tp-muted">Creating personal plan for</p>
              <p className="truncate text-sm font-semibold text-tp-primary">
                {personalContext.full_name}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!personalContext ? (
        <CompetitorAssignPopover
          value={draft.owner_competitor_id}
          onChange={onAssignCompetitor}
        />
      ) : (
        <CompetitorAssignPopover
          value={personalContext.id}
          locked
          onChange={() => {
            // Locked to personalContext.
          }}
        />
      )}

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

      <div>
        <Label className="tp-plan-label">Status</Label>
        <StatusPills value={draft.status} onChange={onChangeStatus} />
      </div>
    </div>
  );
}

