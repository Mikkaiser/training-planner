"use client";

import { useState } from "react";
import { CheckCircle, Plus, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

import { GateAttemptForm } from "@/components/plan-detail/gate-attempt-form";
import { competitorGateState, initialsFromName } from "@/lib/plan-detail/progress";
import type { Competitor, GateAttempt, GateItem, PlanDetail } from "@/lib/plan-detail/types";

type GateDetailCompetitorProps = {
  detail: PlanDetail;
  gate: GateItem;
  competitor: Competitor;
  attempts: GateAttempt[];
  chipStyle: React.CSSProperties;
  recordButtonStyle: React.CSSProperties;
};

export function GateDetailCompetitor({
  detail,
  gate,
  competitor,
  attempts,
  chipStyle,
  recordButtonStyle,
}: GateDetailCompetitorProps): React.JSX.Element {
  const [isRecording, setIsRecording] = useState(false);

  const state = competitorGateState(detail, competitor.id, gate.id);
  const history = attempts.filter((a) => a.competitor_id === competitor.id);

  let pillLabel = "Not attempted";
  let pillClass = "badge-status-neutral";
  if (state.kind === "passed") {
    pillLabel = "Passed";
    pillClass = "badge-status-passed";
  } else if (state.kind === "failed") {
    pillLabel = "Failed";
    pillClass = "badge-status-failed";
  } else if (state.kind === "attempted") {
    pillLabel = "In progress";
    pillClass = "badge-status-warning";
  }

  return (
    <div className="plan-gate-detail__competitor">
      <div className="plan-gate-detail__competitor-head">
        <span
          className="plan-gate-detail__avatar"
          style={{ background: competitor.avatar_color }}
          aria-hidden
        >
          {initialsFromName(competitor.full_name)}
        </span>
        <span className="plan-gate-detail__competitor-name">{competitor.full_name}</span>
        <span className={`plan-gate-detail__competitor-pill ${pillClass}`}>{pillLabel}</span>
      </div>

      {history.length === 0 ? (
        <div className="plan-gate-detail__no-history">No attempts recorded yet.</div>
      ) : (
        <ul className="plan-gate-detail__timeline">
          {history.map((a, idx) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="plan-gate-detail__attempt"
            >
              <div className="plan-gate-detail__attempt-row1">
                <span className="plan-gate-detail__attempt-date">
                  {format(parseISO(a.attempt_date), "d MMM yyyy")}
                </span>
                <motion.span
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className={`plan-block-detail__score-badge ${
                    a.passed ? "badge-status-passed" : "badge-status-failed"
                  }`}
                >
                  {a.score}/100
                </motion.span>
                <span
                  className={`plan-gate-detail__competitor-pill ${
                    a.passed ? "badge-status-passed" : "badge-status-failed"
                  }`}
                >
                  {a.passed ? (
                    <>
                      <CheckCircle size={12} />
                      <span>Passed</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={12} />
                      <span>Failed</span>
                    </>
                  )}
                </span>
                {idx === 0 ? (
                  <span className="plan-gate-detail__latest" style={chipStyle}>
                    Latest
                  </span>
                ) : null}
              </div>
              {a.notes ? <p className="plan-gate-detail__attempt-notes">{a.notes}</p> : null}
            </motion.li>
          ))}
        </ul>
      )}

      <div className="plan-gate-detail__record">
        {isRecording ? (
          <GateAttemptForm
            gate={gate}
            competitorId={competitor.id}
            lockedCompetitor
            onDone={() => setIsRecording(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsRecording(true)}
            className="plan-gate-detail__record-btn"
            style={recordButtonStyle}
          >
            <Plus size={14} />
            <span>Record New Attempt</span>
          </button>
        )}
      </div>
    </div>
  );
}

