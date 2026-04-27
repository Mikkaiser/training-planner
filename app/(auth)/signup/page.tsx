import { LoginForm } from "../login/login-form";

export default function SignupPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const next =
    typeof searchParams?.next === "string" ? searchParams?.next : "/plans";

  return (
    <div className="mx-auto w-full max-w-lg">
      <LoginForm nextPath={next} variant="signup" />
    </div>
  );
}
