"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { TrainingPlannerLogo } from "@/components/brand/training-planner-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Check your email for a reset link.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Card className="w-full glass">
      <CardHeader className="space-y-4">
        <div className="flex justify-center pb-1">
          <TrainingPlannerLogo variant="stacked" priority />
        </div>
        <CardTitle className="text-2xl font-bold text-tp-primary">
          Forgot password
        </CardTitle>
        <p className="text-sm text-tp-secondary">
          Enter your account email and we&apos;ll send you a link to choose a new
          password.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {sent ? (
          <div
            className="rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-tp-primary"
            role="status"
          >
            If an account exists for that email, we&apos;ve sent a reset link.
            Check your inbox (and spam) and open the link to set a new password.
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="forgot-email" className="text-tp-secondary">
              Email
            </Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={sent}
              {...register("email")}
            />
            {errors.email?.message ? (
              <p className="text-xs text-negative">{errors.email.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={submitting || sent}
            className="w-full"
            size="lg"
          >
            <Mail className="mr-2 h-5 w-5 text-primary-foreground" />
            {submitting ? "Sending…" : sent ? "Email sent" : "Send reset link"}
          </Button>
        </form>

        <p className="text-center text-sm text-tp-secondary">
          <Link
            href="/login"
            className="font-medium text-tp-accent-label underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
