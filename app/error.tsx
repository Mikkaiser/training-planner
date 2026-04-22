"use client";

import * as React from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="glass w-full max-w-md rounded-xl border border-border p-5">
        <div className="text-lg font-semibold text-tp-primary">Something went wrong</div>
        <div className="mt-2 text-sm text-tp-secondary">
          An unexpected error occurred. Please try again.
        </div>
        <button type="button" onClick={reset} className="tp-plan-save-btn mt-4 w-full">
          Retry
        </button>
        {/* Intentionally avoid rendering raw error messages to users. */}
        <pre className="sr-only">{error.digest ?? error.message}</pre>
      </div>
    </div>
  );
}

