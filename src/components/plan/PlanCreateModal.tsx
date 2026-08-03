"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clonePlan, createPlan } from "@/actions/plans";
import { Modal } from "@/components/ui/Modal";
import { CrossIcon } from "@/components/ui/icons";
import type { PlanSummaryVM } from "@/lib/plan-view-model";
import { planDetailRoute } from "@/lib/routes";

interface PlanCreateModalProps {
  open: boolean;
  onClose: () => void;
  /** Existing plans offered as starting points. */
  templates: PlanSummaryVM[];
}

type CopyFlags = { blocks: boolean; verbLevels: boolean; exercises: boolean };

/** Design artboards: "Plan creation modal" and "Plan creation · from reference plan". */
export function PlanCreateModal({ open, onClose, templates }: PlanCreateModalProps) {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [title, setTitle] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [copy, setCopy] = useState<CopyFlags>({ blocks: true, verbLevels: true, exercises: false });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const source = templates.find((template) => template.id === sourceId) ?? null;

  const reset = () => {
    setStudentName("");
    setTitle("");
    setSourceId(null);
    setCopy({ blocks: true, verbLevels: true, exercises: false });
    setError(null);
  };

  const submit = () => {
    setError(null);

    if (!studentName.trim() || !title.trim()) {
      setError("Add a competitor name and a plan title.");
      return;
    }

    startTransition(async () => {
      try {
        const result = source
          ? await clonePlan({
              sourcePlanId: source.id,
              studentName: studentName.trim(),
              title: title.trim(),
              copyBlocks: copy.blocks,
              copyVerbLevels: copy.verbLevels,
              copyExercises: copy.exercises,
            })
          : await createPlan({ studentName: studentName.trim(), title: title.trim() });

        reset();
        onClose();
        router.push(planDetailRoute(result.id));
        router.refresh();
      } catch (submitError: unknown) {
        setError(submitError instanceof Error ? submitError.message : "Could not create the plan.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} ariaLabel="New training plan" width={520}>
      <div className="tp-modal-pad">
        <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div className="tp-col" style={{ gap: 4 }}>
            <div className="tp-eyebrow">New plan</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Who are we training?</div>
          </div>
          <button
            type="button"
            className="tp-btn tp-btn-ghost tp-btn-sm"
            style={{ padding: "4px 8px", borderColor: "transparent", color: "var(--ink-2)" }}
            onClick={onClose}
            aria-label="Close"
          >
            <CrossIcon size={12} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="tp-mt-4 tp-col tp-gap-3">
            <Field label="Competitor name" value={studentName} onChange={setStudentName} placeholder="e.g. Hana Berg" autoFocus />
            <Field label="Plan title" value={title} onChange={setTitle} placeholder="e.g. Shanghai Cycle" />
          </div>

          {templates.length > 0 ? (
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <span className="tp-eyebrow">Start from</span>
                <span className="tp-tiny tp-mut">Everything stays editable after</span>
              </div>

              <Option
                selected={sourceId === null}
                onSelect={() => setSourceId(null)}
                title="Blank roadmap"
                subtitle="Build every phase from scratch."
              />

              <div className="tp-col tp-gap-2 tp-mt-2">
                {templates.map((template) => (
                  <Option
                    key={template.id}
                    selected={sourceId === template.id}
                    onSelect={() => setSourceId(template.id)}
                    title={template.title}
                    subtitle={`from ${template.studentName}`}
                    meta={`${template.totals.phases}P · ${template.totals.blocks}B · ${template.totals.exercises}E`}
                  />
                ))}
              </div>

              {source ? (
                <div
                  style={{
                    marginTop: 14,
                    padding: "14px 16px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                >
                  <div className="tp-eyebrow" style={{ marginBottom: 10 }}>
                    Copy from “{source.title}”
                  </div>
                  <div className="tp-col tp-gap-2">
                    <Toggle
                      label="Phases &amp; blocks"
                      hint={`${source.totals.phases} phases · ${source.totals.blocks} blocks`}
                      on={copy.blocks}
                      onChange={(on) => setCopy((state) => ({ ...state, blocks: on }))}
                    />
                    <Toggle
                      label="Verb levels"
                      hint="Per-block targets"
                      on={copy.verbLevels}
                      disabled={!copy.blocks}
                      onChange={(on) => setCopy((state) => ({ ...state, verbLevels: on }))}
                    />
                    <Toggle
                      label="Exercise files"
                      hint={`${source.totals.exercises} file${source.totals.exercises === 1 ? "" : "s"}`}
                      on={copy.exercises}
                      disabled={!copy.blocks || source.totals.exercises === 0}
                      onChange={(on) => setCopy((state) => ({ ...state, exercises: on }))}
                    />
                    <Toggle label="Gate results" hint="Never copied — always starts clean" on={false} locked />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="tp-tiny" style={{ color: "var(--neg)", marginTop: 12, marginBottom: 0 }}>
              {error}
            </p>
          ) : null}

          <div className="tp-mt-4 tp-row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div className="tp-tiny tp-mut tp-row tp-gap-2">
              <span
                className="tp-mono"
                style={{ background: "rgba(28,31,51,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}
              >
                ↵
              </span>
              to create
            </div>
            <div className="tp-row tp-gap-2">
              <button type="button" className="tp-btn tp-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="tp-btn tp-btn-primary" disabled={pending}>
                {pending ? "Creating…" : source ? "Create & open roadmap" : "Create Plan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="tp-col tp-gap-2">
      <span className="tp-eyebrow">{label}</span>
      <input
        className="tp-input"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        style={{ padding: "11px 14px" }}
      />
    </label>
  );
}

function Option({
  selected,
  onSelect,
  title,
  subtitle,
  meta,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 12,
        background: selected ? "var(--accent-soft)" : "var(--surface)",
        border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        boxShadow: selected ? "0 0 0 3px var(--accent-soft)" : "none",
        cursor: "pointer",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          flexShrink: 0,
          marginTop: 2,
          border: `1.5px solid ${selected ? "var(--ink)" : "var(--border-strong)"}`,
          background: selected ? "var(--ink)" : "transparent",
          display: "grid",
          placeItems: "center",
        }}
      >
        {selected ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} /> : null}
      </span>
      <span className="tp-col" style={{ gap: 5, flex: 1, minWidth: 0 }}>
        <span className="tp-row" style={{ justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</span>
          {meta ? (
            <span className="tp-tiny tp-mono tp-mut" style={{ flexShrink: 0 }}>
              {meta}
            </span>
          ) : null}
        </span>
        <span className="tp-tiny tp-mut">{subtitle}</span>
      </span>
    </button>
  );
}

function Toggle({
  label,
  hint,
  on,
  locked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  locked?: boolean;
  disabled?: boolean;
  onChange?: (on: boolean) => void;
}) {
  const inert = locked || disabled;

  return (
    <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12, opacity: inert ? 0.55 : 1 }}>
      <div className="tp-col" style={{ gap: 1 }}>
        <div className="tp-sm" style={{ fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: label }} />
        <div className="tp-tiny tp-mut">{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label.replace(/&amp;/g, "&")}
        disabled={inert}
        onClick={() => onChange?.(!on)}
        style={{
          width: 34,
          height: 20,
          borderRadius: 999,
          flexShrink: 0,
          background: on ? "var(--accent)" : "rgba(28,31,51,0.12)",
          border: `1px solid ${on ? "rgba(28,31,51,0.14)" : "transparent"}`,
          position: "relative",
          cursor: inert ? "default" : "pointer",
          padding: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 1px 2px rgba(28,31,51,0.25)",
            transition: "left .15s",
          }}
        />
      </button>
    </div>
  );
}
