"use client";

import { useState } from "react";
import {
  CheckCircle,
  ClipboardList,
  Plus,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { GateAttemptForm } from "@/components/plan-detail/gate-attempt-form";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { FileIcon } from "@/components/shared/FileIcon";
import {
  competitorGateState,
  initialsFromName,
} from "@/lib/plan-detail/progress";
import type { AllowedFileType } from "@/lib/storage/storage";
import type { GateItem } from "@/lib/plan-detail/types";

export function GateDetail({ gate }: { gate: GateItem }) {
  const { detail, tokens, colorKey } = usePlanDetailContext();
  const [recordingFor, setRecordingFor] = useState<string | null>(null);

  const Icon = gate.gate_type === "phase_gate" ? ShieldCheck : Shield;
  const typeLabel =
    gate.gate_type === "phase_gate" ? "Phase gate" : "Block gate";
  const attempts = detail.attemptsByGate.get(gate.id) ?? [];
  const assessments = detail.assessmentsByGate.get(gate.id) ?? [];

  return (
    <div className="plan-gate-detail">
      <header className="plan-gate-detail__header">
        <div className="plan-gate-detail__title-row">
          <span style={{ color: tokens.accent }} aria-hidden>
            <Icon size={24} />
          </span>
          <h2>{gate.name}</h2>
        </div>
        <div className="plan-gate-detail__meta">
          <span
            className="plan-gate-detail__type"
            style={{
              background: tokens.chip,
              borderColor: tokens.chipBorder,
              color: tokens.chipText,
            }}
          >
            {typeLabel}
          </span>
          {typeof gate.pass_threshold === "number" ? (
            <span
              className="plan-gate-detail__threshold"
              style={{ color: tokens.accent }}
            >
              {gate.pass_threshold}%
            </span>
          ) : null}
        </div>
        {gate.description ? (
          <p className="plan-gate-detail__description">{gate.description}</p>
        ) : null}
      </header>

      <section className="plan-gate-detail__section">
        {detail.competitors.map((c) => {
          const state = competitorGateState(detail, c.id, gate.id);
          const history = attempts.filter((a) => a.competitor_id === c.id);
          const isRecording = recordingFor === c.id;

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
            <div key={c.id} className="plan-gate-detail__competitor">
              <div className="plan-gate-detail__competitor-head">
                <span
                  className="plan-gate-detail__avatar"
                  style={{ background: c.avatar_color }}
                  aria-hidden
                >
                  {initialsFromName(c.full_name)}
                </span>
                <span className="plan-gate-detail__competitor-name">
                  {c.full_name}
                </span>
                <span
                  className={`plan-gate-detail__competitor-pill ${pillClass}`}
                >
                  {pillLabel}
                </span>
              </div>

              {history.length === 0 ? (
                <div className="plan-gate-detail__no-history">
                  No attempts recorded yet.
                </div>
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
                          transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 20,
                          }}
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
                          <span
                            className="plan-gate-detail__latest"
                            style={{
                              background: tokens.chip,
                              borderColor: tokens.chipBorder,
                              color: tokens.chipText,
                            }}
                          >
                            Latest
                          </span>
                        ) : null}
                      </div>
                      {a.notes ? (
                        <p className="plan-gate-detail__attempt-notes">
                          {a.notes}
                        </p>
                      ) : null}
                    </motion.li>
                  ))}
                </ul>
              )}

              <div className="plan-gate-detail__record">
                {isRecording ? (
                  <GateAttemptForm
                    gate={gate}
                    competitorId={c.id}
                    lockedCompetitor
                    onDone={() => setRecordingFor(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setRecordingFor(c.id)}
                    className="plan-gate-detail__record-btn"
                    style={{
                      background: tokens.accent,
                      boxShadow: `0 2px 10px ${tokens.glow}`,
                    }}
                  >
                    <Plus size={14} />
                    <span>Record New Attempt</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {assessments.length > 0 ? (
        <section className="plan-gate-detail__section">
          <h3>
            <ClipboardList size={16} style={{ color: tokens.accent }} />
            <span>Assessment Documents</span>
          </h3>
          <ul className="plan-gate-detail__assessments">
            {assessments.map((a) => (
              <li key={a.id} className="plan-gate-detail__assessment">
                <FileIcon type={a.file_type} size={16} />
                <span className="plan-gate-detail__assessment-title">
                  {a.title}
                </span>
                {a.file_url && a.file_name ? (
                  <DownloadButton
                    bucket="gate-assessments"
                    filePath={a.file_url}
                    fileName={a.file_name}
                    fileType={(a.file_type as AllowedFileType) || "pdf"}
                    variant="button"
                    planColor={colorKey}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
