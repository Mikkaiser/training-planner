"use client";

import { Plus } from "lucide-react";

type GateAttemptActionsProps = {
  isSaving: boolean;
  onCancel: (() => void) | undefined;
};

export function GateAttemptActions({
  isSaving,
  onCancel,
}: GateAttemptActionsProps): React.JSX.Element {
  return (
    <div className="plan-attempt-form__actions">
      <button
        type="button"
        onClick={onCancel}
        className="plan-attempt-form__cancel"
        disabled={isSaving}
      >
        Cancel
      </button>
      <button
        type="submit"
        className="tp-plan-save-btn plan-attempt-form__save"
        disabled={isSaving}
        style={{ background: "var(--plan-accent)" }}
      >
        <Plus size={14} />
        <span>{isSaving ? "Saving…" : "Save Attempt"}</span>
      </button>
    </div>
  );
}

