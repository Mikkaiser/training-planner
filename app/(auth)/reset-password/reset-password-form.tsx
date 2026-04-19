"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { TrainingPlannerLogo } from "@/components/brand/training-planner-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function AuthBrandRow() {
  return (
    <div className="flex justify-center pb-1">
      <TrainingPlannerLogo variant="stacked" priority className="max-w-[200px]" />
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const resolvedRef = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    function markReady() {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      setSessionReady(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) markReady();
      }
    );

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error(error.message);
          if (!resolvedRef.current) {
            resolvedRef.current = true;
            setSessionError(true);
          }
          return;
        }
        window.history.replaceState(null, "", "/reset-password");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        markReady();
        return;
      }
      await new Promise((r) => setTimeout(r, 3000));
      const { data: { session: retry } } = await supabase.auth.getSession();
      if (retry) {
        markReady();
      } else if (!resolvedRef.current) {
        resolvedRef.current = true;
        setSessionError(true);
      }
    })();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        toast.error(refreshError.message);
        return;
      }

      toast.success("Password updated.");
      router.push("/dashboard");
      router.refresh();
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

  if (sessionError) {
    return (
      <Card className="w-full glass">
        <CardHeader className="space-y-4">
          <AuthBrandRow />
          <CardTitle className="text-2xl font-bold text-tp-primary">
            Link invalid or expired
          </CardTitle>
          <p className="text-sm text-tp-secondary">
            Open the reset link from your email, or request a new one.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/forgot-password"
            className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full")}
          >
            Request a new link
          </Link>
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

  if (!sessionReady) {
    return (
      <Card className="w-full glass">
        <CardContent className="py-10 text-center text-sm text-tp-secondary">
          Verifying your reset link…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full glass">
      <CardHeader className="space-y-4">
        <AuthBrandRow />
        <CardTitle className="text-2xl font-bold text-tp-primary">
          Set a new password
        </CardTitle>
        <p className="text-sm text-tp-secondary">
          Choose a strong password for your account.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-tp-secondary">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password?.message ? (
              <p className="text-xs text-negative">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-tp-secondary">
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword?.message ? (
              <p className="text-xs text-negative">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            <KeyRound className="mr-2 h-5 w-5 text-primary-foreground" />
            {submitting ? "Updating…" : "Update password"}
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
