"use client";

import { Check, X } from "lucide-react";

import type { CompetitorGateState } from "@/lib/plan-detail/progress";
import { initialsFromName } from "@/lib/plan-detail/progress";

type Props = {
  competitorName: string;
  competitorColor: string;
  state: CompetitorGateState;
};

export function CompetitorStatusChip({
  competitorName,
  competitorColor,
  state,
}: Props) {
  const initials = initialsFromName(competitorName);

  if (state.kind === "passed") {
    return (
      <span
        className="plan-status-chip plan-status-chip--pass"
        title={`${competitorName} — Passed ${state.attempt.score}%`}
      >
        <Check size={10} strokeWidth={3} />
        <span>{initials}</span>
      </span>
    );
  }

  if (state.kind === "failed") {
    return (
      <span
        className="plan-status-chip plan-status-chip--fail"
        title={`${competitorName} — Failed ${state.attempt.score}%`}
      >
        <X size={10} strokeWidth={3} />
        <span>{initials}</span>
      </span>
    );
  }

  if (state.kind === "attempted") {
    return (
      <span
        className="plan-status-chip plan-status-chip--pending"
        title={`${competitorName} — ${state.attempt.score}% (pending retry)`}
      >
        <span>{initials}</span>
      </span>
    );
  }

  return (
    <span
      className="plan-status-chip plan-status-chip--none"
      title={`${competitorName} — not attempted`}
      style={{ borderColor: `${competitorColor}66`, color: competitorColor }}
    >
      <span>{initials}</span>
    </span>
  );
}
