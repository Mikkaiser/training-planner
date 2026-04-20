"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlanDraft } from "@/lib/training-plans/types";

export type AutoSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function useTrainingPlanAutoSave({
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

  const [state, setState] = useState<AutoSaveState>("idle");
  const [planId, setPlanId] = useState<string | null>(draft.id ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastSavedHashRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<string> | null>(null);

  const canSave = enabled && draft.name.trim().length >= 3 && Boolean(draft.start_date);

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

  async function persist(): Promise<string> {
    setState("saving");
    setErrorMessage(null);
    try {
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
        const id = data.id as string;
        setPlanId(id);
        onFirstSave?.(id);
        lastSavedHashRef.current = JSON.stringify({
          id,
          name: draft.name,
          description: draft.description,
          status: draft.status,
          start_date: draft.start_date,
          color: draft.color,
        });
        setState("saved");
        if (savedResetRef.current) clearTimeout(savedResetRef.current);
        savedResetRef.current = setTimeout(() => setState("idle"), 2000);
        return id;
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

      lastSavedHashRef.current = hash;
      setState("saved");
      setErrorMessage(null);
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
      savedResetRef.current = setTimeout(() => setState("idle"), 2000);
      return planId ?? "";
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
          ? String((err as { message: string }).message)
          : "Autosave failed.";
      // Helpful during dev: the UI shows "Save failed" but we want the real cause.
      // eslint-disable-next-line no-console
      console.error("Training plan autosave failed:", err);
      setErrorMessage(msg);
      setState("error");
      if (retryRef.current) clearTimeout(retryRef.current);
      retryRef.current = setTimeout(() => {
        void persist().catch(() => {
          // Swallow: background retry should never crash the page.
        });
      }, 2000);
      // Re-throw so callers like ensureSaved() can handle failures,
      // but callers MUST catch to avoid unhandled runtime errors.
      throw err instanceof Error ? err : new Error("autosave_failed");
    }
  }

  useEffect(() => {
    if (!canSave) {
      setState(hash !== lastSavedHashRef.current ? "dirty" : "idle");
      return;
    }

    if (hash === lastSavedHashRef.current) {
      if (state === "dirty") setState("idle");
      return;
    }

    setState("dirty");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist().catch(() => {
        // Swallow: autosave is best-effort and represented via UI state.
      });
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, canSave]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
    };
  }, []);

  return {
    planId,
    state,
    canSave,
    errorMessage,
    async ensureSaved(): Promise<string> {
      if (planId) return planId;
      if (!canSave) throw new Error("missing_required_fields");
      if (inFlightRef.current) return inFlightRef.current;
      inFlightRef.current = persist()
        .finally(() => {
          inFlightRef.current = null;
        }) as Promise<string>;
      return inFlightRef.current;
    },
    markSavedHash(hashToUse: string) {
      lastSavedHashRef.current = hashToUse;
      setState("idle");
    },
  };
}

