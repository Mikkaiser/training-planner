"use client";

import { subcompetenceChipStyle } from "@/lib/constants/subcompetence-tokens";
import { cn } from "@/lib/utils";
import { useIsDark } from "@/lib/use-is-dark";
import type { Subcompetence } from "@/lib/training-plans/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PhasePickerNewSubcompetence = {
  enabled: boolean;
  name: string;
  color: string;
  icon: string;
};

type PhasePickerCreateSubcompetencesProps = {
  subcompetences: Subcompetence[];
  selectedIds: string[];
  onToggleSelectedId: (id: string) => void;
  errorMessage?: string;
  newSubcompetence: PhasePickerNewSubcompetence;
  onNewSubcompetenceEnabledChange: (enabled: boolean) => void;
  onNewSubcompetenceNameChange: (name: string) => void;
  onNewSubcompetenceColorChange: (color: string) => void;
  onNewSubcompetenceIconChange: (icon: string) => void;
};

export function PhasePickerCreateSubcompetences({
  subcompetences,
  selectedIds,
  onToggleSelectedId,
  errorMessage,
  newSubcompetence,
  onNewSubcompetenceEnabledChange,
  onNewSubcompetenceNameChange,
  onNewSubcompetenceColorChange,
  onNewSubcompetenceIconChange,
}: PhasePickerCreateSubcompetencesProps): React.JSX.Element {
  const isDark = useIsDark();

  return (
    <div>
      <Label className="text-sm font-medium text-tp-secondary">
        Subcompetences <span className="text-negative">*</span>
      </Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {subcompetences.map((s) => {
          const selected = selectedIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggleSelectedId(s.id)}
              className={cn(
                "subcompetence-chip px-2 py-1 text-xs transition-opacity",
                selected ? "" : "opacity-50 hover:opacity-75"
              )}
              style={subcompetenceChipStyle(s.color, isDark)}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      {errorMessage ? (
        <p className="mt-1 text-xs text-negative">{errorMessage}</p>
      ) : null}

      <div className="mt-3 rounded-xl border border-border bg-[var(--color-surface)] p-3">
        <label
          htmlFor="phase-picker-new-subcompetence-enabled"
          className="flex items-center gap-2 text-xs text-tp-secondary"
        >
          <input
            id="phase-picker-new-subcompetence-enabled"
            type="checkbox"
            checked={newSubcompetence.enabled}
            onChange={(e) => onNewSubcompetenceEnabledChange(e.target.checked)}
          />
          New subcompetence
        </label>

        {newSubcompetence.enabled ? (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label
                htmlFor="phase-picker-new-subcompetence-name"
                className="text-xs font-medium text-tp-secondary"
              >
                Name
              </Label>
              <Input
                id="phase-picker-new-subcompetence-name"
                className="mt-1"
                value={newSubcompetence.name}
                onChange={(e) => onNewSubcompetenceNameChange(e.target.value)}
              />
            </div>
            <div>
              <Label
                htmlFor="phase-picker-new-subcompetence-color"
                className="text-xs font-medium text-tp-secondary"
              >
                Color
              </Label>
              <input
                id="phase-picker-new-subcompetence-color"
                type="color"
                className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-border bg-transparent"
                value={newSubcompetence.color}
                onChange={(e) => onNewSubcompetenceColorChange(e.target.value)}
              />
            </div>
            <div>
              <Label
                htmlFor="phase-picker-new-subcompetence-icon"
                className="text-xs font-medium text-tp-secondary"
              >
                Icon
              </Label>
              <select
                id="phase-picker-new-subcompetence-icon"
                className="glass-input mt-1 h-10 w-full rounded-lg px-2 text-sm text-tp-primary"
                value={newSubcompetence.icon}
                onChange={(e) => onNewSubcompetenceIconChange(e.target.value)}
              >
                <option value="dot">Dot</option>
                <option value="code">Code</option>
                <option value="flask">Flask</option>
                <option value="puzzle">Puzzle</option>
              </select>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

