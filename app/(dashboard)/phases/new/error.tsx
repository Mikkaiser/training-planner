"use client";

import * as React from "react";
import Link from "next/link";

export default function NewPhaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="p-6">
      <div className="glass rounded-xl border border-border p-5">
        <div className="text-lg font-semibold text-tp-primary">Could not open</div>
        <div className="mt-2 text-sm text-tp-secondary">Please try again.</div>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={reset} className="tp-plan-save-btn">
            Retry
          </button>
          <Link href="/plans" className="tp-ghost-btn text-center">
            Back
          </Link>
        </div>
        <pre className="sr-only">{error.digest ?? error.message}</pre>
      </div>
    </div>
  );
}

