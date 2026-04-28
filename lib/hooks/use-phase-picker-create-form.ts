"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import type { Resolver, UseFormReturn } from "react-hook-form";

import {
  createPhaseSchema,
  type CreatePhaseValues,
} from "@/components/training-plans/phase-picker-schemas";

type UsePhasePickerCreateFormReturn = {
  form: UseFormReturn<CreatePhaseValues>;
  values: CreatePhaseValues;
  blockFields: Array<{ id: string }>;
  addBlock: () => void;
  removeBlock: (index: number) => void;
  toggleSubcompetenceId: (id: string) => void;
  subcompetenceError?: string;
};

function defaultCreatePhaseValues(): CreatePhaseValues {
  return {
    name: "",
    subcompetence_ids: [],
    blocks: [
      {
        name: "Block 1",
        subcompetence_id: null,
        gate_pass_threshold: 80,
      },
    ],
  };
}

export function usePhasePickerCreateForm(
  initialValues?: CreatePhaseValues
): UsePhasePickerCreateFormReturn {
  const form = useForm<CreatePhaseValues>({
    // `zodResolver()` typing doesn't preserve the inferred schema value type.
    // This is safe because `createPhaseSchema` is the single source of truth.
    resolver: zodResolver(createPhaseSchema) as unknown as Resolver<CreatePhaseValues>,
    defaultValues: initialValues ?? defaultCreatePhaseValues(),
    mode: "onChange",
  });

  const { fields: blockFields, replace } = useFieldArray({
    control: form.control,
    name: "blocks",
  });

  const values = form.watch();

  const subcompetenceError =
    typeof form.formState.errors.subcompetence_ids?.message === "string"
      ? form.formState.errors.subcompetence_ids.message
      : undefined;

  function addBlock(): void {
    const currentBlocks = form.getValues("blocks");
    const nextLen = currentBlocks.length + 1;
    const updatedCurrent = currentBlocks.map((b, i) => ({
      ...b,
      gate_pass_threshold:
        i === currentBlocks.length - 1 &&
        (b.gate_pass_threshold === null || b.gate_pass_threshold === 80)
          ? 90
          : b.gate_pass_threshold,
    }));

    replace([
      ...updatedCurrent,
      {
        name: `Block ${nextLen}`,
        subcompetence_id: null,
        gate_pass_threshold: 80,
      },
    ]);
  }

  function removeBlock(index: number): void {
    const currentBlocks = form.getValues("blocks");
    const remaining = currentBlocks.filter((_, currentIndex) => currentIndex !== index);
    const nextBlocks = remaining.map((b, currentIndex) => ({
      ...b,
      gate_pass_threshold:
        currentIndex === remaining.length - 1 &&
        (b.gate_pass_threshold === null || b.gate_pass_threshold === 90)
          ? 80
          : b.gate_pass_threshold,
    }));
    replace(nextBlocks);
  }

  function toggleSubcompetenceId(id: string): void {
    const selected = values.subcompetence_ids.includes(id);
    const next = selected
      ? values.subcompetence_ids.filter((x) => x !== id)
      : [...values.subcompetence_ids, id];
    form.setValue("subcompetence_ids", next, { shouldValidate: true });
  }

  return {
    form,
    values,
    blockFields,
    addBlock,
    removeBlock,
    toggleSubcompetenceId,
    subcompetenceError,
  };
}

