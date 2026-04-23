"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [hasUnsavedCreateChanges, setHasUnsavedCreateChanges] = useState(false);
  const [createFormInstanceKey, setCreateFormInstanceKey] = useState(0);

  const filtered = existingPhases.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const onQueryChange = (value: string) => setQuery(value);

  const closeCreateModalImmediately = () => {
    setCreateModalOpen(false);
    setHasUnsavedCreateChanges(false);
    setTab("existing");
  };

  const requestCloseCreateModal = () => {
    if (hasUnsavedCreateChanges) {
      setConfirmDiscardOpen(true);
      return;
    }
    closeCreateModalImmediately();
  };

  return (
    <>
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
                onClick={() => {
                  setTab("create");
                  setCreateModalOpen(true);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  createModalOpen
                    ? "border-border bg-[var(--color-accent-muted)] text-tp-primary"
                    : "hover-tint border-border/70 text-tp-secondary"
                )}
              >
                Create new phase
              </button>
            </div>
          </div>

          <PhasePickerExistingTab
            query={query}
            onQueryChange={onQueryChange}
            filtered={filtered}
            existingDisabledIds={existingDisabledIds}
            existingCardStyle={existingCardStyle}
            onAddExisting={onAddExisting}
          />
        </PopoverContent>
      </Popover>

      <Dialog
        open={createModalOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setCreateModalOpen(true);
            return;
          }
          requestCloseCreateModal();
        }}
      >
        <DialogContent
          className="glass-panel--strong h-[85vh] w-[80vw] max-w-[80vw] gap-0 overflow-hidden p-0"
          showCloseButton={false}
        >
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>Create New Phase</DialogTitle>
          </DialogHeader>
          <PhasePickerCreateTab
            key={createFormInstanceKey}
            subcompetences={subcompetences}
            createdBy={createdBy}
            planPhaseCount={planPhaseCount}
            planColor={planColor}
            creating={creating}
            onCancel={requestCloseCreateModal}
            onUnsavedChange={setHasUnsavedCreateChanges}
            onCreatingChange={setCreating}
            onCreated={onCreated}
            onCreatedDone={closeCreateModalImmediately}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <DialogContent className="max-w-[420px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes in the phase form. If you leave now all your
              progress will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              onClick={() => setConfirmDiscardOpen(false)}
            >
              Keep editing
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
              onClick={() => {
                setConfirmDiscardOpen(false);
                closeCreateModalImmediately();
                setCreateFormInstanceKey((currentKey) => currentKey + 1);
              }}
            >
              Discard
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

