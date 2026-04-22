"use client";

import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  onRemove: () => void;
  onNameChange: (name: string) => void;
  onSubcompetenceChange: (subcompetenceId: string | null) => void;
  onPassThresholdChange: (threshold: number | null) => void;
};

export function PhasePickerCreateBlockCard({
  index,
  isLast,
  block,
  selectedSubcompetenceIds,
  subcompetences,
  onRemove,
  onNameChange,
  onSubcompetenceChange,
  onPassThresholdChange,
}: PhasePickerCreateBlockCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-tp-secondary">
          Block {index + 1}
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-negative/90 hover:bg-negative/10"
          onClick={onRemove}
          aria-label="Remove block"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Input
        aria-label={`Block ${index + 1} name`}
        className="mt-2"
        placeholder="Block name"
        value={block.name}
        onChange={(e) => onNameChange(e.target.value)}
      />

      <div className="mt-2">
        <Label
          htmlFor={`phase-picker-block-${index}-macro`}
          className="text-xs font-medium text-tp-secondary"
        >
          Macro-competence
        </Label>
        <select
          id={`phase-picker-block-${index}-macro`}
          className="glass-input mt-1 h-10 w-full rounded-lg px-2 text-sm text-tp-primary"
          value={block.subcompetence_id ?? ""}
          onChange={(e) => onSubcompetenceChange(e.target.value || null)}
        >
          <option value="">—</option>
          {selectedSubcompetenceIds.map((id) => {
            const sc = subcompetences.find((s) => s.id === id);
            return sc ? (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ) : null;
          })}
        </select>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-[var(--color-surface)] p-3">
        <div className="text-xs font-semibold text-tp-primary">Gate</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium text-tp-secondary">Type</Label>
            <div className="mt-1 flex gap-2">
              {(["block_gate", "phase_gate"] as const).map((t) => {
                const active = isLast ? t === "phase_gate" : t === "block_gate";
                return (
                  <button
                    key={t}
                    type="button"
                    disabled
                    className={cn(
                      "rounded-full border px-2 py-1 text-xs",
                      active
                        ? "border-border bg-[var(--color-accent-muted)] text-tp-primary"
                        : "border-border/70 text-tp-secondary opacity-50"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 text-[11px] text-tp-muted">
              Auto: last block is <span className="font-semibold">phase_gate</span>,
              others are <span className="font-semibold">block_gate</span>.
            </div>
          </div>
          <div>
            <Label
              htmlFor={`phase-picker-block-${index}-pass-threshold`}
              className="text-xs font-medium text-tp-secondary"
            >
              Pass threshold %
            </Label>
            <Input
              id={`phase-picker-block-${index}-pass-threshold`}
              className="mt-1"
              type="number"
              min={0}
              max={100}
              value={block.gate_pass_threshold ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onPassThresholdChange(v === "" ? null : Number(v));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

