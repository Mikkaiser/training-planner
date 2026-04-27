import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const next =
    typeof searchParams?.next === "string" ? searchParams?.next : "/plans";

  return (
    <div className="relative z-[1] mx-auto w-full max-w-lg">
      <LoginForm nextPath={next} variant="signin" />
    </div>
  );
}
