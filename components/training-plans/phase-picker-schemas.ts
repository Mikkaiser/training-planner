"use client";

import { z } from "zod";

export const blockSchema = z.object({
  name: z.string().min(1, "Block name is required."),
  subcompetence_id: z.string().nullable(),
  gate_pass_threshold: z.coerce.number().min(0).max(100).nullable(),
});

export const createPhaseSchema = z.object({
  name: z.string().min(1, "Phase name is required."),
  subcompetence_ids: z
    .array(z.string())
    .min(1, "Pick at least one subcompetence."),
  blocks: z.array(blockSchema).default([]),
});

export type CreatePhaseValues = z.infer<typeof createPhaseSchema>;

