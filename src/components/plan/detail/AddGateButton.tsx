"use client";

import { useTransition } from "react";
import { createGate } from "@/actions/blocks";
import { PlusIcon } from "@/components/ui/icons";

/**
 * Shown in place of the gate marker when a block has no checkpoint, so removing
 * one is reversible rather than a one-way door.
 */
export function AddGateButton({ planId, blockId }: { planId: string; blockId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="tp-ghost"
      style={{ padding: 10 }}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await createGate({ planId, blockId });
        })
      }
    >
      <PlusIcon size={11} /> Add Gate
    </button>
  );
}
