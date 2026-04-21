"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle, Plus, Users, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { GateAttemptForm } from "@/components/plan-detail/gate-attempt-form";
import { ExerciseUploadZone } from "@/components/plan-detail/exercise-upload-zone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { FileIcon } from "@/components/shared/FileIcon";
import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import {
  getSubcompetenceTokens,
  subcompetenceChipStyle,
} from "@/lib/constants/subcompetenceTokens";
import { useIsDark } from "@/lib/use-is-dark";
import type { AllowedFileType } from "@/lib/storage/storage";
import {
  getCompetitorBlockPresentation,
  getLatestAttempt,
  initialsFromName,
} from "@/lib/plan-detail/progress";
import type { BlockItem, GateItem } from "@/lib/plan-detail/types";

const DIFFICULTY_CLASS: Record<string, string> = {
  foundation: "badge-difficulty-foundation",
  intermediate: "badge-difficulty-intermediate",
  advanced: "badge-difficulty-advanced",
};

export function BlockDetail({ block }: { block: BlockItem }) {
  const { detail, tokens, colorKey } = usePlanDetailContext();
  const isDark = useIsDark();

  const phase = detail.phases.find((p) => p.id === block.phase_id);
  const blockGate: GateItem = block.gate;

  const sc = block.subcompetence;
  const { Icon, colorDark } = getSubcompetenceIcon(sc);
  const subcompetenceColor = sc?.color ?? colorDark;
  const scChipStyle = subcompetenceChipStyle(sc?.color ?? null, isDark);

  const exercises = detail.exercisesByBlock.get(block.id) ?? [];

  const weekRange = useMemo(() => {
    if (!phase?.duration_weeks || !phase.blocks.length) return null;
    const per = phase.duration_weeks / phase.blocks.length;
    const idx = phase.blocks.findIndex((b) => b.id === block.id);
    if (idx < 0) return null;
    const startWeek = Math.round(idx * per) + 1;
    const endWeek = Math.round((idx + 1) * per);
    return `Week ${startWeek}${endWeek > startWeek ? `–${endWeek}` : ""}`;
  }, [phase, block.id]);

  return (
    <div className="plan-block-detail">
      <header className="plan-block-detail__header">
        <div className="plan-block-detail__title-row">
          <span style={{ color: subcompetenceColor }} aria-hidden>
            <Icon size={24} />
          </span>
          <h2>{block.name}</h2>
        </div>
        <div className="plan-block-detail__meta">
          {sc ? (
            <span
              className="plan-block-detail__sc-chip subcompetence-chip"
              style={scChipStyle}
            >
              {sc.name}
            </span>
          ) : null}
          {weekRange ? (
            <span className="plan-block-detail__week">{weekRange}</span>
          ) : null}
        </div>
        {block.description ? (
          <p className="plan-block-detail__description">{block.description}</p>
        ) : null}
      </header>

      <section className="plan-block-detail__section">
        <h3>
          <Users size={16} style={{ color: tokens.accent }} />
          <span>Competitor Status</span>
        </h3>
        <div className="plan-block-detail__competitors">
          {detail.competitors.map((c) => {
            const presentation = getCompetitorBlockPresentation(
              detail,
              c.id,
              block.id,
            );
            return (
              <div key={c.id} className="plan-block-detail__competitor">
                <span
                  className="plan-block-detail__competitor-avatar"
                  style={{ background: c.avatar_color }}
                  aria-hidden
                >
                  {initialsFromName(c.full_name)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="plan-block-detail__competitor-name">
                    {c.full_name}
                  </div>
                  {presentation.showProgress &&
                  presentation.progressPercent != null ? (
                    <div className="plan-block-detail__competitor-progress">
                      <div className="plan-block-detail__competitor-track">
                        <div
                          className="plan-block-detail__competitor-fill"
                          style={{
                            width: `${presentation.progressPercent}%`,
                            background: c.avatar_color,
                          }}
                        />
                      </div>
                      <span className="plan-block-detail__competitor-score">
                        Last attempt: {presentation.progressPercent}%
                      </span>
                    </div>
                  ) : null}
                </div>
                <span
                  className="plan-block-detail__competitor-pill"
                  data-color={presentation.color}
                >
                  {presentation.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <GateInfoBar gate={blockGate} />

      <GateCard gate={blockGate} subcompetenceColor={sc?.color ?? null} />

      <section className="plan-block-detail__section">
        <h3>
          <BookOpen size={16} style={{ color: tokens.accent }} />
          <span>Exercises</span>
        </h3>
        <div className="plan-block-detail__exercises">
          {exercises.length === 0 ? (
            <div className="plan-block-detail__exercises-empty">
              No exercises yet for this block.
            </div>
          ) : (
            exercises.map((ex) => {
              const diffKey = ex.difficulty ?? "foundation";
              const diffClass =
                DIFFICULTY_CLASS[diffKey] ?? DIFFICULTY_CLASS.foundation;
              const fileType = (ex.file_type ?? "") as AllowedFileType;
              return (
                <motion.article
                  key={ex.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="plan-block-detail__exercise-card"
                >
                  <FileIcon type={ex.file_type} size={20} />
                  <div className="plan-block-detail__exercise-body">
                    <div className="plan-block-detail__exercise-title-row">
                      <span className="plan-block-detail__exercise-title">
                        {ex.title}
                      </span>
                      {ex.difficulty ? (
                        <span
                          className={`plan-block-detail__exercise-diff ${diffClass}`}
                        >
                          {ex.difficulty}
                        </span>
                      ) : null}
                    </div>
                    {ex.description ? (
                      <p className="plan-block-detail__exercise-desc">
                        {ex.description}
                      </p>
                    ) : null}
                    {ex.preview_url && ex.preview_file_name ? (
                      <div className="plan-block-detail__exercise-preview">
                        <DownloadButton
                          bucket="exercises"
                          filePath={ex.preview_url}
                          fileName={ex.preview_file_name}
                          fileType="pdf"
                          variant="link"
                          planColor={colorKey}
                          label="Preview"
                        />
                      </div>
                    ) : null}
                  </div>
                  {ex.file_url && ex.file_name ? (
                    <DownloadButton
                      bucket="exercises"
                      filePath={ex.file_url}
                      fileName={ex.file_name}
                      fileType={fileType || "pdf"}
                      variant="button"
                      planColor={colorKey}
                    />
                  ) : null}
                </motion.article>
              );
            })
          )}
          <ExerciseUploadZone block={block} />
        </div>
      </section>
    </div>
  );
}

function GateInfoBar({ gate }: { gate: GateItem }) {
  const { tokens } = usePlanDetailContext();
  return (
    <div
      className="plan-block-detail__gate-bar"
      style={{
        background: tokens.chip,
        border: `1px solid ${tokens.chipBorder}`,
        color: tokens.chipText,
      }}
    >
      <span className="plan-block-detail__gate-bar-name">{gate.name}</span>
      <span className="plan-block-detail__gate-bar-type">
        {gate.gate_type === "phase_gate" ? "phase_gate" : "block_gate"}
      </span>
      {typeof gate.pass_threshold === "number" ? (
        <span
          className="plan-block-detail__gate-bar-threshold"
          style={{ color: tokens.accent }}
        >
          {gate.pass_threshold}%
        </span>
      ) : null}
    </div>
  );
}

function GateCard({
  gate,
  subcompetenceColor,
}: {
  gate: GateItem;
  subcompetenceColor: string | null;
}) {
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
          <span className="plan-block-detail__gate-threshold">
            {gate.pass_threshold}%
          </span>
        ) : null}
      </header>

      <div className="plan-block-detail__gate-competitors">
        {detail.competitors.map((c) => {
          const latest = getLatestAttempt(detail, gate.id, c.id);
          const all =
            detail.attemptsByGate
              .get(gate.id)
              ?.filter((a) => a.competitor_id === c.id) ?? [];
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
                <span className="plan-block-detail__competitor-name">
                  {c.full_name}
                </span>
                {latest ? (
                  <>
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 280, damping: 20 }}
                      className={`plan-block-detail__score-badge ${
                        latest.passed
                          ? "badge-status-passed"
                          : "badge-status-failed"
                      }`}
                    >
                      {latest.score}/100
                    </motion.span>
                    <span className="plan-block-detail__gate-date">
                      {format(parseISO(latest.attempt_date), "d MMM yyyy")}
                    </span>
                    <span
                      className={`plan-block-detail__competitor-pill ${
                        latest.passed
                          ? "badge-status-passed"
                          : "badge-status-failed"
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
                  <span className="plan-block-detail__gate-empty">
                    No attempts yet
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setRecordingFor((cur) => (cur === c.id ? null : c.id))
                  }
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
                <div className="plan-block-detail__gate-history">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFor((cur) => (cur === c.id ? null : c.id))
                    }
                    className="plan-block-detail__gate-history-toggle"
                  >
                    {expanded ? "Hide" : "View"} all attempts ({all.length})
                  </button>
                  {expanded ? (
                    <ul className="plan-block-detail__gate-history-list">
                      {all.map((a, idx) => (
                        <li
                          key={a.id}
                          className="plan-block-detail__gate-history-item"
                        >
                          <span>
                            {format(parseISO(a.attempt_date), "d MMM yyyy")}
                          </span>
                          <span>{a.score}/100</span>
                          <span
                            className={`plan-block-detail__competitor-pill ${
                              a.passed
                                ? "badge-status-passed"
                                : "badge-status-failed"
                            }`}
                          >
                            {a.passed ? "Passed" : "Failed"}
                          </span>
                          <span className="plan-block-detail__gate-notes-preview">
                            {a.notes ?? "—"}
                          </span>
                          {idx === 0 ? (
                            <span
                              className="plan-block-detail__current-badge"
                              style={{
                                background: tokens.chip,
                                borderColor: tokens.chipBorder,
                                color: tokens.chipText,
                              }}
                            >
                              Current
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

    </section>
  );
}
