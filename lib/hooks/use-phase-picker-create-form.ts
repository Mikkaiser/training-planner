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

export function usePhasePickerCreateForm(): UsePhasePickerCreateFormReturn {
  const form = useForm<CreatePhaseValues>({
    // `zodResolver()` typing doesn't preserve the inferred schema value type.
    // This is safe because `createPhaseSchema` is the single source of truth.
    resolver: zodResolver(createPhaseSchema) as unknown as Resolver<CreatePhaseValues>,
    defaultValues: {
      name: "",
      duration_weeks: 4,
      subcompetence_ids: [],
      blocks: [
        {
          name: "Block 1",
          subcompetence_id: null,
          gate_pass_threshold: 70,
          gate_type: "phase_gate",
        },
      ],
      newSubcompetence: {
        enabled: false,
        name: "",
        color: "var(--color-text-accent)",
        icon: "dot",
      },
    },
    mode: "onChange",
  });

  const { fields: blockFields, append, remove } = useFieldArray({
    control: form.control,
    name: "blocks",
  });

  const values = form.watch();

  const subcompetenceError =
    typeof form.formState.errors.subcompetence_ids?.message === "string"
      ? form.formState.errors.subcompetence_ids.message
      : undefined;

  function addBlock(): void {
    const nextLen = blockFields.length + 1;
    // Default: last block is phase gate; earlier blocks are block gates.
    const nextBlocks = values.blocks.map((b, i) => ({
      ...b,
      gate_type: i === values.blocks.length - 1 ? "block_gate" : b.gate_type,
    }));
    form.setValue("blocks", nextBlocks, { shouldValidate: true });
    append({
      name: `Block ${nextLen}`,
      subcompetence_id: null,
      gate_pass_threshold: 70,
      gate_type: "phase_gate",
    });
  }

  function removeBlock(index: number): void {
    remove(index);
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

