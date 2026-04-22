"use client";

import { CheckCircle, XCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GateAttemptScoreFieldProps = {
  score: string;
  onScoreChange: (next: string) => void;
  threshold: number;
  hasValidScore: boolean;
  willPass: boolean;
};

export function GateAttemptScoreField({
  score,
  onScoreChange,
  threshold,
  hasValidScore,
  willPass,
}: GateAttemptScoreFieldProps): React.JSX.Element {
  return (
    <div className="plan-attempt-form__field">
      <Label htmlFor="attempt-score" className="tp-plan-label">
        Score (0–100)
        <span className="plan-attempt-form__required" aria-hidden>
          *
        </span>
      </Label>
      <Input
        id="attempt-score"
        type="number"
        min={0}
        max={100}
        value={score}
        onChange={(e) => onScoreChange(e.target.value)}
        required
        className="glass-input plan-attempt-form__score"
      />
      {hasValidScore ? (
        <div className="plan-attempt-form__preview" data-pass={willPass ? "true" : "false"}>
          {willPass ? (
            <>
              <CheckCircle size={14} />
              <span>Will PASS</span>
            </>
          ) : (
            <>
              <XCircle size={14} />
              <span>Will FAIL · needs {threshold}%</span>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

