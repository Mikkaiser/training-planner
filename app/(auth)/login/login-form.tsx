"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ThemedLogo } from "@/components/brand/themed-logo";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({
  nextPath,
  variant = "signin",
}: {
  nextPath: string;
  variant?: "signin" | "signup";
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isSignup = variant === "signup";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            toast.error(refreshError.message);
            return;
          }
          toast.success("Account created.");
          router.push(nextPath);
          router.refresh();
          return;
        }
        toast.success("Check your email for a confirmation link.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        toast.error(error.message);
        return;
      }

      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        toast.error(refreshError.message);
        return;
      }

      toast.success("Signed in.");
      router.push(nextPath);
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

  const nextQuery = `?next=${encodeURIComponent(nextPath)}`;

  return (
    <Card className="login-auth-card glass-panel--login relative z-[1] w-full glass">
      <CardHeader className="space-y-4">
        <div className="login-auth-logo-wrap flex justify-center pb-1">
          <ThemedLogo
            variant="authFull"
            priority
            className="h-auto w-[200px]"
          />
        </div>
        <CardTitle className="login-auth-title text-tp-primary">
          {isSignup ? "Create account" : "Sign in"}
        </CardTitle>
        <p className="login-auth-subtitle text-tp-secondary">
          {isSignup
            ? "Use Google or email. New accounts get an instructor profile automatically."
            : "Continue with Google, or sign in with your email and password."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <OAuthButtons nextPath={nextPath} />
        <div className="relative flex items-center gap-3">
          <Separator className="flex-1 bg-border" />
          <span className="shrink-0 text-xs uppercase tracking-wide text-tp-muted">
            or email
          </span>
          <Separator className="flex-1 bg-border" />
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email" className="login-auth-label">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="login-auth-input glass-input"
              {...register("email")}
            />
            {errors.email?.message ? (
              <p className="text-xs text-negative">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="login-auth-label">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="login-auth-input glass-input"
              {...register("password")}
            />
            {errors.password?.message ? (
              <p className="text-xs text-negative">{errors.password.message}</p>
            ) : null}
            {!isSignup ? (
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="login-auth-forgot font-medium text-tp-accent-label underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="tp-plan-save-btn login-auth-submit w-full"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5 text-primary-foreground" />
            {submitting
              ? isSignup
                ? "Creating account…"
                : "Signing in…"
              : isSignup
                ? "Sign up with email"
                : "Sign in"}
          </Button>
        </form>
        <p className="login-auth-switch text-center text-tp-secondary">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link
                href={`/login${nextQuery}`}
                className="font-medium text-tp-accent-label underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              Need an account?{" "}
              <Link
                href={`/signup${nextQuery}`}
                className="font-medium text-tp-accent-label underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
