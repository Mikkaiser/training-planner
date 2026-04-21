"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlanDraft } from "@/lib/training-plans/types";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Manual-save hook for the training plan editor.
 *
 * The previous iteration auto-saved on every change, which caused surprising
 * writes and intermittent crashes. Now the editor drives persistence via an
 * explicit Save button — this hook only:
 *   1. Tracks dirty state by hashing the draft.
 *   2. Exposes a `save()` entry point that performs the INSERT/UPDATE.
 *   3. Reports the last save outcome (saved / error + message) to the UI.
 */
export function useTrainingPlanSave({
  draft,
  createdBy,
  enabled,
  onFirstSave,
}: {
  draft: PlanDraft;
  createdBy: string;
  enabled: boolean;
  onFirstSave?: (planId: string) => void;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [state, setState] = useState<SaveState>("idle");
  const [planId, setPlanId] = useState<string | null>(draft.id ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastSavedHashRef = useRef<string>("");
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const externalDirtyRef = useRef<boolean>(false);

  const canSave =
    enabled && draft.name.trim().length >= 3 && Boolean(draft.start_date);

  const hash = useMemo(() => {
    return JSON.stringify({
      id: planId,
      name: draft.name,
      description: draft.description,
      status: draft.status,
      start_date: draft.start_date,
      color: draft.color,
    });
  }, [
    draft.color,
    draft.description,
    draft.name,
    draft.start_date,
    draft.status,
    planId,
  ]);

  useEffect(() => {
    if (state === "saving") return;
    const isDirty =
      externalDirtyRef.current || hash !== lastSavedHashRef.current;
    setState(isDirty ? "dirty" : "idle");
    // state is intentionally excluded to avoid feedback loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  useEffect(() => {
    return () => {
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
    };
  }, []);

  async function save(): Promise<string> {
    if (!canSave) throw new Error("missing_required_fields");
    setState("saving");
    setErrorMessage(null);
    try {
      let id = planId ?? "";
      if (!planId) {
        const { data, error } = await supabase
          .from("training_plans")
          .insert({
            name: draft.name.trim(),
            description: draft.description?.trim() || null,
            status: draft.status,
            start_date: draft.start_date,
            color: draft.color,
            created_by: createdBy,
          })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id as string;
        setPlanId(id);
        onFirstSave?.(id);
      } else {
        const { error } = await supabase
          .from("training_plans")
          .update({
            name: draft.name.trim(),
            description: draft.description?.trim() || null,
            status: draft.status,
            start_date: draft.start_date,
            color: draft.color,
          })
          .eq("id", planId);
        if (error) throw error;
      }

      lastSavedHashRef.current = JSON.stringify({
        id,
        name: draft.name,
        description: draft.description,
        status: draft.status,
        start_date: draft.start_date,
        color: draft.color,
      });
      externalDirtyRef.current = false;
      setState("saved");
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
      savedResetRef.current = setTimeout(() => setState("idle"), 2000);
      return id;
    } catch (err) {
      const msg =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
          ? String((err as { message: string }).message)
          : "Save failed.";
      // eslint-disable-next-line no-console
      console.error("Training plan save failed:", err);
      setErrorMessage(msg);
      setState("error");
      throw err instanceof Error ? err : new Error("save_failed");
    }
  }

  return {
    planId,
    state,
    canSave,
    errorMessage,
    save,
    /** Call after loading server state to treat the current draft as clean. */
    markSavedHash(hashToUse: string) {
      lastSavedHashRef.current = hashToUse;
      externalDirtyRef.current = false;
      setState("idle");
    },
    /** Mark dirty due to side state (e.g. phases list) that isn't in `draft`. */
    markExternalDirty() {
      externalDirtyRef.current = true;
      setState((cur) => (cur === "saving" ? cur : "dirty"));
    },
    /** Clear external-dirty flag after an external save (e.g. phases save). */
    markExternalClean() {
      externalDirtyRef.current = false;
      if (hash === lastSavedHashRef.current) setState("idle");
    },
  };
}
