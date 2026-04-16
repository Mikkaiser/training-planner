"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Signed in.");
      router.push(nextPath);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to sign in.");
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
    <Card className="glass-panel w-full border-accent-border/70 bg-[rgba(35,39,61,0.65)] shadow-glow">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-secondary">
          <GraduationCap className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium tracking-wide text-secondary">
            Training Planner
          </span>
        </div>
        <CardTitle className="text-xl font-semibold text-secondary">
          Sign in
        </CardTitle>
        <p className="text-sm text-[rgba(244,253,217,0.7)]">
          Use your Supabase email/password account.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[rgba(244,253,217,0.85)]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="border-accent-border/70 bg-[rgba(28,31,51,0.35)] text-secondary placeholder:text-[rgba(244,253,217,0.35)]"
              {...register("email")}
            />
            {errors.email?.message ? (
              <p className="text-xs text-negative">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[rgba(244,253,217,0.85)]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="border-accent-border/70 bg-[rgba(28,31,51,0.35)] text-secondary"
              {...register("password")}
            />
            {errors.password?.message ? (
              <p className="text-xs text-negative">{errors.password.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

