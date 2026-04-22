"use client";

import * as React from "react";
import Link from "next/link";

export default function EditPlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="p-6">
      <div className="glass rounded-xl border border-border p-5">
        <div className="text-lg font-semibold text-tp-primary">Editor failed to load</div>
        <div className="mt-2 text-sm text-tp-secondary">
          Please retry. If it keeps failing, go back to your plans list.
        </div>
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

