"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhasePickerCreateBlocks } from "@/components/training-plans/phase-picker-create-blocks";
import { PhasePickerCreateSubcompetences } from "@/components/training-plans/phase-picker-create-subcompetences";
import { useTrainingPlanEditorShortcuts } from "@/components/training-plans/training-plan-editor-shortcuts-context";
import type { PlanColorKey } from "@/lib/constants/plan-colors";
import { useCreatePhaseFromForm } from "@/lib/hooks/use-create-phase-from-form";
import type { UploadResult } from "@/lib/storage/storage";
import { usePhasePickerCreateForm } from "@/lib/hooks/use-phase-picker-create-form";
import type { Phase, Subcompetence } from "@/lib/training-plans/types";

type PhasePickerCreateFormProps = {
  subcompetences: Subcompetence[];
  createdBy: string;
  planPhaseCount: number;
  planColor: PlanColorKey;
  creating: boolean;
  onCancel: () => void;
  onUnsavedChange: (hasUnsavedChanges: boolean) => void;
  onCreatingChange: (value: boolean) => void;
  onCreated: (phase: Phase) => Promise<void> | void;
  onCreatedDone: () => void;
};

export function PhasePickerCreateForm({
  subcompetences,
  createdBy,
  planPhaseCount,
  planColor,
  creating,
  onCancel,
  onUnsavedChange,
  onCreatingChange,
  onCreated,
  onCreatedDone,
}: PhasePickerCreateFormProps): React.JSX.Element {
  const { form, values, blockFields, addBlock, removeBlock, toggleSubcompetenceId, subcompetenceError } =
    usePhasePickerCreateForm();
  const createPhase = useCreatePhaseFromForm();
  const { registerSaveInterceptor } = useTrainingPlanEditorShortcuts();
  const [exerciseUploads, setExerciseUploads] = useState<Array<UploadResult | null>>([null]);

  useEffect(() => {
    if (exerciseUploads.length === blockFields.length) return;
    setExerciseUploads((prev) => {
      const next = [...prev];
      while (next.length < blockFields.length) next.push(null);
      return next.slice(0, blockFields.length);
    });
  }, [blockFields.length, exerciseUploads.length]);

  const hasUnsavedChanges = useMemo(
    () => form.formState.isDirty || values.blocks.length > 1 || exerciseUploads.some(Boolean),
    [exerciseUploads, form.formState.isDirty, values.blocks.length],
  );

  useEffect(() => {
    onUnsavedChange(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChange]);

  const handleCreateAndAdd = form.handleSubmit(async (submittedValues) => {
    onCreatingChange(true);
    try {
      const phase = await createPhase.mutateAsync({
        values: submittedValues,
        subcompetences,
        createdBy,
        planPhaseCount,
        exerciseUploads,
      });
      await onCreated(phase);
      form.reset();
      setExerciseUploads([null]);
      onUnsavedChange(false);
      onCreatedDone();
    } finally {
      onCreatingChange(false);
    }
  });

  useEffect(() => {
    return registerSaveInterceptor(async () => {
      if (creating || createPhase.isPending) return false;
      if (!hasUnsavedChanges) return true;

      const isValid = await form.trigger();
      if (!isValid) return false;

      await handleCreateAndAdd();
      return true;
    });
  }, [
    createPhase.isPending,
    creating,
    form,
    handleCreateAndAdd,
    hasUnsavedChanges,
    registerSaveInterceptor,
  ]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleCreateAndAdd();
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <Label htmlFor="phase-picker-name" className="text-[14px] font-medium text-tp-secondary">
            Phase name <span className="text-negative">*</span>
          </Label>
          <Input
            id="phase-picker-name"
            className="mt-1 min-h-[46px] text-[15px]"
            {...form.register("name")}
          />
          {form.formState.errors.name?.message ? (
            <p className="mt-1 text-xs text-negative">
              {form.formState.errors.name.message}
            </p>
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
          createdBy={createdBy}
          planColor={planColor}
          exerciseUploads={exerciseUploads}
          onAddBlock={() => {
            addBlock();
            setExerciseUploads((prev) => [...prev, null]);
          }}
          onRemoveBlock={(index) => {
            removeBlock(index);
            setExerciseUploads((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
          }}
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
          onBlockExerciseUploadChange={(index, upload) =>
            setExerciseUploads((prev) => {
              const next = [...prev];
              next[index] = upload;
              return next;
            })
          }
        />
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={creating}>
            {creating ? "Creating..." : "Create Phase"}
          </Button>
        </div>
      </div>
    </form>
  );
}

