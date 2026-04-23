"use client";

import { Trash2 } from "lucide-react";

import { FileUpload } from "@/components/shared/file-upload";
import { SubcompetenceDropdown } from "@/components/shared/subcompetence-dropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { UploadResult } from "@/lib/storage/storage";
import type { Subcompetence } from "@/lib/training-plans/types";

type BlockValue = {
  name: string;
  subcompetence_id: string | null;
  gate_pass_threshold: number | null;
};

type PhasePickerCreateBlockCardProps = {
  index: number;
  isLast: boolean;
  block: BlockValue;
  selectedSubcompetenceIds: string[];
  subcompetences: Subcompetence[];
  createdBy: string;
  planColor: PlanColorKey;
  exerciseUpload: UploadResult | null;
  onRemove: () => void;
  onNameChange: (name: string) => void;
  onSubcompetenceChange: (subcompetenceId: string | null) => void;
  onPassThresholdChange: (threshold: number | null) => void;
  onExerciseUploadChange: (upload: UploadResult | null) => void;
};

export function PhasePickerCreateBlockCard({
  index,
  isLast,
  block,
  selectedSubcompetenceIds,
  subcompetences,
  createdBy,
  planColor,
  exerciseUpload,
  onRemove,
  onNameChange,
  onSubcompetenceChange,
  onPassThresholdChange,
  onExerciseUploadChange,
}: PhasePickerCreateBlockCardProps): React.JSX.Element {
  const availableSubcompetences = selectedSubcompetenceIds
    .map((subcompetenceId) => subcompetences.find((subcompetence) => subcompetence.id === subcompetenceId))
    .filter(Boolean) as Subcompetence[];

  const gateLabel = isLast ? "Phase Gate" : "Block Gate";
  const thresholdValue =
    block.gate_pass_threshold ?? (isLast ? 80 : 90);

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold text-tp-primary">
          Block {index + 1}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove block"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Label className="mt-2 block text-[14px] font-medium text-tp-secondary">
        Block name <span className="text-negative">*</span>
      </Label>
      <Input
        aria-label={`Block ${index + 1} name`}
        className="mt-1 min-h-[46px] text-[14px]"
        placeholder="e.g. Block 0 — Language Fundamentals"
        value={block.name}
        onChange={(e) => onNameChange(e.target.value)}
      />

      <div className="mt-3">
        <Label
          htmlFor={`phase-picker-block-${index}-macro`}
          className="text-[14px] font-medium text-tp-secondary"
        >
          Macro-competence
        </Label>
        <div className="mt-1">
          <SubcompetenceDropdown
          id={`phase-picker-block-${index}-macro`}
            options={availableSubcompetences}
            value={block.subcompetence_id}
            onChange={onSubcompetenceChange}
            placeholder="Select macro-competence"
          />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-[var(--color-surface)] p-3">
        <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-tp-muted">
          Gate
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[140px]">
            <Label className="text-[14px] font-medium text-tp-secondary">Type</Label>
            <div className="mt-1 text-[15px] font-semibold text-tp-primary">{gateLabel}</div>
          </div>
          <div>
            <Label
              htmlFor={`phase-picker-block-${index}-pass-threshold`}
              className="text-[14px] font-medium text-tp-secondary"
            >
              Pass threshold
            </Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id={`phase-picker-block-${index}-pass-threshold`}
                className="min-h-[46px] w-[80px] text-center text-[16px] font-bold"
                type="number"
                min={0}
                max={100}
                value={thresholdValue}
                onChange={(e) => {
                  const value = e.target.value;
                  onPassThresholdChange(value === "" ? null : Number(value));
                }}
              />
              <span className="text-[16px] font-bold text-tp-primary">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-[14px] font-medium text-tp-secondary">
          Add exercise (optional)
        </Label>
        <div className="mt-1">
          <FileUpload
            key={exerciseUpload?.path ?? `block-upload-${index}`}
            bucket="exercises"
            folder={`draft-phases/${createdBy}/block-${index + 1}`}
            allowed={["pdf", "docx", "zip"]}
            planColor={planColor}
            label="Add exercise (optional)"
            onUploadComplete={onExerciseUploadChange}
          />
        </div>
        {exerciseUpload ? (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-tp-secondary">
            <span className="truncate">{exerciseUpload.fileName}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onExerciseUploadChange(null)}>
              Remove
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

