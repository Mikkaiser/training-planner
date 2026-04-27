"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

import { getSubcompetenceTokens } from "@/lib/constants/subcompetence-tokens";
import { getLatestAttempt, initialsFromName } from "@/lib/plan-detail/progress";
import type { GateItem } from "@/lib/plan-detail/types";
import { BlockDetailGateHistory } from "@/components/plan-detail/block-detail-gate-history";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { useSaveGateAttempt } from "@/lib/hooks/use-save-gate-attempt";
import { GateScoreSparkline } from "@/components/plan-detail/gate-score-sparkline";

type BlockDetailGateCardProps = {
  gate: GateItem;
  subcompetenceColor: string | null;
};

export function BlockDetailGateCard({
  gate,
  subcompetenceColor,
}: BlockDetailGateCardProps): React.JSX.Element {
  const { detail, tokens } = usePlanDetailContext();
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const [draftByCompetitor, setDraftByCompetitor] = useState<Record<string, string>>({});

  const scTokens = getSubcompetenceTokens(subcompetenceColor);
  const scBorder = scTokens.border || scTokens.fg;

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const threshold = gate.pass_threshold ?? 0;

  const { planId } = usePlanDetailContext();
  const mutation = useSaveGateAttempt({
    gate,
    planId,
    detail,
    onReset: () => {
      // Intentionally left blank: we clear per-row on success.
    },
  });

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
          const draft = draftByCompetitor[c.id] ?? "";
          const numericDraft = Number.parseInt(draft, 10);
          const hasValidDraft =
            !Number.isNaN(numericDraft) && numericDraft >= 0 && numericDraft <= 100;
          const willPass = hasValidDraft && numericDraft >= threshold;

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
                <span className="plan-block-detail__gate-competitor-meta">
                  <span className="plan-block-detail__competitor-name">
                    {c.full_name}
                    {hasValidDraft ? (
                      <span
                        className={`plan-block-detail__gate-live ${
                          willPass
                            ? "plan-block-detail__gate-live--pass"
                            : "plan-block-detail__gate-live--fail"
                        }`}
                      >
                        {willPass ? "Pass" : "Fail"}
                      </span>
                    ) : null}
                  </span>
                  <GateScoreSparkline attempts={all} threshold={threshold} />
                </span>

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
                  <span className="plan-block-detail__gate-empty">Ready for first attempt</span>
                )}

                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0–100"
                  value={draft}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
                    setDraftByCompetitor((cur) => ({ ...cur, [c.id]: next }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (mutation.isPending) return;
                    if (!hasValidDraft) return;
                    mutation.mutate(
                      {
                        selectedCompetitor: c.id,
                        date: today,
                        numericScore: numericDraft,
                        notes: "",
                      },
                      {
                        onSuccess: () => {
                          setDraftByCompetitor((cur) => ({ ...cur, [c.id]: "" }));
                        },
                      }
                    );
                  }}
                  className="plan-block-detail__score-input"
                  aria-label={`Record score for ${c.full_name}`}
                />
              </div>

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

