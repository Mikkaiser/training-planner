"use client";

import * as React from "react";
import Link from "next/link";

export default function PlanDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="glass w-full max-w-md rounded-xl border border-border p-5">
        <div className="text-lg font-semibold text-tp-primary">Plan failed to load</div>
        <div className="mt-2 text-sm text-tp-secondary">
          Please retry. You can also go back to your plans list.
        </div>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={reset} className="tp-plan-save-btn flex-1">
            Retry
          </button>
          <Link href="/plans" className="tp-ghost-btn flex-1 text-center">
            Back
          </Link>
        </div>
        <pre className="sr-only">{error.digest ?? error.message}</pre>
      </div>
    </div>
  );
}

