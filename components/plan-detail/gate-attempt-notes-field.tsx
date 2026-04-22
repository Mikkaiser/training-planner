"use client";

import { Label } from "@/components/ui/label";

type GateAttemptNotesFieldProps = {
  notes: string;
  onNotesChange: (next: string) => void;
};

export function GateAttemptNotesField({
  notes,
  onNotesChange,
}: GateAttemptNotesFieldProps): React.JSX.Element {
  return (
    <div className="plan-attempt-form__row">
      <Label htmlFor="attempt-notes" className="tp-plan-label">
        Notes
      </Label>
      <textarea
        id="attempt-notes"
        rows={3}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Observations, strengths, areas to improve..."
        className="glass-input plan-attempt-form__textarea"
      />
    </div>
  );
}

