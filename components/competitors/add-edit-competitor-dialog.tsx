"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
import { useCreateCompetitor } from "@/lib/hooks/use-create-competitor";
import { useTrainingPlans } from "@/lib/hooks/use-training-plans";
import { useUpdateCompetitor } from "@/lib/hooks/use-update-competitor";

type DialogMode = "add" | "edit";

type AddEditCompetitorDialogProps = {
  mode: DialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitorId?: string;
  initialFullName?: string;
  initialEmail?: string | null;
  initialAvatarColor?: string;
  defaultPlanId?: string | null;
};

type FormValues = {
  fullName: string;
  email: string;
  avatarColor: CompetitorAvatarSwatch;
  sharedPlanId: string;
};

export function AddEditCompetitorDialog({
  mode,
  open,
  onOpenChange,
  competitorId,
  initialFullName = "",
  initialEmail = "",
  initialAvatarColor = SWATCHES[0],
  defaultPlanId = null,
}: AddEditCompetitorDialogProps) {
  const createMutation = useCreateCompetitor();
  const updateMutation = useUpdateCompetitor(competitorId ?? "");
  const { data: plans = [] } = useTrainingPlans();

  const form = useForm<FormValues>({
    defaultValues: {
      fullName: initialFullName,
      email: initialEmail ?? "",
      avatarColor: SWATCHES.includes(initialAvatarColor as CompetitorAvatarSwatch)
        ? (initialAvatarColor as CompetitorAvatarSwatch)
        : SWATCHES[0],
      sharedPlanId: defaultPlanId ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      fullName: initialFullName,
      email: initialEmail ?? "",
      avatarColor: SWATCHES.includes(initialAvatarColor as CompetitorAvatarSwatch)
        ? (initialAvatarColor as CompetitorAvatarSwatch)
        : SWATCHES[0],
      sharedPlanId: defaultPlanId ?? "",
    });
  }, [defaultPlanId, form, initialAvatarColor, initialEmail, initialFullName, open]);

  const sharedPlans = useMemo(
    () =>
      plans.filter(
        (plan) => (plan.plan_type ?? "shared") === "shared"
      ),
    [plans]
  );

  const isPending =
    createMutation.isPending || updateMutation.isPending;

  function closeIfSuccess() {
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Competitor" : "Edit Competitor"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new competitor and optionally attach them to a shared plan."
              : "Update this competitor's profile details."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(async (values) => {
            if (mode === "add") {
              await createMutation.mutateAsync({
                fullName: values.fullName,
                email: values.email,
                avatarColor: values.avatarColor,
                sharedPlanId: values.sharedPlanId || null,
              });
              closeIfSuccess();
              return;
            }

            if (!competitorId) return;
            await updateMutation.mutateAsync({
              fullName: values.fullName,
              email: values.email,
              avatarColor: values.avatarColor,
            });
            closeIfSuccess();
          })}
          className="plan-add-competitor-form"
        >
          <div>
            <Label htmlFor="competitor-name" className="tp-plan-label">
              Full name
            </Label>
            <Input
              id="competitor-name"
              required
              className="glass-input"
              placeholder="e.g. Mai"
              {...form.register("fullName")}
            />
          </div>

          <div>
            <Label htmlFor="competitor-email" className="tp-plan-label">
              Email (optional)
            </Label>
            <Input
              id="competitor-email"
              type="email"
              className="glass-input"
              placeholder="competitor@example.com"
              {...form.register("email")}
            />
          </div>

          <Controller
            control={form.control}
            name="avatarColor"
            render={({ field }) => (
              <CompetitorAvatarSwatchPicker value={field.value} onChange={field.onChange} />
            )}
          />

          {mode === "add" ? (
            <div>
              <Label htmlFor="competitor-shared-plan" className="tp-plan-label">
                Assign to shared plan (optional)
              </Label>
              <select
                id="competitor-shared-plan"
                className="glass-input h-10 w-full rounded-md border border-border px-3 text-sm text-tp-primary"
                {...form.register("sharedPlanId")}
              >
                <option value="">No active plan</option>
                {sharedPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name?.trim() || "Untitled plan"}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="plan-add-competitor-form__actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? mode === "add"
                  ? "Saving..."
                  : "Updating..."
                : mode === "add"
                  ? "Add Competitor"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
