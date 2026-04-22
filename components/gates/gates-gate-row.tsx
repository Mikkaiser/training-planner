"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Shield, ShieldCheck } from "lucide-react";

import { AssessmentList } from "@/components/gates/assessment-list";
import { AssessmentUploader } from "@/components/gates/assessment-uploader";
import type { Assessment, Gate } from "@/components/gates/gates-types";

type GatesGateRowProps = {
  gate: Gate;
  assessments: Assessment[];
  queryKey: readonly ["dashboard-gates"];
};

export function GatesGateRow({
  gate,
  assessments,
  queryKey,
}: GatesGateRowProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const Icon = gate.gate_type === "phase_gate" ? ShieldCheck : Shield;

  return (
    <li className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown size={16} className="text-tp-muted" aria-hidden />
        ) : (
          <ChevronRight size={16} className="text-tp-muted" aria-hidden />
        )}
        <Icon size={16} className="text-tp-secondary" aria-hidden />
        <span className="flex-1 text-sm font-medium text-tp-primary">{gate.name}</span>
        <span className="text-xs text-tp-muted">
          {gate.gate_type === "phase_gate" ? "Phase gate" : "Block gate"}
        </span>
        {typeof gate.pass_threshold === "number" ? (
          <span
            className="rounded-full border px-2 py-0.5 text-xs font-medium"
            style={{
              background: "var(--color-accent-muted)",
              borderColor:
                "color-mix(in srgb, var(--color-accent) 25%, transparent)",
              color: "var(--color-accent)",
            }}
          >
            {gate.pass_threshold}%
          </span>
        ) : null}
        <span className="text-xs text-tp-muted">
          {assessments.length} document{assessments.length === 1 ? "" : "s"}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3 pl-6">
          {gate.description ? (
            <p className="text-sm text-tp-secondary">{gate.description}</p>
          ) : null}
          <AssessmentList assessments={assessments} />
          <AssessmentUploader gateId={gate.id} queryKey={queryKey} />
        </div>
      ) : null}
    </li>
  );
}

