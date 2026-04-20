import { ThemedLogo } from "@/components/brand/themed-logo";

export function AuthFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="auth-page-footer shrink-0 px-4 py-3">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-1 text-center">
        <ThemedLogo variant="footerMark" className="h-7 w-7" />
        <p className="text-2xs leading-tight text-tp-muted">
          © {year} Training Planner
        </p>
      </div>
    </footer>
  );
}
