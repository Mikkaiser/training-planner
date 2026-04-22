"use client";

import { Controller, useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CompetitorAvatarSwatchPicker,
  SWATCHES,
  type CompetitorAvatarSwatch,
} from "@/components/plan-detail/competitor-avatar-swatch-picker";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { useAddCompetitor } from "@/lib/hooks/use-add-competitor";

interface FormValues {
  fullName: string;
  avatarColor: CompetitorAvatarSwatch;
}

export function AddCompetitorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { detail, planId } = usePlanDetailContext();

  const form = useForm<FormValues>({
    defaultValues: {
      fullName: "",
      avatarColor: SWATCHES[0],
    },
  });

  const mutation = useAddCompetitor({
    planId,
    detail,
    onClose: () => onOpenChange(false),
    onReset: () => form.reset(),
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
          onSubmit={form.handleSubmit((values) => {
            mutation.mutate(values);
          })}
          className="plan-add-competitor-form"
        >
          <div>
            <Label htmlFor="comp-name" className="tp-plan-label">
              Full name
            </Label>
            <Input
              id="comp-name"
              placeholder="e.g. Fatima"
              required
              className="glass-input"
              {...form.register("fullName")}
            />
          </div>

          <Controller
            control={form.control}
            name="avatarColor"
            render={({ field }) => (
              <CompetitorAvatarSwatchPicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

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
