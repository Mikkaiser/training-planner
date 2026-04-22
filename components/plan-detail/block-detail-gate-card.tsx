"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, Plus, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

import { getSubcompetenceTokens } from "@/lib/constants/subcompetence-tokens";
import { getLatestAttempt, initialsFromName } from "@/lib/plan-detail/progress";
import type { GateItem } from "@/lib/plan-detail/types";
import { useIsDark } from "@/lib/use-is-dark";
import { BlockDetailGateHistory } from "@/components/plan-detail/block-detail-gate-history";
import { GateAttemptForm } from "@/components/plan-detail/gate-attempt-form";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";

type BlockDetailGateCardProps = {
  gate: GateItem;
  subcompetenceColor: string | null;
};

export function BlockDetailGateCard({
  gate,
  subcompetenceColor,
}: BlockDetailGateCardProps): React.JSX.Element {
  const { detail, tokens } = usePlanDetailContext();
  const isDark = useIsDark();
  const [recordingFor, setRecordingFor] = useState<string | null>(null);
  const [expandedFor, setExpandedFor] = useState<string | null>(null);

  const scTokens = getSubcompetenceTokens(subcompetenceColor, isDark);
  const scBorder = scTokens.border || scTokens.fg;

  return (
    <section
      className="plan-block-detail__gate-card"
      style={
        {
          background: tokens.bg,
          // CSS custom property consumed by `globals.css` (not part of `CSSProperties` index signature).
          ["--sc-border" as string]: scBorder,
        } as React.CSSProperties
      }
    >
      <header className="plan-block-detail__gate-header">
        <span style={{ color: tokens.accent }} aria-hidden>
          <BookOpen size={16} />
        </span>
        <span className="plan-block-detail__gate-name">{gate.name}</span>
        {typeof gate.pass_threshold === "number" ? (
          <span className="plan-block-detail__gate-threshold">{gate.pass_threshold}%</span>
        ) : null}
      </header>

      <div className="plan-block-detail__gate-competitors">
        {detail.competitors.map((c) => {
          const latest = getLatestAttempt(detail, gate.id, c.id);
          const all =
            detail.attemptsByGate.get(gate.id)?.filter((a) => a.competitor_id === c.id) ?? [];
          const expanded = expandedFor === c.id;
          const isRecording = recordingFor === c.id;

          return (
            <div key={c.id} className="plan-block-detail__gate-competitor">
              <div className="plan-block-detail__gate-competitor-head">
                <span
                  className="plan-block-detail__competitor-avatar"
                  style={{ background: c.avatar_color }}
                  aria-hidden
                >
                  {initialsFromName(c.full_name)}
                </span>
                <span className="plan-block-detail__competitor-name">{c.full_name}</span>

                {latest ? (
                  <>
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 280, damping: 20 }}
                      className={`plan-block-detail__score-badge ${
                        latest.passed ? "badge-status-passed" : "badge-status-failed"
                      }`}
                    >
                      {latest.score}/100
                    </motion.span>
                    <span className="plan-block-detail__gate-date">
                      {format(parseISO(latest.attempt_date), "d MMM yyyy")}
                    </span>
                    <span
                      className={`plan-block-detail__competitor-pill ${
                        latest.passed ? "badge-status-passed" : "badge-status-failed"
                      }`}
                    >
                      {latest.passed ? (
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
                  </>
                ) : (
                  <span className="plan-block-detail__gate-empty">No attempts yet</span>
                )}

                <button
                  type="button"
                  onClick={() => setRecordingFor((cur) => (cur === c.id ? null : c.id))}
                  className="plan-block-detail__record-btn"
                >
                  <Plus size={12} />
                  <span>Record Attempt</span>
                </button>
              </div>

              {isRecording ? (
                <GateAttemptForm
                  gate={gate}
                  competitorId={c.id}
                  lockedCompetitor
                  onDone={() => setRecordingFor(null)}
                />
              ) : null}

              {all.length > 0 ? (
                <BlockDetailGateHistory
                  attempts={all}
                  expanded={expanded}
                  onToggle={() => setExpandedFor((cur) => (cur === c.id ? null : c.id))}
                  currentBadgeStyle={{
                    background: tokens.chip,
                    borderColor: tokens.chipBorder,
                    color: tokens.chipText,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

