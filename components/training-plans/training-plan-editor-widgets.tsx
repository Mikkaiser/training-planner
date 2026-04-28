"use client";

import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TrainingPlanStatus } from "@/lib/training-plans/types";

export type TrainingPlanEditorSaveState =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

type StatusPillsProps = {
  value: TrainingPlanStatus;
  onChange: (value: TrainingPlanStatus) => void;
};

export function StatusPills({ value, onChange }: StatusPillsProps): React.JSX.Element {
  const options: TrainingPlanStatus[] = ["draft", "active", "completed"];
  const labels: Record<TrainingPlanStatus, string> = {
    draft: "Draft",
    active: "Active",
    completed: "Completed",
  };

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "tp-plan-status-pill rounded-full border px-[14px] py-[5px] text-[13px] transition-all",
            opt === value
              ? "is-active font-semibold"
              : "is-inactive text-tp-secondary hover:text-[var(--color-text-accent)]"
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

type SaveIndicatorProps = {
  state: TrainingPlanEditorSaveState;
  canSave: boolean;
  errorMessage?: string | null;
};

export function SaveIndicator({
  state,
  canSave,
  errorMessage,
}: SaveIndicatorProps): React.JSX.Element | null {
  if (state === "idle") return null;

  if (state === "dirty") {
    return (
      <div className="flex items-center gap-2 text-[12px] text-tp-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
        {canSave ? "Unsaved changes" : "Fill plan name to save"}
      </div>
    );
  }

  if (state === "saving") {
    return (
      <div className="flex items-center gap-2 text-[12px] text-tp-muted">
        <Loader2 className="h-[14px] w-[14px] animate-spin" />
        Saving…
      </div>
    );
  }

  if (state === "saved") {
    return (
      <div className="flex items-center gap-2 text-[12px] text-positive">
        <CheckCircle className="h-[14px] w-[14px]" />
        Saved
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 text-[12px] text-negative"
      title={errorMessage ?? undefined}
    >
      <AlertCircle className="h-[14px] w-[14px]" />
      Save failed
    </div>
  );
}

