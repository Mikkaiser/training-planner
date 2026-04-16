import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const next =
    typeof searchParams?.next === "string" ? searchParams?.next : "/dashboard";

  return (
    <main className="relative min-h-screen overflow-hidden bg-accent-radial">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(700px circle at 20% 10%, rgba(219,253,107,0.14), transparent 55%), radial-gradient(900px circle at 80% 90%, rgba(219,253,107,0.10), transparent 60%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-lg items-center px-6 py-16">
        <LoginForm nextPath={next} />
      </div>
    </main>
  );
}

