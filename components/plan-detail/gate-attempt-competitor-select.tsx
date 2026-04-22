"use client";

import { ChevronDown } from "lucide-react";

import { Label } from "@/components/ui/label";
import type { Competitor } from "@/lib/plan-detail/types";

type GateAttemptCompetitorSelectProps = {
  competitors: Competitor[];
  value: string;
  onChange: (next: string) => void;
};

export function GateAttemptCompetitorSelect({
  competitors,
  value,
  onChange,
}: GateAttemptCompetitorSelectProps): React.JSX.Element {
  return (
    <div className="plan-attempt-form__row">
      <Label htmlFor="attempt-competitor" className="tp-plan-label">
        Competitor
      </Label>
      <div className="plan-attempt-form__select-wrap">
        <select
          id="attempt-competitor"
          className="glass-input plan-attempt-form__select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {competitors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        <span className="plan-attempt-form__field-icon" aria-hidden>
          <ChevronDown size={16} />
        </span>
      </div>
    </div>
  );
}

