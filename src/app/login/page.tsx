"use client";

import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { APP_ROUTES } from "@/lib/routes";

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    const redirectTo = `${window.location.origin}${APP_ROUTES.authCallback}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  return (
    <main className="tp-page" style={{ justifyContent: "center", alignItems: "center", padding: "24px" }}>
      <section className="tp-card" style={{ width: "100%", maxWidth: "420px", padding: "28px", boxShadow: "var(--shadow-lg)" }}>
        <div className="tp-logo" style={{ marginBottom: "18px" }}>
          <div className="tp-logo-mark tp-mono">T</div>
          <span>Training Planner</span>
        </div>

        <h1 style={{ margin: 0, fontSize: "32px", letterSpacing: "-0.03em" }}>Welcome back</h1>
        <p style={{ color: "var(--ink-2)", marginTop: "10px", marginBottom: "24px", fontSize: "14px" }}>
          Continue with your instructor account to open your plans.
        </p>

        <button className="tp-btn tp-btn-primary" style={{ width: "100%", padding: "12px 16px" }} onClick={handleGoogleSignIn}>
          <LogIn size={16} />
          Continue with Google
        </button>
      </section>
    </main>
  );
}
