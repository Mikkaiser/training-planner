import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AuthCodeErrorPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold text-tp-primary">Sign-in failed</h1>
        <p className="text-sm text-tp-secondary">
          We couldn&apos;t complete the OAuth sign-in. The link may have expired, or
          sign-in was cancelled.
        </p>
      </div>
      <Link
        href="/login"
        className={cn(buttonVariants({ size: "lg" }))}
      >
        Back to sign in
      </Link>
    </main>
  );
}
