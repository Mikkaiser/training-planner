"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { CompetenceType, VerbLevel } from "@/lib/types";

export type BlockFormValues = {
  title: string;
  description: string;
  verbLevel: VerbLevel;
  competenceType: CompetenceType;
  hours: number;
};

const VERB_LEVELS: VerbLevel[] = ["Recognize", "Apply", "Produce", "Optimize"];
const COMPETENCE_TYPES: CompetenceType[] = ["Development", "Testing", "Analysis & Design", "Transversal"];

const DEFAULTS: BlockFormValues = {
  title: "",
  description: "",
  verbLevel: "Apply",
  competenceType: "Development",
  hours: 8,
};

interface BlockFormModalProps {
  open: boolean;
  /** Modal heading (e.g. "New Block" / "Edit Block"). */
  title: string;
  submitLabel: string;
  initialValues?: Partial<BlockFormValues>;
  onClose: () => void;
  onSubmit: (values: BlockFormValues) => Promise<void>;
}

const labelStyle = {
  fontSize: "11px",
  color: "var(--ink-2)",
  textTransform: "uppercase" as const,
  fontWeight: 600,
};

export function BlockFormModal({ open, title, submitLabel, initialValues, onClose, onSubmit }: BlockFormModalProps) {
  const [values, setValues] = useState<BlockFormValues>({ ...DEFAULTS, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Reset the form to the supplied values each time the modal opens.
  useEffect(() => {
    if (open) {
      setValues({ ...DEFAULTS, ...initialValues });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof BlockFormValues>(key: K, value: BlockFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    setError(null);

    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) {
      setError("Block title is required.");
      return;
    }
    if (!Number.isFinite(values.hours) || values.hours < 0) {
      setError("Hours must be a positive number.");
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit({
          ...values,
          title: trimmedTitle,
          description: values.description.trim(),
        });
        onClose();
      } catch (submitError: unknown) {
        setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div style={{ display: "grid", gap: "10px", marginTop: "8px" }}>
        <label className="tp-mono" style={labelStyle}>
          Title
        </label>
        <input
          className="tp-input"
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="e.g. Build a REST endpoint"
        />
      </div>

      <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
        <label className="tp-mono" style={labelStyle}>
          Description
        </label>
        <textarea
          className="tp-input"
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          rows={3}
          placeholder="What should the competitor practice in this block?"
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: "14px", marginTop: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: "10px", flex: 1, minWidth: "160px" }}>
          <label className="tp-mono" style={labelStyle}>
            Competence
          </label>
          <select
            className="tp-input"
            value={values.competenceType}
            onChange={(event) => set("competenceType", event.target.value as CompetenceType)}
          >
            {COMPETENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: "10px", flex: 1, minWidth: "160px" }}>
          <label className="tp-mono" style={labelStyle}>
            Verb Level
          </label>
          <select
            className="tp-input"
            value={values.verbLevel}
            onChange={(event) => set("verbLevel", event.target.value as VerbLevel)}
          >
            {VERB_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: "10px", width: "120px" }}>
          <label className="tp-mono" style={labelStyle}>
            Hours
          </label>
          <input
            className="tp-input"
            type="number"
            min={0}
            step={0.5}
            value={Number.isNaN(values.hours) ? "" : values.hours}
            onChange={(event) => set("hours", event.target.value === "" ? NaN : Number(event.target.value))}
          />
        </div>
      </div>

      {error ? <p style={{ color: "var(--neg)", marginTop: "12px", marginBottom: 0, fontSize: "12px" }}>{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </Modal>
  );
}
