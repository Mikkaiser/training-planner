"use client";

import { subcompetenceChipStyle } from "@/lib/constants/subcompetence-tokens";
import { cn } from "@/lib/utils";
import { useIsDark } from "@/lib/use-is-dark";
import type { Subcompetence } from "@/lib/training-plans/types";
import { Label } from "@/components/ui/label";

type PhasePickerCreateSubcompetencesProps = {
  subcompetences: Subcompetence[];
  selectedIds: string[];
  onToggleSelectedId: (id: string) => void;
  errorMessage?: string;
};

const SEEDED_SUBCOMPETENCE_NAMES = new Set([
  "Analysis & Design",
  "Development",
  "Testing",
  "Transversal",
]);

export function PhasePickerCreateSubcompetences({
  subcompetences,
  selectedIds,
  onToggleSelectedId,
  errorMessage,
}: PhasePickerCreateSubcompetencesProps): React.JSX.Element {
  const isDark = useIsDark();
  const seededSubcompetences = subcompetences.filter((subcompetence) =>
    SEEDED_SUBCOMPETENCE_NAMES.has(subcompetence.name),
  );

  return (
    <div>
      <Label className="text-[16px] font-bold text-tp-primary">
        Subcompetences <span className="text-negative">*</span>
      </Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {seededSubcompetences.map((s) => {
          const selected = selectedIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggleSelectedId(s.id)}
              className={cn(
                "subcompetence-chip px-3 py-1.5 text-sm transition-all",
                selected
                  ? "opacity-100 ring-1 ring-[var(--color-border-hover)]"
                  : "opacity-55 hover:opacity-75"
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
    </div>
  );
}

