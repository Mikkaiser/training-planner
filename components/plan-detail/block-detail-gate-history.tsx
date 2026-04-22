"use client";

import { format, parseISO } from "date-fns";

import type { GateAttempt } from "@/lib/plan-detail/types";

type BlockDetailGateHistoryProps = {
  attempts: GateAttempt[];
  expanded: boolean;
  onToggle: () => void;
  currentBadgeStyle: React.CSSProperties;
};

export function BlockDetailGateHistory({
  attempts,
  expanded,
  onToggle,
  currentBadgeStyle,
}: BlockDetailGateHistoryProps): React.JSX.Element {
  return (
    <div className="plan-block-detail__gate-history">
      <button
        type="button"
        onClick={onToggle}
        className="plan-block-detail__gate-history-toggle"
      >
        {expanded ? "Hide" : "View"} all attempts ({attempts.length})
      </button>
      {expanded ? (
        <ul className="plan-block-detail__gate-history-list">
          {attempts.map((a, idx) => (
            <li key={a.id} className="plan-block-detail__gate-history-item">
              <span>{format(parseISO(a.attempt_date), "d MMM yyyy")}</span>
              <span>{a.score}/100</span>
              <span
                className={`plan-block-detail__competitor-pill ${
                  a.passed ? "badge-status-passed" : "badge-status-failed"
                }`}
              >
                {a.passed ? "Passed" : "Failed"}
              </span>
              <span className="plan-block-detail__gate-notes-preview">{a.notes ?? "—"}</span>
              {idx === 0 ? (
                <span className="plan-block-detail__current-badge" style={currentBadgeStyle}>
                  Current
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

