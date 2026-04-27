"use client";

import { useState } from "react";

import { AttemptDatePicker } from "@/components/plan-detail/attempt-date-picker";
import { GateAttemptActions } from "@/components/plan-detail/gate-attempt-actions";
import { GateAttemptCompetitorSelect } from "@/components/plan-detail/gate-attempt-competitor-select";
import { GateAttemptNotesField } from "@/components/plan-detail/gate-attempt-notes-field";
import { GateAttemptScoreField } from "@/components/plan-detail/gate-attempt-score-field";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { useSaveGateAttempt } from "@/lib/hooks/use-save-gate-attempt";
import type { GateItem } from "@/lib/plan-detail/types";

export function GateAttemptForm({
  gate,
  competitorId,
  onDone,
  lockedCompetitor = false,
}: {
  gate: GateItem;
  competitorId?: string;
  onDone?: () => void;
  /** When true, hide the competitor picker and always use `competitorId`. */
  lockedCompetitor?: boolean;
}): React.JSX.Element {
  const { detail, planId } = usePlanDetailContext();

  const today = new Date().toISOString().slice(0, 10);

  const [selectedCompetitor, setSelectedCompetitor] = useState<string>(
    competitorId ?? detail.competitors[0]?.id ?? ""
  );
  const [score, setScore] = useState<string>("");
  const [date, setDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>("");

  const threshold = gate.pass_threshold ?? 0;
  const numericScore = Number.parseInt(score, 10);
  const hasValidScore =
    !Number.isNaN(numericScore) && numericScore >= 0 && numericScore <= 100;
  const willPass = hasValidScore && numericScore >= threshold;

  const mutation = useSaveGateAttempt({
    gate,
    planId,
    detail,
    onDone,
    onReset: () => {
      setScore("");
      setNotes("");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!selectedCompetitor) return;
        if (!hasValidScore) return;
        mutation.mutate({
          selectedCompetitor,
          date,
          numericScore,
          notes,
        });
      }}
      className="plan-attempt-form"
    >
      {!lockedCompetitor ? (
        <GateAttemptCompetitorSelect
          competitors={detail.competitors}
          value={selectedCompetitor}
          onChange={setSelectedCompetitor}
        />
      ) : null}

      <div className="plan-attempt-form__grid">
        <GateAttemptScoreField
          score={score}
          onScoreChange={setScore}
          threshold={threshold}
          hasValidScore={hasValidScore}
          willPass={willPass}
        />
        <div className="plan-attempt-form__field">
          <label htmlFor="attempt-date" className="tp-plan-label">
            Date <span className="plan-attempt-form__required" aria-hidden>*</span>
          </label>
          <AttemptDatePicker value={date} onChange={setDate} />
        </div>
      </div>

      <div className="plan-attempt-form__divider" aria-hidden />

      <GateAttemptNotesField notes={notes} onNotesChange={setNotes} />

      <GateAttemptActions isSaving={mutation.isPending} onCancel={onDone} />
    </form>
  );
}
