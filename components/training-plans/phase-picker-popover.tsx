"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { PhasePickerCreateTab } from "@/components/training-plans/phase-picker-create-tab";
import { PhasePickerExistingTab } from "@/components/training-plans/phase-picker-existing-tab";
import { cn } from "@/lib/utils";
import { PLAN_COLORS, type PlanColorKey } from "@/lib/constants/plan-colors";
import type {
  Phase,
  Subcompetence,
} from "@/lib/training-plans/types";

export function PhasePickerPopover({
  existingPhases,
  existingDisabledIds,
  subcompetences,
  onAddExisting,
  onCreated,
  createdBy,
  planPhaseCount,
  triggerClassName,
  planColor = "blue",
}: {
  existingPhases: Phase[];
  existingDisabledIds: Set<string>;
  subcompetences: Subcompetence[];
  onAddExisting: (phase: Phase) => Promise<void> | void;
  onCreated: (phase: Phase) => Promise<void> | void;
  createdBy: string;
  planPhaseCount: number;
  triggerClassName?: string;
  /** Active plan color — used to tint phase cards inside the popover. */
  planColor?: PlanColorKey;
}) {
  const planTokens = PLAN_COLORS[planColor];
  const popoverTintStyle: React.CSSProperties = {
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-tint" as string]: planTokens.bg,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-tint-strong" as string]: planTokens.bgStrong,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-chip-border" as string]: planTokens.chipBorder,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-border" as string]: planTokens.border,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-accent" as string]: planTokens.accent,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-glow" as string]: planTokens.glow,
  };
  // Only the color tokens are passed as inline style; base/hover surface colors
  // come from the `.tp-phase-picker-existing-card` rule in globals.css, which is
  // dark-mode aware.
  const existingCardStyle: React.CSSProperties = {
    borderColor: planTokens.chipBorder,
    borderLeft: `3px solid ${planTokens.border}`,
  };
  const [tab, setTab] = useState<"existing" | "create">("existing");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = existingPhases.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const onQueryChange = (value: string) => setQuery(value);

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "default", size: "sm" }),
          "gap-2",
          triggerClassName
        )}
      >
        <Plus className="h-4 w-4" />
        Add Phase
        <ChevronDown className="h-4 w-4 opacity-80" />
      </PopoverTrigger>
      <PopoverContent className="p-0" style={popoverTintStyle}>
        <div className="border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-tp-primary">Add a phase</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("existing")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                tab === "existing"
                  ? "border-border bg-[var(--color-accent-muted)] text-tp-primary"
                  : "hover-tint border-border/70 text-tp-secondary"
              )}
            >
              Existing phases
            </button>
            <button
              type="button"
              onClick={() => setTab("create")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                tab === "create"
                  ? "border-border bg-[var(--color-accent-muted)] text-tp-primary"
                  : "hover-tint border-border/70 text-tp-secondary"
              )}
            >
              Create new phase
            </button>
          </div>
        </div>

        {tab === "existing" ? (
          <PhasePickerExistingTab
            query={query}
            onQueryChange={onQueryChange}
            filtered={filtered}
            existingDisabledIds={existingDisabledIds}
            existingCardStyle={existingCardStyle}
            onAddExisting={onAddExisting}
          />
        ) : (
          <PhasePickerCreateTab
            subcompetences={subcompetences}
            createdBy={createdBy}
            planPhaseCount={planPhaseCount}
            creating={creating}
            onCreatingChange={setCreating}
            onCreated={onCreated}
            onCreatedDone={() => setTab("existing")}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

