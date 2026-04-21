"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { planDetailQueryKey } from "@/lib/plan-detail/use-plan-detail";

const SWATCHES = [
  "var(--avatar-swatch-1)",
  "var(--avatar-swatch-2)",
  "var(--avatar-swatch-3)",
  "var(--avatar-swatch-4)",
  "var(--avatar-swatch-5)",
  "var(--avatar-swatch-6)",
] as const;

export function AddCompetitorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { detail, planId } = usePlanDetailContext();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(SWATCHES[0]);

  const reset = () => {
    setFullName("");
    setAvatarColor(SWATCHES[0]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const name = fullName.trim();
      if (!name) throw new Error("Name is required");

      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      const insertRes = await supabase
        .from("competitors")
        .insert({
          full_name: name,
          avatar_color: avatarColor,
          created_by: uid,
        })
        .select("id")
        .single();

      if (insertRes.error) throw insertRes.error;

      const firstPhase = detail.phases[0];
      const firstBlockId = detail.orderedBlockIds[0] ?? null;

      const { error: progressErr } = await supabase
        .from("competitor_progress")
        .insert({
          competitor_id: insertRes.data.id,
          training_plan_id: planId,
          current_phase_id: firstPhase?.id ?? null,
          current_topic_id: firstBlockId,
          status: "not_started",
        });

      if (progressErr) throw progressErr;

      return name;
    },
    onSuccess: (name) => {
      toast.success(`${name} added`);
      queryClient.invalidateQueries({ queryKey: planDetailQueryKey(planId) });
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Failed to add competitor";
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add competitor</DialogTitle>
          <DialogDescription>
            They&apos;ll appear on this plan&apos;s roadmap immediately.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="plan-add-competitor-form"
        >
          <div>
            <Label htmlFor="comp-name" className="tp-plan-label">
              Full name
            </Label>
            <Input
              id="comp-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Fatima"
              required
              className="glass-input"
            />
          </div>

          <div>
            <Label className="tp-plan-label">Avatar color</Label>
            <div className="plan-add-competitor-form__swatches">
              {SWATCHES.map((c) => {
                const active = avatarColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className="plan-add-competitor-form__swatch"
                    data-active={active ? "true" : undefined}
                    style={{
                      background: c,
                    }}
                    aria-label={`Pick ${c}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="plan-add-competitor-form__actions">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="tp-ghost-btn plan-add-competitor-form__cancel"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="tp-plan-save-btn plan-add-competitor-form__save"
              style={{ background: "var(--plan-accent, var(--color-accent))" }}
            >
              {mutation.isPending ? "Adding…" : "Add Competitor"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
