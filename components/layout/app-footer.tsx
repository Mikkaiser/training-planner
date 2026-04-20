import Link from "next/link";

import { ThemedLogo } from "@/components/brand/themed-logo";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border py-6">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center transition-opacity hover:opacity-90"
          aria-label="Training Planner home"
        >
          <ThemedLogo variant="footerMark" />
        </Link>
        <p className="text-center text-xs text-tp-muted sm:text-right">
          © {year} Training Planner
        </p>
      </div>
    </footer>
  );
}
