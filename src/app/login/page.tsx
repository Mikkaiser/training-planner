import { LogIn } from "lucide-react";
import { signIn } from "@/auth";
import { APP_ROUTES } from "@/lib/routes";
import { Logo } from "@/components/layout/Logo";

export default function LoginPage() {
  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: APP_ROUTES.home });
  }

  return (
    <main className="tp-page" style={{ justifyContent: "center", alignItems: "center", padding: "24px" }}>
      <section className="tp-card" style={{ width: "100%", maxWidth: "420px", padding: "28px", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ marginBottom: "18px" }}>
          <Logo variant="lockup" size={30} />
        </div>

        <h1 style={{ margin: 0, fontSize: "32px", letterSpacing: "-0.03em" }}>Welcome back</h1>
        <p style={{ color: "var(--ink-2)", marginTop: "10px", marginBottom: "24px", fontSize: "14px" }}>
          Continue with your instructor account to open your plans.
        </p>

        <form action={signInWithGoogle}>
          <button type="submit" className="tp-btn tp-btn-primary" style={{ width: "100%", padding: "12px 16px" }}>
            <LogIn size={16} />
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}
