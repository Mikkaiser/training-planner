"use client";

import { useEffect, useMemo, useState } from "react";

import { PhasePickerCreateBlocks } from "@/components/training-plans/phase-picker-create-blocks";
import { PhasePickerCreateSubcompetences } from "@/components/training-plans/phase-picker-create-subcompetences";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePhasePickerCreateForm } from "@/lib/hooks/use-phase-picker-create-form";
import { useUpdatePhaseFromForm } from "@/lib/hooks/use-update-phase-from-form";
import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { Phase, Subcompetence } from "@/lib/training-plans/types";

type PhaseEditDialogProps = {
  open: boolean;
  phase: Phase;
  subcompetences: Subcompetence[];
  planColor: PlanColorKey;
  onOpenChange: (open: boolean) => void;
  onUpdated: (phase: Phase) => void;
};

export function PhaseEditDialog({
  open,
  phase,
  subcompetences,
  planColor,
  onOpenChange,
  onUpdated,
}: PhaseEditDialogProps): React.JSX.Element {
  const initialValues = useMemo(
    () => ({
      name: phase.name,
      subcompetence_ids: phase.subcompetences.map((s) => s.id),
      blocks: phase.blocks
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((b, idx, arr) => ({
          name: b.name,
          subcompetence_id: b.subcompetence_id ?? null,
          gate_pass_threshold: b.gate.pass_threshold ?? (idx === arr.length - 1 ? 80 : 90),
        })),
    }),
    [phase.blocks, phase.name, phase.subcompetences]
  );

  const { form, values, blockFields, addBlock, removeBlock, toggleSubcompetenceId, subcompetenceError } =
    usePhasePickerCreateForm(initialValues);
  const updatePhase = useUpdatePhaseFromForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.reset(initialValues);
  }, [form, initialValues, open]);

  const existingBlocks = useMemo(
    () =>
      phase.blocks
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((b) => ({
          topic_id: b.id ?? null,
          gate_id: b.gate.id ?? null,
        })),
    [phase.blocks]
  );

  const handleSave = form.handleSubmit(async (submittedValues) => {
    setSaving(true);
    try {
      const updated = await updatePhase.mutateAsync({
        phaseId: phase.id,
        values: submittedValues,
        subcompetences,
        existingBlocks,
      });
      onUpdated(updated);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel--strong h-[85vh] w-[80vw] max-w-[80vw] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Edit phase</DialogTitle>
          <DialogDescription>Update the phase structure used by this plan.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
          className="flex h-full flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div>
              <Label htmlFor="phase-edit-name" className="text-[14px] font-medium text-tp-secondary">
                Phase name <span className="text-negative">*</span>
              </Label>
              <Input id="phase-edit-name" className="mt-1 min-h-[46px] text-[15px]" {...form.register("name")} />
              {form.formState.errors.name?.message ? (
                <p className="mt-1 text-xs text-negative">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <PhasePickerCreateSubcompetences
              subcompetences={subcompetences}
              selectedIds={values.subcompetence_ids}
              onToggleSelectedId={toggleSubcompetenceId}
              errorMessage={subcompetenceError}
            />

            <PhasePickerCreateBlocks
              blockFields={blockFields}
              blocks={values.blocks}
              selectedSubcompetenceIds={values.subcompetence_ids}
              subcompetences={subcompetences}
              createdBy={"phase-edit"}
              planColor={planColor}
              exerciseUploads={values.blocks.map(() => null)}
              showExerciseUpload={false}
              onAddBlock={addBlock}
              onRemoveBlock={removeBlock}
              onBlockNameChange={(index, name) =>
                form.setValue(`blocks.${index}.name`, name, { shouldValidate: true, shouldDirty: true })
              }
              onBlockSubcompetenceChange={(index, subcompetenceId) =>
                form.setValue(`blocks.${index}.subcompetence_id`, subcompetenceId, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              onBlockPassThresholdChange={(index, threshold) =>
                form.setValue(`blocks.${index}.gate_pass_threshold`, threshold, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              onBlockExerciseUploadChange={() => {
                // Exercise uploads are intentionally disabled in edit mode.
              }}
            />
          </div>

          <DialogFooter className="border-t border-border px-5 py-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={saving || updatePhase.isPending}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

