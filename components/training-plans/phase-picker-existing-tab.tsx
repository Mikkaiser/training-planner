"use client";

import { Check } from "lucide-react";

import { subcompetenceChipStyle } from "@/lib/constants/subcompetence-tokens";
import type { Phase } from "@/lib/training-plans/types";
import { cn } from "@/lib/utils";
import { useIsDark } from "@/lib/use-is-dark";
import { Input } from "@/components/ui/input";

type PhasePickerExistingTabProps = {
  query: string;
  onQueryChange: (value: string) => void;
  filtered: Phase[];
  existingDisabledIds: Set<string>;
  existingCardStyle: React.CSSProperties;
  onAddExisting: (phase: Phase) => Promise<void> | void;
};

export function PhasePickerExistingTab({
  query,
  onQueryChange,
  filtered,
  existingDisabledIds,
  existingCardStyle,
  onAddExisting,
}: PhasePickerExistingTabProps): React.JSX.Element {
  const isDark = useIsDark();

  return (
    <div className="max-h-[420px] overflow-y-auto p-3">
      <Input
        aria-label="Search phases"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search phases…"
      />
      <div className="mt-3 space-y-2">
        {filtered.map((phase) => {
          const disabled = existingDisabledIds.has(phase.id);
          return (
            <button
              key={phase.id}
              type="button"
              disabled={disabled}
              onClick={() => void onAddExisting(phase)}
              className={cn(
                "tp-phase-picker-existing-card w-full rounded-xl border px-3 py-2 text-left transition-colors",
                disabled && "cursor-not-allowed opacity-60"
              )}
              style={existingCardStyle}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-tp-primary">
                    {phase.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {phase.subcompetences.slice(0, 4).map((s) => (
                      <span
                        key={s.id}
                        className="subcompetence-chip px-2 py-0.5 text-xs"
                        style={subcompetenceChipStyle(s.color, isDark)}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-3 text-xs text-tp-muted">
                    <span>{phase.blocks.length} blocks</span>
                    <span>{phase.blocks.length} gates</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {disabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-tp-secondary">
                      <Check className="h-3.5 w-3.5" />
                      Added
                    </span>
                  ) : (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-tp-secondary">
                      {phase.duration_weeks ?? "—"}w
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

