"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhasePickerCreateBlocks } from "@/components/training-plans/phase-picker-create-blocks";
import { PhasePickerCreateSubcompetences } from "@/components/training-plans/phase-picker-create-subcompetences";
import { useCreatePhaseFromForm } from "@/lib/hooks/use-create-phase-from-form";
import { usePhasePickerCreateForm } from "@/lib/hooks/use-phase-picker-create-form";
import type { Phase, Subcompetence } from "@/lib/training-plans/types";

type PhasePickerCreateFormProps = {
  subcompetences: Subcompetence[];
  createdBy: string;
  planPhaseCount: number;
  creating: boolean;
  onCreatingChange: (value: boolean) => void;
  onCreated: (phase: Phase) => Promise<void> | void;
  onCreatedDone: () => void;
};

export function PhasePickerCreateForm({
  subcompetences,
  createdBy,
  planPhaseCount,
  creating,
  onCreatingChange,
  onCreated,
  onCreatedDone,
}: PhasePickerCreateFormProps): React.JSX.Element {
  const { form, values, blockFields, addBlock, removeBlock, toggleSubcompetenceId, subcompetenceError } =
    usePhasePickerCreateForm();
  const createPhase = useCreatePhaseFromForm();
  const newSc = values.newSubcompetence ?? {
    enabled: false,
    name: "",
    color: "var(--color-text-accent)",
    icon: "dot",
  };

  async function handleCreateAndAdd(): Promise<void> {
    onCreatingChange(true);
    try {
      const phase = await createPhase.mutateAsync({
        values: form.getValues(),
        subcompetences,
        createdBy,
        planPhaseCount,
      });
      await onCreated(phase);
      form.reset();
      onCreatedDone();
    } finally {
      onCreatingChange(false);
    }
  }

  return (
    <div className="max-h-[520px] overflow-y-auto p-3">
      <div className="space-y-4">
        <div>
          <Label htmlFor="phase-picker-name" className="text-sm font-medium text-tp-secondary">
            Phase name <span className="text-negative">*</span>
          </Label>
          <Input id="phase-picker-name" className="mt-2" {...form.register("name")} />
          {form.formState.errors.name?.message ? (
            <p className="mt-1 text-xs text-negative">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label
            htmlFor="phase-picker-duration"
            className="text-sm font-medium text-tp-secondary"
          >
            Duration (weeks) <span className="text-negative">*</span>
          </Label>
          <Input
            id="phase-picker-duration"
            className="mt-2"
            type="number"
            min={1}
            {...form.register("duration_weeks")}
          />
        </div>

        <PhasePickerCreateSubcompetences
          subcompetences={subcompetences}
          selectedIds={values.subcompetence_ids}
          onToggleSelectedId={toggleSubcompetenceId}
          errorMessage={subcompetenceError}
          newSubcompetence={{
            enabled: newSc.enabled ?? false,
            name: newSc.name ?? "",
            color: newSc.color ?? "var(--color-text-accent)",
            icon: newSc.icon ?? "dot",
          }}
          onNewSubcompetenceEnabledChange={(enabled) =>
            form.setValue("newSubcompetence.enabled", enabled)
          }
          onNewSubcompetenceNameChange={(name) =>
            form.setValue("newSubcompetence.name", name)
          }
          onNewSubcompetenceColorChange={(color) =>
            form.setValue("newSubcompetence.color", color)
          }
          onNewSubcompetenceIconChange={(icon) =>
            form.setValue("newSubcompetence.icon", icon)
          }
        />

        <PhasePickerCreateBlocks
          blockFields={blockFields}
          blocks={values.blocks}
          selectedSubcompetenceIds={values.subcompetence_ids}
          subcompetences={subcompetences}
          onAddBlock={addBlock}
          onRemoveBlock={removeBlock}
          onBlockNameChange={(index, name) =>
            form.setValue(`blocks.${index}.name`, name)
          }
          onBlockSubcompetenceChange={(index, subcompetenceId) =>
            form.setValue(`blocks.${index}.subcompetence_id`, subcompetenceId)
          }
          onBlockPassThresholdChange={(index, threshold) =>
            form.setValue(`blocks.${index}.gate_pass_threshold`, threshold)
          }
        />

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={creating}
          onClick={() => void handleCreateAndAdd()}
        >
          {creating ? "Creating…" : "Create & Add to Plan"}
        </Button>
      </div>
    </div>
  );
}

