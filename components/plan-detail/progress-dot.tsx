"use client";

import { Check } from "lucide-react";

import type { CompetitorBlockState } from "@/lib/plan-detail/progress";
import { initialsFromName } from "@/lib/plan-detail/progress";

type Props = {
  competitorName: string;
  competitorColor: string;
  state: CompetitorBlockState;
};

export function ProgressDot({ competitorName, competitorColor, state }: Props) {
  const title = `${competitorName} — ${
    state.kind === "completed"
      ? "block completed"
      : state.kind === "in_progress"
      ? "currently on this block"
      : "not yet reached"
  }`;

  if (state.kind === "completed") {
    return (
      <span
        className="plan-progress-dot plan-progress-dot--completed"
        style={{ background: competitorColor, color: "var(--color-surface-raised)" }}
        title={title}
        aria-label={title}
      >
        <Check size={10} strokeWidth={3} />
      </span>
    );
  }

  if (state.kind === "in_progress") {
    return (
      <span
        className="plan-progress-dot plan-progress-dot--current"
        style={{ background: competitorColor }}
        title={title}
        aria-label={title}
      >
        <span
          className="plan-progress-dot__pulse"
          style={{ background: competitorColor }}
          aria-hidden
        />
        <span className="plan-progress-dot__initials">
          {initialsFromName(competitorName)}
        </span>
      </span>
    );
  }

  return (
    <span
      className="plan-progress-dot plan-progress-dot--empty"
      title={title}
      aria-label={title}
    />
  );
}
